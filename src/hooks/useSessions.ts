'use client';

import { createSession as createSessionAction } from '@/api/sessions/createSession';
import { deleteSession } from '@/api/sessions/deleteSession';
import { fetchSessionById } from '@/api/sessions/fetchSessionById';
import { fetchSessions } from '@/api/sessions/fetchSessions';
import { CreateSessionData, Session } from '@/types/feathers';
import { useCallback, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export interface UseSessionsReturn {
    sessions: Session[];
    currentSession: Session | null;
    loading: boolean;
    error: string | null;
    isSessionRunning: boolean;
    sessionProxyUrl: string | null;

    loadSessions: (projectId: string) => Promise<void>;
    loadSession: (sessionId: string) => Promise<void>;
    createSession: (data: CreateSessionData) => Promise<Session>;
    stopSession: (sessionId: string) => Promise<void>;
    refresh: (projectId: string) => Promise<void>;
}

export function useSessions(): UseSessionsReturn {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [currentSession, setCurrentSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isBrowser = typeof window !== 'undefined';

    const loadSessions = useCallback(
        async (projectId: string) => {
            if (!isBrowser) return;
            setLoading(true);
            setError(null);
            try {
                const result = await fetchSessions({ query: { projectId, $sort: { createdAt: -1 } } });
                const data = Array.isArray(result) ? result : result.data;
                setSessions(data);
                // Auto-set current session to the most recent running one
                const running = data.find((s) => s.status === 'running');
                if (running) setCurrentSession(running);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load sessions';
                setError(message);
                console.error('[useSessions] Error loading sessions:', err);
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    const loadSession = useCallback(
        async (sessionId: string) => {
            if (!isBrowser) return;
            setLoading(true);
            setError(null);
            try {
                const session = await fetchSessionById({ id: sessionId });
                setCurrentSession(session);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load session';
                setError(message);
                console.error('[useSessions] Error loading session:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    const createSession = useCallback(
        async (data: CreateSessionData): Promise<Session> => {
            if (!isBrowser) throw new Error('Cannot create session on the server');
            setLoading(true);
            setError(null);
            try {
                const session = await createSessionAction(data);
                setSessions((prev) => [session, ...prev]);
                setCurrentSession(session);
                return session;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to create session';
                setError(message);
                console.error('[useSessions] Error creating session:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    const stopSession = useCallback(
        async (sessionId: string) => {
            if (!isBrowser) throw new Error('Cannot stop session on the server');
            setLoading(true);
            setError(null);
            try {
                await deleteSession({ id: sessionId });
                setSessions((prev) => prev.filter((s) => s._id !== sessionId));
                setCurrentSession((prev) => (prev?._id === sessionId ? null : prev));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to stop session';
                setError(message);
                console.error('[useSessions] Error stopping session:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    const refresh = useCallback(
        async (projectId: string) => {
            await loadSessions(projectId);
        },
        [loadSessions]
    );

    // Listen for real-time session status changes
    useRealtimeUpdates<Session>('sessions', 'patched', (session) => {
        setSessions((prev) => prev.map((s) => (s._id === session._id ? session : s)));
        setCurrentSession((prev) => (prev?._id === session._id ? session : prev));
    });

    useRealtimeUpdates<Session>('sessions', 'created', (session) => {
        setSessions((prev) => (prev.some((s) => s._id === session._id) ? prev : [session, ...prev]));
    });

    useRealtimeUpdates<Session>('sessions', 'removed', (session) => {
        setSessions((prev) => prev.filter((s) => s._id !== session._id));
        setCurrentSession((prev) => (prev?._id === session._id ? null : prev));
    });

    const isSessionRunning = currentSession?.status === 'running';
    const sessionProxyUrl = currentSession?.proxyUrl ?? null;

    return {
        sessions,
        currentSession,
        loading,
        error,
        isSessionRunning,
        sessionProxyUrl,
        loadSessions,
        loadSession,
        createSession,
        stopSession,
        refresh
    };
}
