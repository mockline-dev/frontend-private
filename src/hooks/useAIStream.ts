'use client';

import { createAIStream } from '@/api/aiStream/createAIStream';
import feathersClient from '@/services/featherClient';
import { AIFileUpdate, AIStreamChunk, AIStreamContext, AIStreamFileUpdates, ConversationHistoryItem, StreamAIRequest } from '@/types/feathers';
import { useCallback, useEffect, useState } from 'react';

export interface UseAIStreamReturn {
    // State
    streaming: boolean;
    error: string | null;
    currentChunk: AIStreamChunk | null;
    accumulatedContent: string;
    fileUpdates: AIFileUpdate[];
    messageId: string | null;

    // Methods
    streamAIResponse: (request: StreamAIRequest) => Promise<void>;
    resetStream: () => void;
    clearFileUpdates: () => void;
}

export function useAIStream(): UseAIStreamReturn {
    const [streaming, setStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentChunk, setCurrentChunk] = useState<AIStreamChunk | null>(null);
    const [accumulatedContent, setAccumulatedContent] = useState('');
    const [fileUpdates, setFileUpdates] = useState<AIFileUpdate[]>([]);
    const [messageId, setMessageId] = useState<string | null>(null);
    const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    // Stream AI response
    const streamAIResponse = useCallback(
        async (request: StreamAIRequest) => {
            if (!isBrowser) {
                throw new Error('Cannot stream AI response on the server');
            }

            setStreaming(true);
            setError(null);
            setAccumulatedContent('');
            setFileUpdates([]);
            setCurrentProjectId(request.projectId);
            setCurrentChunk(null);
            setMessageId(null);

            try {
                const result = await createAIStream(request);
                // The response might contain initial message ID
                if (result && result.messageId) {
                    setMessageId(result.messageId);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to stream AI response';
                setError(message);
                console.error('[useAIStream] Error streaming AI response:', err);
                setStreaming(false);
                throw err;
            }
        },
        [isBrowser]
    );

    // Reset stream state
    const resetStream = useCallback(() => {
        setStreaming(false);
        setError(null);
        setCurrentChunk(null);
        setAccumulatedContent('');
        setFileUpdates([]);
        setMessageId(null);
        setCurrentProjectId(null);
    }, []);

    // Clear file updates
    const clearFileUpdates = useCallback(() => {
        setFileUpdates([]);
    }, []);

    // Set up real-time event listeners for AI streaming
    useEffect(() => {
        if (!isBrowser) return;

        const service = feathersClient.service('ai-stream');

        // Handle AI stream chunks
        const handleChunk = (data: AIStreamChunk) => {
            // Only process chunks for the current project
            if (currentProjectId && data.projectId !== currentProjectId) {
                return;
            }

            setCurrentChunk(data);

            // Accumulate content
            if (data.content) {
                setAccumulatedContent((prev) => {
                    // If fullContent is provided, use it
                    if (data.fullContent) {
                        return data.fullContent;
                    }
                    // Otherwise, append the new chunk
                    return prev + data.content;
                });
            }

            // Update message ID if provided
            if (data.messageId) {
                setMessageId(data.messageId);
            }

            // Stop streaming if done
            if (data.done) {
                setStreaming(false);
            }
        };

        // Handle AI file updates
        const handleFileUpdates = (data: AIStreamFileUpdates) => {
            // Only process updates for the current project
            if (currentProjectId && data.projectId !== currentProjectId) {
                return;
            }

            setFileUpdates(data.updates);
        };

        service.removeListener('chunk', handleChunk);
        service.removeListener('file-updates', handleFileUpdates);
        service.on('chunk', handleChunk);
        service.on('file-updates', handleFileUpdates);

        return () => {
            service.removeListener('chunk', handleChunk);
            service.removeListener('file-updates', handleFileUpdates);
        };
    }, [isBrowser, currentProjectId]);

    return {
        // State
        streaming,
        error,
        currentChunk,
        accumulatedContent,
        fileUpdates,
        messageId,

        // Methods
        streamAIResponse,
        resetStream,
        clearFileUpdates
    };
}

/**
 * Helper hook for streaming AI responses with conversation history
 */
export interface UseAIChatStreamReturn extends UseAIStreamReturn {
    streamMessage: (projectId: string, message: string, context?: AIStreamContext) => Promise<void>;
}

export function useAIChatStream(getHistory: (projectId: string) => Promise<ConversationHistoryItem[]>): UseAIChatStreamReturn {
    const aiStream = useAIStream();

    const streamMessage = useCallback(
        async (projectId: string, message: string, context?: AIStreamContext) => {
            const history = await getHistory(projectId);
            await aiStream.streamAIResponse({
                projectId,
                message,
                conversationHistory: history,
                ...(context !== undefined && { context })
            });
        },
        [aiStream, getHistory]
    );

    return {
        ...aiStream,
        streamMessage
    };
}
