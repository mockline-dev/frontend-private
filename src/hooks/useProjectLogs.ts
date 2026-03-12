'use client';

import { getBackendUrl } from '@/config/environment';
import { useCallback, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const PROJECT_LOG_EVENT = 'mockline:project-log';
const PROJECT_LOG_BATCH_EVENT = 'mockline:project-logs';

export interface LogEntry {
    id: string;
    type: 'info' | 'error' | 'success' | 'system' | 'warning';
    message: string;
    timestamp: Date;
    projectId: string;
    source?: string;
}

export interface UseProjectLogsReturn {
    logs: LogEntry[];
    loading: boolean;
    error: string | null;
    clearLogs: () => void;
    addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
    connectWebSocket: () => void;
    disconnectWebSocket: () => void;
    isConnected: boolean;
}

export interface ProjectLogEventPayload {
    projectId: string;
    type: LogEntry['type'];
    message: string;
    source?: string;
}

export function emitProjectLog(payload: ProjectLogEventPayload) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<ProjectLogEventPayload>(PROJECT_LOG_EVENT, { detail: payload }));
}

export function emitProjectLogs(projectId: string, logs: Array<Omit<LogEntry, 'id' | 'timestamp' | 'projectId'>>) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(
        new CustomEvent<{ projectId: string; logs: Array<Omit<LogEntry, 'id' | 'timestamp' | 'projectId'>> }>(PROJECT_LOG_BATCH_EVENT, { detail: { projectId, logs } })
    );
}

/**
 * Hook to manage project logs and real-time updates using Socket.IO
 */
export function useProjectLogs(projectId?: string): UseProjectLogsReturn {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);

    // Add a new log entry
    const addLog = useCallback(
        (log: Omit<LogEntry, 'id' | 'timestamp' | 'projectId'>) => {
            const newLog: LogEntry = {
                ...log,
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                timestamp: new Date(),
                projectId: projectId || ''
            };

            setLogs((prev) => [...prev, newLog]);
        },
        [projectId]
    );

    // Clear all logs
    const clearLogs = useCallback(() => {
        setLogs([]);
    }, []);

    // Connect to Socket.IO for real-time logs
    const connectWebSocket = useCallback(() => {
        if (!projectId || socket) return;

        try {
            const backendUrl = getBackendUrl('');
            const socketInstance = io(backendUrl, {
                path: '/socket.io',
                transports: ['websocket', 'polling'],
                query: { projectId },
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            socketInstance.on('connect', () => {
                setIsConnected(true);
                setError(null);
                addLog({
                    type: 'system',
                    message: 'Connected to project logs',
                    source: 'terminal'
                });
            });

            socketInstance.on('connect_error', (err) => {
                setError('Socket.IO connection failed');
                setIsConnected(false);
                console.error('Socket.IO connection error:', err);
                addLog({
                    type: 'warning',
                    message: 'Could not connect to real-time logs. Backend server may be unavailable.',
                    source: 'terminal'
                });
            });

            socketInstance.on('disconnect', (reason) => {
                setIsConnected(false);
                addLog({
                    type: 'system',
                    message: `Disconnected from project logs: ${reason}`,
                    source: 'terminal'
                });
            });

            socketInstance.on('log', (data: { type?: string; message: string; source?: string; projectId: string }) => {
                if (data.projectId === projectId) {
                    addLog({
                        type: (data.type as LogEntry['type']) || 'info',
                        message: data.message,
                        source: data.source || 'server'
                    });
                }
            });

            socketInstance.on('error', (err: Error) => {
                console.error('Socket.IO error:', err);
                addLog({
                    type: 'error',
                    message: `Socket error: ${err.message}`,
                    source: 'terminal'
                });
            });

            setSocket(socketInstance);
        } catch (err) {
            setError('Failed to connect to logs');
            console.error('Socket.IO connection error:', err);
            addLog({
                type: 'warning',
                message: 'Could not initialize socket connection',
                source: 'terminal'
            });
        }
    }, [projectId, socket, addLog]);

    // Disconnect Socket.IO
    const disconnectWebSocket = useCallback(() => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setIsConnected(false);
        }
    }, [socket]);

    // Load initial logs when projectId changes
    useEffect(() => {
        if (!projectId) {
            setLogs([]);
            return;
        }

        setLoading(true);
        addLog({
            type: 'system',
            message: `Connected to project ${projectId}`,
            source: 'terminal'
        });
        setLoading(false);
    }, [projectId, addLog]);

    // Auto-connect Socket.IO when projectId is available
    useEffect(() => {
        if (projectId && !socket) {
            // Delay connection slightly to allow component to mount
            const timer = setTimeout(connectWebSocket, 1000);
            return () => clearTimeout(timer);
        }
    }, [projectId, socket, connectWebSocket]);

    // Bridge logs emitted by local UI flows (server actions, etc.) into terminal state.
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleSingle = (event: Event) => {
            const customEvent = event as CustomEvent<ProjectLogEventPayload>;
            const detail = customEvent.detail;
            if (!detail || detail.projectId !== projectId) return;

            addLog({
                type: detail.type,
                message: detail.message,
                source: detail.source || 'ui'
            });
        };

        const handleBatch = (event: Event) => {
            const customEvent = event as CustomEvent<{ projectId: string; logs: Array<Omit<LogEntry, 'id' | 'timestamp' | 'projectId'>> }>;
            const detail = customEvent.detail;
            if (!detail || detail.projectId !== projectId) return;

            for (const entry of detail.logs || []) {
                addLog({
                    type: entry.type,
                    message: entry.message,
                    source: entry.source || 'ui'
                });
            }
        };

        window.addEventListener(PROJECT_LOG_EVENT, handleSingle as EventListener);
        window.addEventListener(PROJECT_LOG_BATCH_EVENT, handleBatch as EventListener);

        return () => {
            window.removeEventListener(PROJECT_LOG_EVENT, handleSingle as EventListener);
            window.removeEventListener(PROJECT_LOG_BATCH_EVENT, handleBatch as EventListener);
        };
    }, [projectId, addLog]);

    // Cleanup Socket.IO on unmount
    useEffect(() => {
        return () => {
            disconnectWebSocket();
        };
    }, [disconnectWebSocket]);

    return {
        logs,
        loading,
        error,
        clearLogs,
        addLog,
        connectWebSocket,
        disconnectWebSocket,
        isConnected
    };
}
