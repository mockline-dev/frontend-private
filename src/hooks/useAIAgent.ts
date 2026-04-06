'use client';

import { createAIStream } from '@/api/aiStream/createAIStream';
import { patchAIStream } from '@/api/aiStream/patchAIStream';
import { fetchFileContent } from '@/api/files/fetchFileContent';
import { createUpload } from '@/api/uploads/createUpload';
import { defaultAiModel } from '@/config/environment';
import { type FileUpdate } from '@/containers/workspace/components/FileUpdatePreview';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { filesService, type File as FileType } from '@/services/api/files';
import { messagesService, type Message } from '@/services/api/messages';
import { type AIAgentStepEvent, type AIFileDiffEvent, type AIFileAppliedEvent, type AIStreamContext, type AIWritePreviewEvent } from '@/types/feathers';
import { validatePrompt } from '@/utils/promptValidation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_CONTEXT_FILE_TREE_ENTRIES = 250;

interface StreamMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

const STREAM_POLL_INTERVAL_MS = 1200;
const STREAM_POLL_TIMEOUT_MS = 90000;
const INITIAL_MESSAGES_LIMIT = 10;
const OLDER_MESSAGES_BATCH_SIZE = 50;
const FILE_UPDATE_PATTERN =
    /(?:^|\n)\s*(?:#{1,6}\s*)?(?:[-*]\s*)?\*{0,2}\s*FILE_UPDATE\s*:\s*(.+?)\s*\*{0,2}\s*\n\s*(?:#{1,6}\s*)?(?:[-*]\s*)?\*{0,2}\s*ACTION\s*:\s*(create|modify|delete)\s*\*{0,2}\s*\n\s*(?:#{1,6}\s*)?(?:[-*]\s*)?\*{0,2}\s*DESCRIPTION\s*:\s*(.+?)\s*\*{0,2}\s*\n```([\w+-]*)\n([\s\S]*?)```/gi;
const SEARCH_REPLACE_BLOCK_PATTERN = /<<<<<<<\s*SEARCH\s*\n([\s\S]*?)\n=======\n([\s\S]*?)\n>>>>>>>\s*REPLACE/g;

interface SearchReplaceBlock {
    search: string;
    replace: string;
}

export interface UseAIAgentReturn {
    messages: Message[];
    hasOlderMessages: boolean;
    isLoadingOlderMessages: boolean;
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isStreaming: boolean;
    agentSteps: AIAgentStepEvent[];
    isApplyingUpdates: boolean;
    applyingUpdateKeys: string[];
    fileUpdates: FileUpdate[];
    retryingMessageId: string | null;
    handleSubmit: (e: React.FormEvent) => void;
    retryMessage: (messageId: string) => Promise<void>;
    loadOlderMessages: () => Promise<void>;
    handleAcceptUpdate: (update: FileUpdate) => Promise<void>;
    handleRejectUpdate: (update: FileUpdate) => void;
    handleAcceptAllUpdates: () => Promise<void>;
    stopStream: () => void;
}

interface FileAppliedEvent {
    action: FileUpdate['action'];
    filename: string;
    content?: string;
}

interface AIStreamChunkEvent {
    projectId: string;
    content: string;
    fullContent?: string;
    done: boolean;
}

interface AIStreamFileUpdatesEvent {
    projectId: string;
    updates: FileUpdate[];
}

type AIStreamWritePreviewEvent = AIWritePreviewEvent;

const STREAMING_MESSAGE_ID = '__mocky_streaming__';

function toId(value: unknown): string {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'object' && value !== null) {
        const maybe = value as { _id?: unknown; id?: unknown; toString?: () => string };
        if (typeof maybe._id === 'string') return maybe._id;
        if (typeof maybe.id === 'string') return maybe.id;
        if (typeof maybe.toString === 'function') return maybe.toString();
    }
    return String(value);
}

function normalizePath(value: string): string {
    return value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '').trim();
}

