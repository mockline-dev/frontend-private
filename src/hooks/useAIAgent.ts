'use client';

import { createMessage as createMessageAction } from '@/api/messages/createMessage';
import { fetchMessages } from '@/api/messages/fetchMessages';
import { type Message, type OrchestrationCompletedEvent, type OrchestrationErrorEvent, type OrchestrationIntentEvent, type OrchestrationTokenEvent, type FilesPersistedEvent } from '@/types/feathers';
import { useCallback, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useRealtimeUpdates, useSocketEvent } from './useRealtimeUpdates';

const INITIAL_MESSAGES_LIMIT = 10;
const OLDER_MESSAGES_BATCH_SIZE = 50;

/** Placeholder ID for the in-flight streaming message shown in the UI. */
const STREAMING_MESSAGE_ID = '__streaming__';

export interface UseAIAgentReturn {
    messages: Message[];
    hasOlderMessages: boolean;
    isLoadingOlderMessages: boolean;
    input: string;
    setInput: (value: string) => void;
    isLoading: boolean;
    isStreaming: boolean;
    /** Current orchestration pipeline stage, e.g. 'classifying' | 'enhancing' | 'generating' | 'persisting' | null */
    pipelineStage: string | null;
    retryingMessageId: string | null;
    handleSubmit: (content?: string) => Promise<void>;
    retryMessage: (messageId: string) => Promise<void>;
    stopStream: () => void;
    loadOlderMessages: () => Promise<void>;
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
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [pipelineStage, setPipelineStage] = useState<string | null>(null);
    const [retryingMessageId, setRetryingMessageId] = useState<string | null>(null);

    const streamingContentRef = useRef('');
    const initializedRef = useRef(false);

    // -------------------------------------------------------------------------
    // Initial message load
    // -------------------------------------------------------------------------
    const loadInitialMessages = useCallback(async () => {
        if (!projectId || initializedRef.current) return;
        initializedRef.current = true;

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
        } catch (err) {
            console.error('[useAIAgent] Failed to load initial messages:', err);
        }
    }, [projectId]);

    // Trigger initial load when projectId becomes available
    const loadInitialRef = useRef(loadInitialMessages);
    loadInitialRef.current = loadInitialMessages;
    const projectIdRef = useRef(projectId);
    if (projectIdRef.current !== projectId) {
        projectIdRef.current = projectId;
        initializedRef.current = false;
    }
    // Call on first render with a projectId
    if (projectId && !initializedRef.current) {
        void loadInitialRef.current();
    }

    // -------------------------------------------------------------------------
    // Load older messages (pagination)
    // -------------------------------------------------------------------------
    const loadOlderMessages = useCallback(async () => {
        if (!projectId || isLoadingOlderMessages || !hasOlderMessages) return;

        const oldestCreatedAt = messages.find((m) => m._id !== STREAMING_MESSAGE_ID)?.createdAt;
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
    }, [projectId, isLoadingOlderMessages, hasOlderMessages, messages]);

    // -------------------------------------------------------------------------
    // Send message — triggers full orchestration pipeline via POST /messages
    // -------------------------------------------------------------------------
    const sendMessage = useCallback(
        async (content: string) => {
            if (!projectId || !content.trim()) return;

            const trimmed = content.trim();
            setIsLoading(true);
            setPipelineStage(null);
            streamingContentRef.current = '';

            // Optimistically add user message
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
                // Real message will arrive via 'messages created' feathers event
                setMessages((prev) => prev.filter((m) => m._id !== optimisticUser._id));
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
        streamingContentRef.current = '';
        setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
    }, []);

    // -------------------------------------------------------------------------
    // Real-time: Feathers service events
    // -------------------------------------------------------------------------
    useRealtimeUpdates<Message>('messages', 'created', (message) => {
        if (message.projectId !== projectId) return;
        setMessages((prev) => {
            const filtered = prev.filter((m) => m._id !== STREAMING_MESSAGE_ID && m._id !== message._id);
            return [...filtered, message].sort((a, b) => a.createdAt - b.createdAt);
        });
        if (message.role === 'assistant') {
            setIsStreaming(false);
            setPipelineStage(null);
            streamingContentRef.current = '';
        }
    });

    useRealtimeUpdates<Message>('messages', 'patched', (message) => {
        if (message.projectId !== projectId) return;
        setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
    });

    // -------------------------------------------------------------------------
    // Real-time: Orchestration pipeline events (Socket.IO)
    // -------------------------------------------------------------------------
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
        // isStreaming stays true until 'messages created' fires
    });

    useSocketEvent<OrchestrationErrorEvent>('orchestration:error', ({ error }) => {
        toast.error(`Generation failed: ${error}`);
        setIsStreaming(false);
        setPipelineStage(null);
        streamingContentRef.current = '';
        setMessages((prev) => prev.filter((m) => m._id !== STREAMING_MESSAGE_ID));
    });

    useSocketEvent<FilesPersistedEvent>('files:persisted', () => {
        setPipelineStage('Files saved');
        onFilesChanged?.();
    });

    return {
        messages,
        hasOlderMessages,
        isLoadingOlderMessages,
        input,
        setInput,
        isLoading,
        isStreaming,
        pipelineStage,
        retryingMessageId,
        handleSubmit,
        retryMessage,
        stopStream,
        loadOlderMessages,
    };
}
