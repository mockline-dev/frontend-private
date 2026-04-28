'use client';

import { createMessage as createMessageAction } from '@/api/messages/createMessage';
import { fetchMessages } from '@/api/messages/fetchMessages';
import { type Message, type OrchestrationCompletedEvent, type OrchestrationErrorEvent, type OrchestrationIntentEvent, type OrchestrationTokenEvent, type FilesPersistedEvent, type ProgressStageEvent, type SandboxRetryEvent, type SandboxResultEvent, type ChatCompletedEvent, type ChatErrorEvent } from '@/types/feathers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRealtimeUpdates, useSocketEvent } from './useRealtimeUpdates';

const INITIAL_MESSAGES_LIMIT = 10;
const OLDER_MESSAGES_BATCH_SIZE = 50;

const STREAMING_MESSAGE_ID = '__streaming__';

const PIPELINE_STAGE_LABELS: Record<string, string> = {
    classifying: 'Classifying intent…',
    enhancing:   'Enhancing prompt…',
    retrieving:  'Retrieving context…',
    planning:    'Planning project structure…',
    generating:  'Generating code…',
    validating:  'Validating in sandbox…',
    fixing:      'Auto-fixing issues…',
    persisting:  'Persisting files…',
    complete:    'Complete',
};

export interface UseAIAgentReturn {
    messages: Message[];
    hasOlderMessages: boolean;
    isLoadingOlderMessages: boolean;
    isInitialLoading: boolean;
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isStreaming: boolean;
    pipelineStage: string | null;
    pipelineProgress: number;
    retryingMessageId: string | null;
    handleSubmit: (content?: string) => Promise<void>;
    retryMessage: (messageId: string) => Promise<void>;
    stopStream: () => void;
    loadOlderMessages: () => Promise<void>;
    isRepairing: boolean;
    repairAttemptLabel: string | null;
}