function buildProjectContext(files: FileType[], selectedFile?: string, selectedFileContent?: string): AIStreamContext {
    const normalizedSelectedFile = selectedFile ? normalizePath(selectedFile) : undefined;
    const fileTree = files.slice(0, MAX_CONTEXT_FILE_TREE_ENTRIES).map((file) => ({
        path: normalizePath(file.name),
        size: file.size,
        fileType: file.fileType
    }));

    const context: AIStreamContext = {
        files: fileTree.map((entry) => entry.path),
        fileTree,
        ...(normalizedSelectedFile ? { selectedFile: normalizedSelectedFile } : {}),
        ...(selectedFileContent ? { selectedContent: selectedFileContent } : {}),
        ...(normalizedSelectedFile ? { pinnedFiles: [normalizedSelectedFile], allowedEditFiles: [normalizedSelectedFile] } : {})
    };

    return context;
}

function parseFileUpdatesFromContent(content: string): FileUpdate[] {
    if (!content) return [];

    const updates: FileUpdate[] = [];
    const normalized = content.replace(/\r\n/g, '\n');

    const clean = (value: string) =>
        value
            .trim()
            .replace(/^\*+|\*+$/g, '')
            .replace(/^`+|`+$/g, '')
            .trim();

    let match: RegExpExecArray | null;
    while ((match = FILE_UPDATE_PATTERN.exec(normalized)) !== null) {
        const rawFilename = clean(match[1] ?? '');
        const filename = normalizePath(rawFilename.replace(/^\[\s*/, '').replace(/\s*\]$/, ''));
        const action = clean(match[2] ?? '').toLowerCase() as FileUpdate['action'];
        const description = clean(match[3] ?? '');
        const language = clean(match[4] ?? '') || 'text';
        const nextContent = match[5] ?? '';

        if (!filename) continue;

        if (action === 'modify' && !SEARCH_REPLACE_BLOCK_PATTERN.test(nextContent)) {
            SEARCH_REPLACE_BLOCK_PATTERN.lastIndex = 0;
            continue;
        }

        SEARCH_REPLACE_BLOCK_PATTERN.lastIndex = 0;

        updates.push({
            filename,
            action,
            description,
            language,
            content: nextContent
        });
    }

    return updates;
}

function mergeFileUpdates(existing: FileUpdate[], incoming: FileUpdate[]): FileUpdate[] {
    if (incoming.length === 0) return existing;

    const map = new Map<string, FileUpdate>();

    for (const update of existing) {
        map.set(`${update.action}:${normalizePath(update.filename)}`, update);
    }

    for (const update of incoming) {
        map.set(`${update.action}:${normalizePath(update.filename)}`, update);
    }

    return Array.from(map.values());
}

function mergeAgentSteps(existing: AIAgentStepEvent[], incoming: AIAgentStepEvent[]): AIAgentStepEvent[] {
    if (incoming.length === 0) return existing;

    const map = new Map<string, AIAgentStepEvent>();
    for (const step of existing) {
        map.set(`${step.createdAt}:${step.type}:${step.title}`, step);
    }

    for (const step of incoming) {
        map.set(`${step.createdAt}:${step.type}:${step.title}`, step);
    }

    return Array.from(map.values()).sort((left, right) => left.createdAt - right.createdAt);
}

function inferLanguageFromFilename(filename: string): string {
    const ext = normalizePath(filename).split('.').pop()?.toLowerCase();

    switch (ext) {
        case 'ts':
        case 'tsx':
            return 'typescript';
        case 'js':
        case 'jsx':
            return 'javascript';
        case 'json':
            return 'json';
        case 'css':
            return 'css';
        case 'scss':
            return 'scss';
        case 'html':
            return 'html';
        case 'md':
            return 'markdown';
        case 'py':
            return 'python';
        case 'go':
            return 'go';
        case 'java':
            return 'java';
        case 'rs':
            return 'rust';
        case 'yml':
        case 'yaml':
            return 'yaml';
        default:
            return 'text';
    }
}

