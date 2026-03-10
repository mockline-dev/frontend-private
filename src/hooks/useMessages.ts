'use client';

import feathersClient from '@/services/featherClient';
import { ConversationHistoryItem, CreateMessageData, Message, MessageQuery, UpdateMessageData } from '@/types/feathers';
import { useCallback, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export interface UseMessagesReturn {
    // State
    messages: Message[];
    loading: boolean;
    error: string | null;
    currentMessage: Message | null;

    // Methods
    loadMessages: (projectId: string, query?: MessageQuery) => Promise<void>;
    loadMessage: (messageId: string) => Promise<void>;
    createMessage: (data: CreateMessageData) => Promise<Message>;
    updateMessage: (messageId: string, data: UpdateMessageData) => Promise<Message>;
    deleteMessage: (messageId: string) => Promise<void>;
    refresh: (projectId: string) => Promise<void>;
    getConversationHistory: (projectId: string) => Promise<ConversationHistoryItem[]>;
    setCurrentMessage: (message: Message | null) => void;
}

export function useMessages(initialMessages: Message[] = []): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    // Load messages for a project
    const loadMessages = useCallback(
        async (projectId: string, query?: MessageQuery) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const result = await feathersClient.service('messages').find({
                    query: {
                        projectId,
                        ...query,
                        $sort: { createdAt: 1 }
                    }
                });
                setMessages(Array.isArray(result) ? result : result.data || []);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load messages';
                setError(message);
                console.error('[useMessages] Error loading messages:', err);
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Load a single message
    const loadMessage = useCallback(
        async (messageId: string) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const message = await feathersClient.service('messages').get(messageId);
                setCurrentMessage(message);
                return message;
            } catch (err) {
                const messageError = err instanceof Error ? err.message : 'Failed to load message';
                setError(messageError);
                console.error('[useMessages] Error loading message:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Create a new message
    const createMessage = useCallback(
        async (data: CreateMessageData): Promise<Message> => {
            if (!isBrowser) {
                throw new Error('Cannot create message on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const message = await feathersClient.service('messages').create(data);
                setMessages((prev) => [...prev, message]);
                return message;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to create message';
                setError(message);
                console.error('[useMessages] Error creating message:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Update a message
    const updateMessage = useCallback(
        async (messageId: string, data: UpdateMessageData): Promise<Message> => {
            if (!isBrowser) {
                throw new Error('Cannot update message on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const updated = await feathersClient.service('messages').patch(messageId, data);
                setMessages((prev) => prev.map((m) => (m._id === messageId ? updated : m)));
                setCurrentMessage((prev) => (prev?._id === messageId ? updated : prev));
                return updated;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to update message';
                setError(message);
                console.error('[useMessages] Error updating message:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Delete a message
    const deleteMessage = useCallback(
        async (messageId: string): Promise<void> => {
            if (!isBrowser) {
                throw new Error('Cannot delete message on the server');
            }

            setLoading(true);
            setError(null);

            try {
                await feathersClient.service('messages').remove(messageId);
                setMessages((prev) => prev.filter((m) => m._id !== messageId));
                setCurrentMessage((prev) => (prev?._id === messageId ? null : prev));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to delete message';
                setError(message);
                console.error('[useMessages] Error deleting message:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Refresh messages for a project
    const refresh = useCallback(
        async (projectId: string) => {
            await loadMessages(projectId);
        },
        [loadMessages]
    );

    // Get conversation history for AI streaming
    const getConversationHistory = useCallback(
        async (projectId: string): Promise<ConversationHistoryItem[]> => {
            if (!isBrowser) return [];

            try {
                const result = await feathersClient.service('messages').find({
                    query: {
                        projectId,
                        $sort: { createdAt: 1 }
                    }
                });
                const messages = Array.isArray(result) ? result : result.data || [];
                return messages.map((m: Message) => ({
                    role: m.role,
                    content: m.content
                }));
            } catch (err) {
                console.error('[useMessages] Error getting conversation history:', err);
                return [];
            }
        },
        [isBrowser]
    );

    useRealtimeUpdates<Message>('messages', 'created', (message) => {
        setMessages((prev) => (prev.some((m) => m._id === message._id) ? prev : [...prev, message]));
    });

    useRealtimeUpdates<Message>('messages', 'patched', (message) => {
        setMessages((prev) => prev.map((m) => (m._id === message._id ? message : m)));
        setCurrentMessage((prev) => (prev?._id === message._id ? message : prev));
    });

    useRealtimeUpdates<Message>('messages', 'removed', (message) => {
        setMessages((prev) => prev.filter((m) => m._id !== message._id));
        setCurrentMessage((prev) => (prev?._id === message._id ? null : prev));
    });

    return {
        // State
        messages,
        loading,
        error,
        currentMessage,

        // Methods
        loadMessages,
        loadMessage,
        createMessage,
        updateMessage,
        deleteMessage,
        refresh,
        getConversationHistory,
        setCurrentMessage
    };
}
