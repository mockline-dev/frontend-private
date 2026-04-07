'use client';

import { createMessage as createMessageAction } from '@/api/messages/createMessage';
import { deleteMessage as deleteMessageAction } from '@/api/messages/deleteMessage';
import { fetchMessageById } from '@/api/messages/fetchMessageById';
import { fetchMessages } from '@/api/messages/fetchMessages';
import { updateMessage as updateMessageAction } from '@/api/messages/updateMessage';
import { CreateMessageData, Message, MessageQuery, UpdateMessageData } from '@/types/feathers';
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
    setCurrentMessage: (message: Message | null) => void;
}

export function useMessages(initialMessages: Message[] = []): UseMessagesReturn {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentMessage, setCurrentMessage] = useState<Message | null>(null);

    const isBrowser = typeof window !== 'undefined';

    const loadMessages = useCallback(
        async (projectId: string, query?: MessageQuery) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchMessages({
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

    const loadMessage = useCallback(
        async (messageId: string) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const message = await fetchMessageById({ id: messageId });
                setCurrentMessage(message);
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

    const createMessage = useCallback(
        async (data: CreateMessageData): Promise<Message> => {
            if (!isBrowser) {
                throw new Error('Cannot create message on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const message = await createMessageAction(data);
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

    const updateMessage = useCallback(
        async (messageId: string, data: UpdateMessageData): Promise<Message> => {
            if (!isBrowser) {
                throw new Error('Cannot update message on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const updated = await updateMessageAction({ id: messageId, data });
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

    const deleteMessage = useCallback(
        async (messageId: string): Promise<void> => {
            if (!isBrowser) {
                throw new Error('Cannot delete message on the server');
            }

            setLoading(true);
            setError(null);

            try {
                await deleteMessageAction({ id: messageId });
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

    const refresh = useCallback(
        async (projectId: string) => {
            await loadMessages(projectId);
        },
        [loadMessages]
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
        messages,
        loading,
        error,
        currentMessage,
        loadMessages,
        loadMessage,
        createMessage,
        updateMessage,
        deleteMessage,
        refresh,
        setCurrentMessage
    };
}