function toFileUpdateFromWritePreview(preview: AIStreamWritePreviewEvent): FileUpdate {
    const filename = normalizePath(preview.filename);

    return {
        filename,
        action: preview.action,
        description: preview.description || 'Proposed change',
        content: preview.newContent || '',
        language: inferLanguageFromFilename(filename)
    };
}

function toFileUpdateFromFileDiff(event: AIFileDiffEvent): FileUpdate {
    const filename = normalizePath(event.filename);

    return {
        filename,
        action: event.action,
        description: event.description ?? 'Proposed change',
        content: event.newContent,
        language: inferLanguageFromFilename(filename),
        updateId: event.updateId,
        ...(event.oldContent !== undefined ? { oldContent: event.oldContent } : {})
    };
}

function parseSearchReplaceBlocks(content: string): SearchReplaceBlock[] {
    if (!content) return [];

    const blocks: SearchReplaceBlock[] = [];
    const normalized = content.replace(/\r\n/g, '\n');
    let match: RegExpExecArray | null;

    while ((match = SEARCH_REPLACE_BLOCK_PATTERN.exec(normalized)) !== null) {
        blocks.push({
            search: match[1] ?? '',
            replace: match[2] ?? ''
        });
    }

    SEARCH_REPLACE_BLOCK_PATTERN.lastIndex = 0;
    return blocks;
}

function applySearchReplaceBlocks(original: string, blocks: SearchReplaceBlock[]): string {
    let result = original;

    for (const block of blocks) {
        if (!block.search) {
            throw new Error('Invalid patch: SEARCH block cannot be empty.');
        }

        const firstIndex = result.indexOf(block.search);
        if (firstIndex === -1) {
            throw new Error('Target snippet for patch was not found in the current file.');
        }

        const lastIndex = result.lastIndexOf(block.search);
        if (firstIndex !== lastIndex) {
            throw new Error('Target snippet appears multiple times. Patch must be unambiguous.');
        }

        result = `${result.slice(0, firstIndex)}${block.replace}${result.slice(firstIndex + block.search.length)}`;
    }

    return result;
}

async function resolveUpdatedContentForModify(update: FileUpdate, existing: FileType): Promise<string> {
    const patchBlocks = parseSearchReplaceBlocks(update.content);
    if (patchBlocks.length === 0) {
        throw new Error('Unsafe modify update: expected SEARCH/REPLACE blocks for partial edit.');
    }

    const current = await fetchFileContent({ fileId: existing._id });
    if (!current.success) {
        throw new Error(current.error || 'Failed to fetch current file content for patching.');
    }

    return applySearchReplaceBlocks(current.content, patchBlocks);
}

function findMatchingFile(files: FileType[], updateFilename: string): FileType | undefined {
    const target = normalizePath(updateFilename);
    const targetBase = target.split('/').pop() || target;

    const exact = files.find((f) => normalizePath(f.name) === target);
    if (exact) return exact;

    const byKeySuffix = files.find((f) => normalizePath(f.key).endsWith(`/${target}`) || normalizePath(f.key) === target);
    if (byKeySuffix) return byKeySuffix;

    const basenameMatches = files.filter((f) => {
        const name = normalizePath(f.name);
        return name === targetBase || name.endsWith(`/${targetBase}`);
    });

    return basenameMatches.length === 1 ? basenameMatches[0] : undefined;
}

function mergeMessagesById(existing: Message[], incoming: Message[]): Message[] {
    const map = new Map<string, Message>();

    for (const message of existing) {
        map.set(message._id, message);
    }

    for (const message of incoming) {
        map.set(message._id, message);
    }

    return Array.from(map.values()).sort((left, right) => {
        if (left.createdAt !== right.createdAt) {
            return left.createdAt - right.createdAt;
        }
        return left.updatedAt - right.updatedAt;
    });
}

