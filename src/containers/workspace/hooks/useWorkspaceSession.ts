'use client';

import { useRealtimeUpdates, useSocketEvent } from '@/hooks/useRealtimeUpdates';
import type {
    RepairCompletedEvent,
    RepairFailedEvent,
    RepairProgressEvent,
    RepairStartedEvent,
    SandboxResultEvent,
    Session,
    TerminalPhase,
    TerminalStderrEvent,
    TerminalStdoutEvent
} from '@/types/feathers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const PHASE_HEADERS: Record<TerminalPhase, string> = {
    deps: '\x1b[33m\x1b[1m── Installing dependencies…\x1b[0m',
    start: '\x1b[36m\x1b[1m── Starting server…\x1b[0m',
    server: '\x1b[97m\x1b[1m── Server output\x1b[0m',
    repair: '\x1b[33m\x1b[1m── Auto-repair\x1b[0m'
};

interface UseWorkspaceSessionParams {
    currentSession: Session | null | undefined;
    isSessionRunning: boolean;
    currentProjectId: string | undefined;
    setIsTerminalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useWorkspaceSession({ currentSession, isSessionRunning, currentProjectId, setIsTerminalOpen }: UseWorkspaceSessionParams) {
    const [isRunning, setIsRunning] = useState(false);
    const [isBackendReady, setIsBackendReady] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [repairStatus, setRepairStatus] = useState<'analyzing' | 'applying' | 'completed' | 'failed' | null>(null);
    const [repairAttempt, setRepairAttempt] = useState(0);
    const [repairMaxAttempts, setRepairMaxAttempts] = useState(0);

    const currentSessionRef = useRef<Session | null | undefined>(null);
    const lastPhaseRef = useRef<TerminalPhase | null>(null);
    const errorWrittenRef = useRef<string | null>(null);
    const repairWrittenRef = useRef<string | null>(null);

    useEffect(() => {
        currentSessionRef.current = currentSession;
    }, [currentSession]);

    useEffect(() => {
        setIsBackendReady(false);
        setTerminalOutput([]);
        lastPhaseRef.current = null;
        errorWrittenRef.current = null;
    }, [currentProjectId]);

    useEffect(() => {
        setIsBackendReady(isSessionRunning);
        if (isSessionRunning) {
            setIsRunning(false);
            setIsTerminalOpen(true);
            errorWrittenRef.current = null;
            repairWrittenRef.current = null;
            toast.success('Backend session started');
        }
        if (currentSession?.status === 'repairing') {
            const msg = currentSession.errorMessage ?? 'Auto-repair in progress…';
            const repairKey = `${currentSession._id}:repairing:${msg}`;
            if (repairWrittenRef.current !== repairKey) {
                repairWrittenRef.current = repairKey;
                setTerminalOutput((prev) => [...prev, `\x1b[33m\x1b[1m⟳ REPAIRING\x1b[0m  ${msg}`]);
            }
        }
        if (currentSession?.status === 'error' && errorWrittenRef.current !== currentSession._id) {
            errorWrittenRef.current = currentSession._id;
            setIsRunning(false);
            toast.error(currentSession.errorMessage || 'Session failed to start');
            const details: string[] = [];
            if (currentSession.errorMessage) {
                details.push(`\x1b[91m\x1b[1m✖ ${currentSession.errorMessage}\x1b[0m`);
            }
            if (currentSession.serverLog?.trim()) {
                details.push(`\x1b[90m${'─'.repeat(50)}\x1b[0m`);
                details.push(`\x1b[90m\x1b[1m── Server Log\x1b[0m`);
                for (const line of currentSession.serverLog.split('\n')) {
                    if (line.trim()) details.push(`\x1b[31m${line}\x1b[0m`);
                }
            }
            if (details.length > 0) {
                setTerminalOutput((prev) => [...prev, ...details]);
            }
        }
    }, [isSessionRunning, currentSession?.status, currentSession?.errorMessage, currentSession?._id, currentSession?.serverLog, setIsTerminalOpen]);

    useSocketEvent<SandboxResultEvent>('sandbox:result', (event) => {
        const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
        const status = event.success ? '\x1b[92m✔ Sandbox passed\x1b[0m' : '\x1b[91m✖ Sandbox failed\x1b[0m';
        const lines = [
            `\x1b[90m[${ts}]\x1b[0m ${status}${event.durationMs !== undefined ? `  \x1b[90m(${event.durationMs}ms)\x1b[0m` : ''}`,
            ...(event.compilationOutput ? event.compilationOutput.split('\n').map((l) => `  ${l}`) : []),
            ...(event.testOutput ? event.testOutput.split('\n').map((l) => `  ${l}`) : [])
        ];
        setTerminalOutput((prev) => [...prev, ...lines]);
    });

    useRealtimeUpdates<TerminalStdoutEvent>('sessions', 'terminal:stdout', (event) => {
        if (!event || !currentSessionRef.current || event.sessionId !== currentSessionRef.current._id) return;
        const raw: string = event.text ?? (event as any).data ?? '';
        const phase = event.phase;
        if (!phase) return;
        const lines: string[] = [];
        if (phase !== lastPhaseRef.current) {
            lastPhaseRef.current = phase;
            lines.push(PHASE_HEADERS[phase]);
        }
        const shouldApplyPhaseColor = phase !== 'repair' && phase !== 'server';
        const phaseColor = phase === 'deps' ? '\x1b[33m' : phase === 'start' ? '\x1b[36m' : '\x1b[97m';
        const rawLines = raw
            .split('\n')
            .filter(Boolean)
            .map((l) => (shouldApplyPhaseColor ? `${phaseColor}${l}\x1b[0m` : l));
        setTerminalOutput((prev) => [...prev, ...lines, ...rawLines]);
    });

    useRealtimeUpdates<TerminalStderrEvent>('sessions', 'terminal:stderr', (event) => {
        if (!event || !currentSessionRef.current || event.sessionId !== currentSessionRef.current._id) return;
        const raw: string = event.text ?? (event as any).data ?? '';
        const phase = event.phase;
        if (raw.includes('Missing modules (not installed):')) {
            toast.error(raw.trim(), { duration: 8000 });
        }
        const lines: string[] = [];
        if (phase && phase !== lastPhaseRef.current) {
            lastPhaseRef.current = phase;
            lines.push(PHASE_HEADERS[phase]);
        }
        const rawLines = raw
            .split('\n')
            .filter(Boolean)
            .map((l) => `\x1b[91m${l}\x1b[0m`);
        setTerminalOutput((prev) => [...prev, ...lines, ...rawLines]);
    });

    useRealtimeUpdates<RepairStartedEvent>('sessions', 'repair:started', (event) => {
        if (!event || !currentSessionRef.current || event.sessionId !== currentSessionRef.current._id) return;
        setRepairStatus('analyzing');
        setRepairAttempt(event.attempt);
        setRepairMaxAttempts(event.maxAttempts);
    });

    useRealtimeUpdates<RepairProgressEvent>('sessions', 'repair:progress', (event) => {
        if (!event || !currentSessionRef.current || event.sessionId !== currentSessionRef.current._id) return;
        setRepairStatus(event.phase);
        setRepairAttempt(event.attempt);
        setRepairMaxAttempts(event.maxAttempts);
    });

    useRealtimeUpdates<RepairCompletedEvent>('sessions', 'repair:completed', (event) => {
        if (!event || !currentSessionRef.current || event.sessionId !== currentSessionRef.current._id) return;
        setRepairStatus('completed');
        const secs = event.durationMs ? ` in ${(event.durationMs / 1000).toFixed(1)}s` : '';
        setTerminalOutput((prev) => [...prev, `\x1b[92m\x1b[1m✔ Repair completed${secs}\x1b[0m`]);
        setTimeout(() => setRepairStatus(null), 3000);
    });

    useRealtimeUpdates<RepairFailedEvent>('sessions', 'repair:failed', (event) => {
        if (!event || !currentSessionRef.current || event.sessionId !== currentSessionRef.current._id) return;
        setRepairStatus('failed');
        setTerminalOutput((prev) => [...prev, `\x1b[91m\x1b[1m✖ Auto-repair failed: ${event.error}\x1b[0m`]);
    });

    const resetForNewRun = useCallback(() => {
        lastPhaseRef.current = null;
        errorWrittenRef.current = null;
    }, []);

    return {
        isRunning,
        setIsRunning,
        isBackendReady,
        setIsBackendReady,
        terminalOutput,
        repairStatus,
        repairAttempt,
        repairMaxAttempts,
        currentSessionRef,
        resetForNewRun,
    };
}
