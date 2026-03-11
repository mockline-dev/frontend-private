'use client';

import { createAIStream } from '@/api/aiStream/createAIStream';
import { createUpload } from '@/api/uploads/createUpload';
import { defaultAiModel } from '@/config/environment';
import { type FileUpdate } from '@/containers/workspace/components/FileUpdatePreview';
import { useRealtimeUpdates, useSocketEvent } from '@/hooks/useRealtimeUpdates';
import { filesService, type File as FileType } from '@/services/api/files';
import { messagesService, type Message } from '@/services/api/messages';
import { validatePrompt } from '@/utils/promptValidation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface StreamMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface UseAIAgentReturn {
    messages: Message[];
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isStreaming: boolean;
    fileUpdates: FileUpdate[];
    handleSubmit: (e: React.FormEvent) => void;
    handleAcceptUpdate: (update: FileUpdate) => Promise<void>;
    handleRejectUpdate: (update: FileUpdate) => void;
    handleAcceptAllUpdates: () => Promise<void>;
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

async function validatePromptWithAI(prompt: string) {
    // Local validation prevents noisy 404s from optional external endpoints.
    return validatePrompt(prompt);
}

export function useAIAgent(
    projectId: string | undefined,
    files: FileType[],
    selectedFile: string | undefined,
    selectedFileContent: string | undefined
): UseAIAgentReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [fileUpdates, setFileUpdates] = useState<FileUpdate[]>([]);

    // Load message history on mount / projectId change
    useEffect(() => {
        if (!projectId) return;
        setMessages([]);
        messagesService
            .find({ projectId, $sort: { createdAt: 1 } })
            .then((result) => setMessages(result.data))
            .catch(() => {
                /* silently fail - no toast needed on initial load */
            });
    }, [projectId]);

    // Real-time: append new messages from server (avoids duplicates)
    const handleMessageCreated = useCallback((message: Message) => {
        setMessages((prev) => {
            const withoutStreaming = prev.filter((m) => m._id !== STREAMING_MESSAGE_ID);
            return withoutStreaming.find((m) => m._id === message._id) ? withoutStreaming : [...withoutStreaming, message];
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
                    type: 'text',
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
            setFileUpdates(payload.updates || []);
        },
        [projectId]
    );

    useSocketEvent<AIStreamChunkEvent>('ai-stream::chunk', handleStreamChunk, (chunk) => chunk.projectId === projectId);
    useSocketEvent<AIStreamFileUpdatesEvent>('ai-stream::file-updates', handleStreamFileUpdates, (payload) => payload.projectId === projectId);

    const streamAIResponse = useCallback(
        async (conversationMessages: StreamMessage[], currentProjectId: string) => {
            try {
                setIsStreaming(true);

                const projectContext = {
                    files: files.map((f) => f.name),
                    ...(selectedFile ? { selectedFile } : {}),
                    ...(selectedFileContent ? { selectedContent: selectedFileContent } : {})
                };

                await createAIStream({
                    projectId: currentProjectId,
                    message: conversationMessages[conversationMessages.length - 1]?.content || '',
                    conversationHistory: conversationMessages.slice(0, -1),
                    context: projectContext,
                    model: defaultAiModel
                });

                // Consistency fallback: refresh messages after stream completes
                // so UI stays correct even if a realtime event was missed.
                const refreshed = await messagesService.find({ projectId: currentProjectId, $sort: { createdAt: 1 } });
                setMessages(refreshed.data);
                setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
                setIsStreaming(false);
            } catch (error) {
                setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
                setIsStreaming(false);
                toast.error('Failed to get AI response', { description: 'Please check your connection and try again.' });
                throw error;
            }
        },
        [files, selectedFile, selectedFileContent]
    );

    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!input.trim() || isLoading || isStreaming || !projectId) return;

            const messageContent = input.trim();
            setInput('');
            setIsLoading(true);

            try {
                const userMessage = await messagesService.create({ projectId, role: 'user', type: 'text', content: messageContent });
                setMessages((prev) => (prev.find((m) => m._id === userMessage._id) ? prev : [...prev, userMessage]));

                const validation = await validatePromptWithAI(messageContent);

                if (!validation.isValid) {
                    const followUp = validation.suggestedQuestions?.join('\n\n') ?? "I couldn't understand your request. Could you provide more details?";
                    await messagesService.create({ projectId, role: 'assistant', type: 'text', content: followUp });
                    return;
                }

                const conversationMessages: StreamMessage[] = [...messages.map((m) => ({ role: m.role, content: m.content })), { role: 'user', content: messageContent }];

                await streamAIResponse(conversationMessages, projectId);
            } catch (error) {
                toast.error('Failed to send message', {
                    description: error instanceof Error ? error.message : 'Unknown error',
                    duration: 5000
                });
            } finally {
                setIsLoading(false);
            }
        },
        [input, isLoading, isStreaming, projectId, messages, streamAIResponse]
    );

    const handleAcceptUpdate = useCallback(
        async (update: FileUpdate) => {
            if (!projectId) return;

            try {
                if (update.action === 'delete') {
                    const file = files.find((f) => f.name === update.filename);
                    if (file) {
                        await filesService.remove(file._id);
                        toast.success(`Deleted: ${update.filename}`);
                    }
                } else {
                    const contentBytes = new TextEncoder().encode(update.content);
                    if (contentBytes.length > MAX_FILE_SIZE) {
                        toast.error(`File exceeds 10MB limit (${(contentBytes.length / 1024 / 1024).toFixed(2)}MB)`);
                        return;
                    }

                    const key = `projects/${projectId}/${update.filename}`;
                    await createUpload({ key, content: update.content, contentType: 'text/plain', projectId });

                    const existing = files.find((f) => f.name === update.filename);
                    if (existing) {
                        await filesService.patch(existing._id, { size: contentBytes.length, currentVersion: (existing.currentVersion || 1) + 1 });
                        toast.success(`Updated: ${update.filename}`);
                    } else {
                        await filesService.create({
                            projectId,
                            name: update.filename,
                            key,
                            fileType: update.filename.split('.').pop() || 'text',
                            size: contentBytes.length,
                            currentVersion: 1
                        });
                        toast.success(`Created: ${update.filename}`);
                    }
                }

                setFileUpdates((prev) => prev.filter((u) => u.filename !== update.filename));
            } catch {
                toast.error('Failed to apply file update');
            }
        },
        [projectId, files]
    );

    const handleRejectUpdate = useCallback((update: FileUpdate) => {
        setFileUpdates((prev) => prev.filter((u) => u.filename !== update.filename));
    }, []);

    const handleAcceptAllUpdates = useCallback(async () => {
        const results = await Promise.allSettled(fileUpdates.map((u) => handleAcceptUpdate(u)));
        const failed = results.filter((r) => r.status === 'rejected').length;
        if (failed > 0) toast.error(`${failed} update(s) failed`);
    }, [fileUpdates, handleAcceptUpdate]);

    return {
        messages,
        input,
        setInput,
        isLoading,
        isStreaming,
        fileUpdates,
        handleSubmit,
        handleAcceptUpdate,
        handleRejectUpdate,
        handleAcceptAllUpdates
    };
}