function getUpdateKey(update: FileUpdate): string {
    return `${update.action}:${normalizePath(update.filename)}`;
}

async function validatePromptWithAI(prompt: string) {
    // Local validation prevents noisy 404s from optional external endpoints.
    return validatePrompt(prompt);
}

export function useAIAgent(
    projectId: string | undefined,
    files: FileType[],
    selectedFile: string | undefined,
    selectedFileContent: string | undefined,
    onFileApplied?: (event: FileAppliedEvent) => void
): UseAIAgentReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasOlderMessages, setHasOlderMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [oldestMessageCreatedAt, setOldestMessageCreatedAt] = useState<number | null>(null);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [agentSteps, setAgentSteps] = useState<AIAgentStepEvent[]>([]);
    const [applyingUpdateKeys, setApplyingUpdateKeys] = useState<string[]>([]);
    const [fileUpdates, setFileUpdates] = useState<FileUpdate[]>([]);
    const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
    const hasStructuredPreviewsRef = useRef(false);

    const wait = useCallback((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)), []);

    // Load initial chat history (latest N) on mount / projectId change
    useEffect(() => {
        if (!projectId) return;

        let cancelled = false;
        setMessages([]);
        setFileUpdates([]);
        setAgentSteps([]);
        hasStructuredPreviewsRef.current = false;
        setHasOlderMessages(false);
        setIsLoadingOlderMessages(false);
        setOldestMessageCreatedAt(null);

        messagesService
            .find({ projectId, $sort: { createdAt: -1 }, $limit: INITIAL_MESSAGES_LIMIT })
            .then((result) => {
                if (cancelled) return;
                const latestMessages = [...result.data].reverse();
                setMessages(latestMessages);
                setOldestMessageCreatedAt(latestMessages[0]?.createdAt ?? null);
                setHasOlderMessages(result.total > latestMessages.length);
            })
            .catch(() => {
                /* silently fail - no toast needed on initial load */
            });

        return () => {
            cancelled = true;
        };
    }, [projectId]);

    const loadOlderMessages = useCallback(async () => {
        if (!projectId || !hasOlderMessages || isLoadingOlderMessages || oldestMessageCreatedAt === null) return;

        setIsLoadingOlderMessages(true);
        try {
            const result = await messagesService.find({
                projectId,
                $sort: { createdAt: -1 },
                $limit: OLDER_MESSAGES_BATCH_SIZE,
                createdAt: { $lt: oldestMessageCreatedAt }
            });

            const olderMessages = [...result.data].reverse();

            if (olderMessages.length === 0) {
                setHasOlderMessages(false);
                return;
            }

            setMessages((prev) => mergeMessagesById(olderMessages, prev));
            setOldestMessageCreatedAt(olderMessages[0]?.createdAt ?? oldestMessageCreatedAt);
            setHasOlderMessages(olderMessages.length === OLDER_MESSAGES_BATCH_SIZE);
        } catch {
            toast.error('Failed to load older messages');
        } finally {
            setIsLoadingOlderMessages(false);
        }
    }, [hasOlderMessages, isLoadingOlderMessages, oldestMessageCreatedAt, projectId]);

    // Real-time: append new messages from server (avoids duplicates)
    const handleMessageCreated = useCallback((message: Message) => {
        if (message.role === 'assistant' && !hasStructuredPreviewsRef.current) {
            const parsedUpdates = parseFileUpdatesFromContent(message.content);
            if (parsedUpdates.length > 0) {
                setFileUpdates((prev) => mergeFileUpdates(prev, parsedUpdates));
            }
        }

        setMessages((prev) => {
            const withoutStreaming = prev.filter((m) => m._id !== STREAMING_MESSAGE_ID);
            if (withoutStreaming.find((m) => m._id === message._id)) return withoutStreaming;
            return mergeMessagesById(withoutStreaming, [message]);
        });
    }, []);

    const handleMessagePatched = useCallback((message: Message) => {
        setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    }, []);

    const msgFilter = useCallback((m: Message) => toId(m.projectId) === toId(projectId), [projectId]);

    useRealtimeUpdates<Message>('messages', 'created', handleMessageCreated, msgFilter);
    useRealtimeUpdates<Message>('messages', 'patched', handleMessagePatched, msgFilter);

    const handleStreamChunk = useCallback(
        (chunk: AIStreamChunkEvent) => {
            if (toId(chunk.projectId) !== toId(projectId)) return;

            setIsStreaming(!chunk.done);

            setMessages((prev) => {
                const existingIndex = prev.findIndex((m) => m._id === STREAMING_MESSAGE_ID);
                const previousContent = existingIndex >= 0 ? prev[existingIndex]?.content || '' : '';
                const nextContent = chunk.fullContent || `${previousContent}${chunk.content || ''}`;

                const streamingMessage: Message = {
                    _id: STREAMING_MESSAGE_ID,
                    projectId: chunk.projectId,
                    role: 'assistant',
                    content: nextContent,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };

                if (existingIndex >= 0) {
                    const next = [...prev];
                    next[existingIndex] = streamingMessage;
                    return next;
                }

                return [...prev, streamingMessage];
            });

            if (chunk.done) {
                setIsStreaming(false);
            }
        },
        [projectId]
    );

    const handleStreamFileUpdates = useCallback(
        (payload: AIStreamFileUpdatesEvent) => {
            if (toId(payload.projectId) !== toId(projectId)) return;
            hasStructuredPreviewsRef.current = true;
            const parsed = (payload.updates || []).map((update) => ({
                ...update,
                filename: normalizePath(update.filename)
            }));
            setFileUpdates((prev) => mergeFileUpdates(prev, parsed));
        },
        [projectId]
    );

    const handleAgentStep = useCallback(
        (payload: AIAgentStepEvent) => {
            if (toId(payload.projectId) !== toId(projectId)) return;
            setAgentSteps((prev) => mergeAgentSteps(prev, [payload]));
        },
        [projectId]
    );

    const handleWritePreview = useCallback(
        (payload: AIStreamWritePreviewEvent) => {
            if (toId(payload.projectId) !== toId(projectId)) return;
            hasStructuredPreviewsRef.current = true;
            setFileUpdates((prev) => mergeFileUpdates(prev, [toFileUpdateFromWritePreview(payload)]));
        },
        [projectId]
    );

    /** Handles the new file-diff event — replaces write-preview in the updated backend. */
    const handleFileDiff = useCallback(
        (event: AIFileDiffEvent) => {
            if (toId(event.projectId) !== toId(projectId)) return;
            hasStructuredPreviewsRef.current = true;
            setFileUpdates((prev) => mergeFileUpdates(prev, [toFileUpdateFromFileDiff(event)]));
        },
        [projectId]
    );

    /** Handles the file-applied event — backend has written the file; clean up pending state. */
    const handleFileApplied = useCallback(
        (event: AIFileAppliedEvent) => {
            if (toId(event.projectId) !== toId(projectId)) return;
            const normalizedFilename = normalizePath(event.filename);
            setFileUpdates((prev) => prev.filter((u) => u.updateId !== event.updateId && normalizePath(u.filename) !== normalizedFilename));
            setApplyingUpdateKeys((prev) => prev.filter((k) => !k.endsWith(`:${normalizedFilename}`)));
            onFileApplied?.({ action: event.action, filename: normalizedFilename });
        },
        [projectId, onFileApplied]
    );

    useRealtimeUpdates<AIStreamChunkEvent>('aiStream', 'chunk', handleStreamChunk, (chunk) => toId(chunk.projectId) === toId(projectId));
    useRealtimeUpdates<AIStreamFileUpdatesEvent>('aiStream', 'file-updates', handleStreamFileUpdates, (payload) => toId(payload.projectId) === toId(projectId));
    useRealtimeUpdates<AIAgentStepEvent>('aiStream', 'agent-step', handleAgentStep, (payload) => toId(payload.projectId) === toId(projectId));
    useRealtimeUpdates<AIStreamWritePreviewEvent>('aiStream', 'write-preview', handleWritePreview, (payload) => toId(payload.projectId) === toId(projectId));
    useRealtimeUpdates<AIFileDiffEvent>('aiStream', 'file-diff', handleFileDiff, (payload) => toId(payload.projectId) === toId(projectId));
    useRealtimeUpdates<AIFileAppliedEvent>('aiStream', 'file-applied', handleFileApplied, (payload) => toId(payload.projectId) === toId(projectId));

    const streamAIResponse = useCallback(
        async (conversationMessages: StreamMessage[], currentProjectId: string, latestKnownCreatedAt: number) => {
            try {
                setIsStreaming(true);

                const projectContext = buildProjectContext(files, selectedFile, selectedFileContent);

                const streamResult = await createAIStream({
                    projectId: currentProjectId,
                    message: conversationMessages[conversationMessages.length - 1]?.content || '',
                    conversationHistory: conversationMessages.slice(0, -1),
                    context: projectContext,
                    model: defaultAiModel
                });

                if (streamResult?.messageId) {
                    try {
                        const assistantMessage = await messagesService.get(streamResult.messageId);
                        setMessages((prev) => {
                            const withoutStreaming = prev.filter((m) => m._id !== STREAMING_MESSAGE_ID);
                            return mergeMessagesById(withoutStreaming, [assistantMessage]);
                        });
                        if (!hasStructuredPreviewsRef.current) {
                            const parsedUpdates = parseFileUpdatesFromContent(assistantMessage.content);
                            if (parsedUpdates.length > 0) {
                                setFileUpdates((prev) => mergeFileUpdates(prev, parsedUpdates));
                            }
                        }
                        setIsStreaming(false);
                        return;
                    } catch {
                        // Fall through to polling fallback.
                    }
                }

                // Poll until the new assistant message is persisted.
                // This keeps UX functional even when a realtime event is delayed/missed.
                const startedAt = Date.now();
                let settled = false;
                while (!settled && Date.now() - startedAt < STREAM_POLL_TIMEOUT_MS) {
                    const refreshed = await messagesService.find({
                        projectId: currentProjectId,
                        $sort: { createdAt: -1 },
                        $limit: INITIAL_MESSAGES_LIMIT
                    });

                    const latestBatchAsc = [...refreshed.data].reverse();
                    const hasNewAssistant = refreshed.data.some((m) => m.role === 'assistant' && m.createdAt > latestKnownCreatedAt);

                    if (hasNewAssistant) {
                        setMessages((prev) => mergeMessagesById(prev, latestBatchAsc));
                        const latestAssistant = latestBatchAsc
                            .slice()
                            .reverse()
                            .find((m) => m.role === 'assistant');
                        if (!hasStructuredPreviewsRef.current) {
                            const parsedUpdates = parseFileUpdatesFromContent(latestAssistant?.content || '');
                            if (parsedUpdates.length > 0) {
                                setFileUpdates((prev) => mergeFileUpdates(prev, parsedUpdates));
                            }
                        }
                        settled = true;
                        break;
                    }

                    await wait(STREAM_POLL_INTERVAL_MS);
                }

                setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
                setIsStreaming(false);
            } catch (error) {
                setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
                setIsStreaming(false);
                toast.error('Failed to get AI response', { description: 'Please check your connection and try again.' });
                throw error;
            }
        },
        [files, selectedFile, selectedFileContent, wait]
    );

    const sendPrompt = useCallback(
        async (messageContent: string) => {
            if (!projectId) return;

            const normalized = messageContent.trim();
            if (!normalized) return;

            setIsLoading(true);

            try {
                const userMessage = await messagesService.create({ projectId, role: 'user', content: normalized });
                setMessages((prev) => (prev.find((m) => m._id === userMessage._id) ? prev : [...prev, userMessage]));

                const validation = await validatePromptWithAI(normalized);

                if (!validation.isValid) {
                    const followUp = validation.suggestedQuestions?.join('\n\n') ?? "I couldn't understand your request. Could you provide more details?";
                    const assistantMessage = await messagesService.create({ projectId, role: 'assistant', content: followUp });
                    setMessages((prev) => (prev.find((m) => m._id === assistantMessage._id) ? prev : [...prev, assistantMessage]));
                    return;
                }

                const conversationMessages: StreamMessage[] = [...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: normalized }];
                const latestKnownCreatedAt = messages[messages.length - 1]?.createdAt ?? 0;

                hasStructuredPreviewsRef.current = false;
                setAgentSteps([]);

                await streamAIResponse(conversationMessages, projectId, latestKnownCreatedAt);
            } finally {
                setIsLoading(false);
            }
        },
        [messages, projectId, streamAIResponse]
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim() || isLoading || isStreaming || !projectId) return;

            const messageContent = input.trim();
            setInput('');

            try {
                await sendPrompt(messageContent);
            } catch (error) {
                toast.error('Failed to send message', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                    duration: 5000
                });
            }
        },
        [input, isLoading, isStreaming, projectId, sendPrompt]
    );

    const retryMessage = useCallback(
        async (messageId: string) => {
            if (!projectId || isLoading || isStreaming) return;

            const sourceMessage = messages.find((message) => message._id === messageId);
            if (!sourceMessage || sourceMessage.role !== 'user' || !sourceMessage.content?.trim()) {
                toast.error('This message cannot be retried');
                return;
            }

            setRetryingMessageId(messageId);
            try {
                await sendPrompt(sourceMessage.content);
            } catch (error) {
                toast.error('Failed to retry message', {
                    description: error instanceof Error ? error.message : 'Unknown error'
                });
            } finally {
                setRetryingMessageId(null);
            }
        },
        [isLoading, isStreaming, messages, projectId, sendPrompt]
    );

    const handleAcceptUpdate = useCallback(
        async (update: FileUpdate) => {
            if (!projectId) return;

            const updateKey = getUpdateKey(update);
            setApplyingUpdateKeys((prev) => (prev.includes(updateKey) ? prev : [...prev, updateKey]));

            try {
                if (update.updateId) {
                    // New backend flow: delegate file write to server
                    await patchAIStream({ projectId, action: 'accept', updateId: update.updateId });
                    // Optimistically clean up local state; file-applied event will also fire as confirmation
                    setFileUpdates((prev) => prev.filter((u) => u.filename !== update.filename));
                    onFileApplied?.({ action: update.action, filename: normalizePath(update.filename), content: update.content });
                    const label = update.action === 'delete' ? 'Deleted' : update.action === 'modify' ? 'Updated' : 'Created';
                    toast.success(`${label}: ${update.filename}`);
                } else if (update.action === 'delete') {
                    // Legacy flow: client-side delete
                    const file = findMatchingFile(files, update.filename);
                    if (file) {
                        await filesService.remove(file._id);
                        onFileApplied?.({ action: 'delete', filename: normalizePath(update.filename) });
                        toast.success(`Deleted: ${update.filename}`);
                    }
                    setFileUpdates((prev) => prev.filter((u) => u.filename !== update.filename));
                } else {
                    // Legacy flow: client-side upload for create/modify
                    const existing = findMatchingFile(files, update.filename);
                    const resolvedContent = existing && update.action === 'modify' ? await resolveUpdatedContentForModify(update, existing) : update.content;
                    const contentBytes = new TextEncoder().encode(resolvedContent);
                    if (contentBytes.length > MAX_FILE_SIZE) {
                        toast.error(`File exceeds 10MB limit (${(contentBytes.length / 1024 / 1024).toFixed(2)}MB)`);
                        return;
                    }

                    const normalizedFilename = normalizePath(update.filename);
                    const key = existing?.key || `projects/${projectId}/${normalizedFilename}`;
                    await createUpload({ key, content: resolvedContent, contentType: 'text/plain', projectId });

                    if (existing) {
                        await filesService.patch(existing._id, { size: contentBytes.length, currentVersion: (existing.currentVersion || 1) + 1 });
                        onFileApplied?.({ action: 'modify', filename: normalizePath(existing.name || update.filename), content: resolvedContent });
                        toast.success(`Updated: ${update.filename}`);
                    } else {
                        await filesService.create({
                            projectId,
                            name: normalizedFilename,
                            key,
                            fileType: normalizedFilename.split('.').pop() || 'text',
                            size: contentBytes.length
                        });
                        onFileApplied?.({ action: 'create', filename: normalizedFilename, content: resolvedContent });
                        toast.success(`Created: ${update.filename}`);
                    }

                    setFileUpdates((prev) => prev.filter((u) => u.filename !== update.filename));
                }
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to apply file update';
                if (message.includes('SEARCH/REPLACE')) {
                    toast.error('Cannot apply update safely', {
                        description: 'Ask Mocky to provide SEARCH/REPLACE blocks for modify actions.'
                    });
                } else {
                    toast.error('Failed to apply file update');
                }
            } finally {
                setApplyingUpdateKeys((prev) => prev.filter((key) => key !== updateKey));
            }
        },
        [projectId, files, onFileApplied]
    );

    const handleRejectUpdate = useCallback(
        (update: FileUpdate) => {
            setFileUpdates((prev) => prev.filter((u) => u.filename !== update.filename));
            if (update.updateId && projectId) {
                patchAIStream({ projectId, action: 'reject', updateId: update.updateId }).catch(() => {
                    // Fire-and-forget: UI is already updated, rejection notification to backend is best-effort
                });
            }
        },
        [projectId]
    );

    const handleAcceptAllUpdates = useCallback(async () => {
        if (!projectId) return;

        const serverUpdates = fileUpdates.filter((u) => u.updateId);
        const clientUpdates = fileUpdates.filter((u) => !u.updateId);
        let failed = 0;

        if (serverUpdates.length > 0) {
            const serverKeys = serverUpdates.map(getUpdateKey);
            setApplyingUpdateKeys((prev) => [...new Set([...prev, ...serverKeys])]);
            try {
                await patchAIStream({ projectId, action: 'accept-all' });
                // Optimistically remove server-managed updates; file-applied events will also fire
                setFileUpdates((prev) => prev.filter((u) => !u.updateId));
                serverUpdates.forEach((u) => {
                    onFileApplied?.({ action: u.action, filename: normalizePath(u.filename), content: u.content });
                });
            } catch {
                failed++;
                toast.error('Failed to apply server-side changes');
            } finally {
                setApplyingUpdateKeys((prev) => prev.filter((k) => !serverKeys.includes(k)));
            }
        }

        if (clientUpdates.length > 0) {
            const results = await Promise.allSettled(clientUpdates.map((u) => handleAcceptUpdate(u)));
            failed += results.filter((r) => r.status === 'rejected').length;
        }

        if (failed > 0) toast.error(`${failed} update(s) failed`);
    }, [fileUpdates, handleAcceptUpdate, projectId, onFileApplied]);

    const stopStream = useCallback(() => {
        setIsStreaming(false);
        setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
    }, []);

    return {
        messages,
        hasOlderMessages,
        isLoadingOlderMessages,
        input,
        setInput,
        isLoading,
        isStreaming,
        agentSteps,
        isApplyingUpdates: applyingUpdateKeys.length > 0,
        applyingUpdateKeys,
        fileUpdates,
        retryingMessageId,
        handleSubmit,
        retryMessage,
        loadOlderMessages,
        handleAcceptUpdate,
        handleRejectUpdate,
        handleAcceptAllUpdates,
        stopStream
    };
}
