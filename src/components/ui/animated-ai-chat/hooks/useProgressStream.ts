'use client';

import { useEffect, useRef, useState } from 'react';

export interface ProgressUpdate {
    stage: string;
    percentage: number;
    currentFile?: string;
    message?: string;
    timestamp: number;
}

export interface UseProgressStreamOptions {
    enabled: boolean;
    onProgress?: (update: ProgressUpdate) => void;
    onComplete?: () => void;
    onError?: (error: Error) => void;
}

export function useProgressStream(options: UseProgressStreamOptions) {
    const { enabled, onProgress, onComplete, onError } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [currentProgress, setCurrentProgress] = useState<ProgressUpdate | null>(null);
    const [error, setError] = useState<Error | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 3;
    const reconnectDelay = 2000;

    useEffect(() => {
        if (!enabled) {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsConnected(false);
            return;
        }

        let ws: WebSocket | null = null;
        let reconnectTimeout: NodeJS.Timeout | null = null;

        const connect = () => {
            try {
                // In a real implementation, this would connect to your WebSocket endpoint
                // For now, we'll simulate progress updates
                ws = new WebSocket('ws://localhost:3001/api/progress');

                ws.onopen = () => {
                    setIsConnected(true);
                    setError(null);
                    reconnectAttemptsRef.current = 0;
                };

                ws.onmessage = (event) => {
                    try {
                        const update: ProgressUpdate = JSON.parse(event.data);
                        setCurrentProgress(update);
                        onProgress?.(update);

                        if (update.percentage >= 100) {
                            onComplete?.();
                        }
                    } catch (err) {
                        console.error('Failed to parse progress update:', err);
                    }
                };

                ws.onerror = (event) => {
                    console.error('WebSocket error:', event);
                    const errorObj = new Error('WebSocket connection error');
                    setError(errorObj);
                    onError?.(errorObj);
                };

                ws.onclose = () => {
                    setIsConnected(false);

                    // Attempt to reconnect if not intentionally closed
                    if (reconnectAttemptsRef.current < maxReconnectAttempts) {
                        reconnectTimeout = setTimeout(() => {
                            reconnectAttemptsRef.current++;
                            connect();
                        }, reconnectDelay);
                    }
                };

                wsRef.current = ws;
            } catch (err) {
                console.error('Failed to create WebSocket connection:', err);
                const errorObj = err instanceof Error ? err : new Error('Failed to create WebSocket connection');
                setError(errorObj);
                onError?.(errorObj);
            }
        };

        connect();

        return () => {
            if (reconnectTimeout) {
                clearTimeout(reconnectTimeout);
            }
            if (ws) {
                ws.close();
            }
        };
    }, [enabled, onProgress, onComplete, onError]);

    const send = (data: unknown) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(data));
        }
    };

    const disconnect = () => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        setIsConnected(false);
    };

    return {
        isConnected,
        currentProgress,
        error,
        send,
        disconnect
    };
}

// Simulated progress stream for development/testing
export function useSimulatedProgressStream(options: UseProgressStreamOptions & { duration?: number }) {
    const { enabled, onProgress, onComplete, duration = 30000 } = options;
    const [isConnected, setIsConnected] = useState(false);
    const [currentProgress, setCurrentProgress] = useState<ProgressUpdate | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled) {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setIsConnected(false);
            return;
        }

        setIsConnected(true);
        let progress = 0;
        const stages = ['Analyzing prompt', 'Planning architecture', 'Generating files', 'Validating code', 'Finalizing project'];
        let currentStageIndex = 0;

        intervalRef.current = setInterval(() => {
            progress += Math.random() * 2 + 0.5;

            // Update stage based on progress
            const newStageIndex = Math.min(Math.floor((progress / 100) * stages.length), stages.length - 1);
            if (newStageIndex !== currentStageIndex) {
                currentStageIndex = newStageIndex;
            }

            const update: ProgressUpdate = {
                stage: stages[currentStageIndex]!,
                percentage: Math.min(progress, 100),
                message: `Processing... ${Math.round(progress)}%`,
                timestamp: Date.now()
            };

            setCurrentProgress(update);
            onProgress?.(update);

            if (progress >= 100) {
                if (intervalRef.current) {
                    clearInterval(intervalRef.current);
                }
                setIsConnected(false);
                onComplete?.();
            }
        }, duration / 100);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [enabled, onProgress, onComplete, duration]);

    return {
        isConnected,
        currentProgress,
        error: null,
        send: () => {},
        disconnect: () => {}
    };
}