function mergeMessagesById(existing: Message[], incoming: Message[]): Message[] {
    const map = new Map(existing.map((m) => [m._id, m]));
    for (const m of incoming) {
        map.set(m._id, m);
    }
    return Array.from(map.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function useAIAgent({
    projectId,
    onFilesChanged,
}: {
    projectId?: string;
    onFilesChanged?: () => void;
}): UseAIAgentReturn {
    const [messages, setMessages] = useState<Message[]>([]);
    const [hasOlderMessages, setHasOlderMessages] = useState(false);
    const [isLoadingOlderMessages, setIsLoadingOlderMessages] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(!!projectId);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [pipelineStage, setPipelineStage] = useState<string | null>(null);
    const [pipelineProgress, setPipelineProgress] = useState(0);
    const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);
    const [isRepairing, setIsRepairing] = useState(false);
    const [repairAttemptLabel, setRepairAttemptLabel] = useState<string | null>(null);

    const streamingContentRef = useRef('');
    const initializedRef = useRef(false);
    const messagesRef = useRef(messages);
    messagesRef.current = messages;

    const loadInitialMessages = useCallback(async () => {
        if (!projectId || initializedRef.current) return;
        initializedRef.current = true;

        setIsInitialLoading(true);
        try {
            const result = await fetchMessages({
                query: {
                    projectId,
                    $sort: { createdAt: -1 },
                    $limit: INITIAL_MESSAGES_LIMIT,
                },
            });
            const fetched = Array.isArray(result) ? result : result.data || [];
            const sorted = [...fetched].sort((a, b) => a.createdAt - b.createdAt);
            setMessages(sorted);
            setHasOlderMessages(fetched.length >= INITIAL_MESSAGES_LIMIT);
            setIsInitialLoading(false);
        } catch (err) {
            console.error('[useAIAgent] Failed to load initial messages:', err);
            setIsInitialLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        initializedRef.current = false;
        setIsInitialLoading(!!projectId);
        void loadInitialMessages();
    }, [projectId, loadInitialMessages]);

    const loadOlderMessages = useCallback(async () => {
        if (!projectId || isLoadingOlderMessages || !hasOlderMessages) return;

        const oldestCreatedAt = messagesRef.current.find((m) => m._id !== STREAMING_MESSAGE_ID)?.createdAt;
        if (!oldestCreatedAt) return;

        setIsLoadingOlderMessages(true);
        try {
            const result = await fetchMessages({
                query: {
                    projectId,
                    createdAt: { $lt: oldestCreatedAt },
                    $sort: { createdAt: -1 },
                    $limit: OLDER_MESSAGES_BATCH_SIZE,
                },
            });
            const fetched = Array.isArray(result) ? result : result.data || [];
            const sorted = [...fetched].sort((a, b) => a.createdAt - b.createdAt);
            setMessages((prev) => mergeMessagesById(sorted, prev));
            setHasOlderMessages(fetched.length >= OLDER_MESSAGES_BATCH_SIZE);
        } catch (err) {
            console.error('[useAIAgent] Failed to load older messages:', err);
        } finally {
            setIsLoadingOlderMessages(false);
        }
    }, [projectId, isLoadingOlderMessages, hasOlderMessages]);

    const sendMessage = useCallback(
        async (content: string) => {
            if (!projectId || !content.trim()) return;

            const trimmed = content.trim();
            setIsLoading(true);
            setPipelineStage(null);
            setPipelineProgress(0);
            streamingContentRef.current = '';

            const optimisticUser: Message = {
                _id: `optimistic-${Date.now()}`,
                projectId,
                role: 'user',
                content: trimmed,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            };
            setMessages((prev) => [...prev.filter((m) => m._id !== STREAMING_MESSAGE_ID), optimisticUser]);

            try {
                await createMessageAction({ projectId, role: 'user', content: trimmed });
                setIsStreaming(true);
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Failed to send message';
                toast.error(msg);
                setMessages((prev) => prev.filter((m) => m._id !== optimisticUser._id));
            } finally {
                setIsLoading(false);
            }
        },
        [projectId]
    );

    const handleSubmit = useCallback(
        async (content?: string) => {
            const text = content ?? input;
            if (!text.trim()) return;
            setInput('');
            await sendMessage(text);
        },
        [input, sendMessage]
    );

    const retryMessage = useCallback(
        async (messageId: string) => {
            const msg = messages.find((m) => m._id === messageId);
            if (!msg || msg.role !== 'user') return;

            setRetryingMessageId(messageId);
            try {
                await sendMessage(msg.content);
            } finally {
                setRetryingMessageId(null);
            }
        },
        [messages, sendMessage]
    );

    const stopStream = useCallback(() => {
        setIsStreaming(false);
        setPipelineStage(null);
        setPipelineProgress(0);
        streamingContentRef.current = '';
        setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
    }, []);

    useRealtimeUpdates<Message>('messages', 'created', (message) => {
        if (message.projectId !== projectId) return;
        setMessages((prev) => {
            const filtered = prev.filter(
                (m) =>
                    m._id !== STREAMING_MESSAGE_ID &&
                    m._id !== message._id &&
                    !(m._id.startsWith('optimistic-') && m.role === message.role && m.content === message.content)
            );
            return [...filtered, message].sort((a, b) => a.createdAt - b.createdAt);
        });
        if (message.role === 'assistant') {
            setIsStreaming(false);
            setPipelineStage(null);
            setPipelineProgress(0);
            streamingContentRef.current = '';
        }
    });

    useRealtimeUpdates<Message>('messages', 'patched', (message) => {
        if (message.projectId !== projectId) return;
        setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    });

    useSocketEvent<OrchestrationIntentEvent>('orchestration:intent', (event) => {
        setPipelineStage(`Classifying: ${event.intent}`);
    });

    useSocketEvent('orchestration:enhanced', () => {
        setPipelineStage('Enhancing prompt…');
    });

    useSocketEvent('orchestration:context', () => {
        setPipelineStage('Retrieving context…');
    });

    useSocketEvent<OrchestrationTokenEvent>('orchestration:token', ({ token }) => {
        setPipelineStage('Generating…');
        streamingContentRef.current += token;

        const streamingMsg: Message = {
            _id: STREAMING_MESSAGE_ID,
            projectId: projectId ?? '',
            role: 'assistant',
            content: streamingContentRef.current,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };
        setMessages((prev) => {
            const filtered = prev.filter((m) => m._id !== STREAMING_MESSAGE_ID);
            return [...filtered, streamingMsg];
        });
    });

    useSocketEvent<OrchestrationCompletedEvent>('orchestration:completed', () => {
        setPipelineStage('Persisting files…');
    });

    useSocketEvent<OrchestrationErrorEvent>('orchestration:error', ({ error }) => {
        toast.error(`Generation failed: ${error}`);
        setIsStreaming(false);
        setPipelineStage(null);
        setPipelineProgress(0);
        streamingContentRef.current = '';
        setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
    });

    useSocketEvent<ProgressStageEvent>('progress:stage', ({ stage, percentage }) => {
        setPipelineStage(PIPELINE_STAGE_LABELS[stage] ?? stage);
        setPipelineProgress(percentage);
    });

    useSocketEvent<FilesPersistedEvent>('files:persisted', () => {
        setPipelineStage('Files saved');
        onFilesChanged?.();
    });

    useSocketEvent<ChatCompletedEvent>('chat:completed', (event) => {
        if (event.projectId !== projectId) return;
        // Safety net: clear streaming state in case `messages created` was missed
        setIsStreaming(false);
        setPipelineStage(null);
        setPipelineProgress(0);
        streamingContentRef.current = '';
        setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
    });

    useSocketEvent<ChatErrorEvent>('chat:error', (event) => {
        if (event.projectId !== projectId) return;
        toast.error(`Generation failed: ${event.error}`);
        setIsStreaming(false);
        setPipelineStage(null);
        setPipelineProgress(0);
        streamingContentRef.current = '';
        setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
    });

    useSocketEvent<SandboxRetryEvent>('sandbox:retry', (event) => {
        setIsRepairing(true);
        setRepairAttemptLabel(`${event.attempt}`);
    });

    useSocketEvent<SandboxResultEvent>('sandbox:result', (event) => {
        setIsRepairing(false);
        setRepairAttemptLabel(null);
        if (!event.success) {
            setPipelineStage('Validation failed');
        }
    });

    return {
        messages,
        hasOlderMessages,
        isLoadingOlderMessages,
        isInitialLoading,
        input,
        setInput,
        isLoading,
        isStreaming,
        pipelineStage,
        pipelineProgress,
        retryingMessageId,
        handleSubmit,
        retryMessage,
        stopStream,
        loadOlderMessages,
        isRepairing,
        repairAttemptLabel,
    };
}
