'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { Terminal as XTerm } from '@xterm/xterm';
import { Bug, Check, Eraser, Square, Terminal as TerminalIcon, X, Zap } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import '@xterm/xterm/css/xterm.css';
import { DebugPanel } from './DebugPanel';
import { backendUrl } from '@/config/environment';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TerminalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId?: string | undefined;
    sessionId?: string | undefined;
    sessionStatus?: 'starting' | 'repairing' | 'running' | 'stopped' | 'error' | null | undefined;
    sessionOutput?: string[] | undefined;
    variant?: 'panel' | 'floating';
    onClear?: (() => void) | undefined;
}

// ─── Status chip ──────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
    starting:  { label: 'Starting',  dot: 'bg-amber-400 animate-pulse',  text: 'text-amber-300',   ring: 'ring-amber-500/20' },
    repairing: { label: 'Repairing', dot: 'bg-amber-500 animate-spin',   text: 'text-amber-300',   ring: 'ring-amber-500/20' },
    running:   { label: 'Running',   dot: 'bg-emerald-400',               text: 'text-emerald-300', ring: 'ring-emerald-500/20' },
    stopped:   { label: 'Stopped',   dot: 'bg-zinc-500',                  text: 'text-zinc-400',    ring: 'ring-zinc-500/20'  },
    error:     { label: 'Error',     dot: 'bg-red-500',                   text: 'text-red-300',     ring: 'ring-red-500/20'   },
} as const;

function StatusChip({ status }: { status: NonNullable<TerminalProps['sessionStatus']> }) {
    const cfg = STATUS_CONFIG[status];
    const icon = status === 'running'
        ? <Check className="w-2.5 h-2.5" />
        : status === 'error'
        ? <X className="w-2.5 h-2.5" />
        : <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold ring-1 bg-zinc-900', cfg.text, cfg.ring)}>
            {icon}
            {cfg.label}
        </span>
    );
}

// ─── xterm theme (zinc-mapped) ────────────────────────────────────────────────

const XTERM_THEME = {
    background:       '#09090b', // zinc-950
    foreground:       '#f4f4f5', // zinc-100
    cursor:           '#e4e4e7', // zinc-200
    cursorAccent:     '#09090b',
    selectionBackground: 'rgba(161,161,170,0.2)',
    // Standard ANSI (zinc-mapped where sensible, saturated for signal colours)
    black:            '#18181b', // zinc-900
    red:              '#f87171', // red-400
    green:            '#4ade80', // green-400
    yellow:           '#facc15', // yellow-400
    blue:             '#60a5fa', // blue-400
    magenta:          '#c084fc', // purple-400
    cyan:             '#22d3ee', // cyan-400
    white:            '#d4d4d8', // zinc-300
    brightBlack:      '#3f3f46', // zinc-700
    brightRed:        '#fca5a5', // red-300
    brightGreen:      '#86efac', // green-300
    brightYellow:     '#fde047', // yellow-300
    brightBlue:       '#93c5fd', // blue-300
    brightMagenta:    '#d8b4fe', // purple-300
    brightCyan:       '#67e8f9', // cyan-300
    brightWhite:      '#f4f4f5', // zinc-100
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Terminal({
    isOpen,
    onClose,
    projectId,
    sessionId,
    sessionStatus,
    sessionOutput = [],
    variant = 'panel',
    onClear,
}: TerminalProps) {
    const containerRef  = useRef<HTMLDivElement>(null);
    const xtermRef      = useRef<XTerm | null>(null);
    const fitAddonRef   = useRef<FitAddon | null>(null);
    const initializedRef = useRef(false);
    const lastOutputLen = useRef(0);
    const [debugMode, setDebugMode] = useState(false);

    // ── Init xterm on mount ──────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || initializedRef.current) return;
        initializedRef.current = true;

        const term = new XTerm({
            theme: XTERM_THEME,
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: 12,
            lineHeight: 1.5,
            letterSpacing: 0.3,
            cursorBlink: true,
            cursorStyle: 'bar',
            scrollback: 5000,
            allowProposedApi: true,
        });

        const fitAddon      = new FitAddon();
        const webLinksAddon = new WebLinksAddon();

        term.loadAddon(fitAddon);
        term.loadAddon(webLinksAddon);
        term.open(containerRef.current);
        fitAddon.fit();

        xtermRef.current    = term;
        fitAddonRef.current = fitAddon;

        // Welcome banner
        term.write(
            `\x1b[90m┌─────────────────────────────────────────────────────────\r\n` +
            `│  \x1b[97mmockline\x1b[90m  sandbox terminal` +
            (projectId ? `  \x1b[2m${projectId.slice(0, 8)}\x1b[0m\x1b[90m` : '') + `\r\n` +
            `└─────────────────────────────────────────────────────────\x1b[0m\r\n\r\n`
        );

        return () => {
            term.dispose();
            xtermRef.current    = null;
            fitAddonRef.current = null;
            initializedRef.current = false;
            lastOutputLen.current  = 0;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ── Fit on resize ────────────────────────────────────────────────────────
    useEffect(() => {
        if (!containerRef.current || !fitAddonRef.current) return;
        const ro = new ResizeObserver(() => fitAddonRef.current?.fit());
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // ── Stream new sessionOutput lines into xterm ────────────────────────────
    useEffect(() => {
        const term = xtermRef.current;
        if (!term) return;

        const newLines = sessionOutput.slice(lastOutputLen.current);
        for (const line of newLines) {
            term.write(line.endsWith('\n') || line.endsWith('\r\n') ? line : line + '\r\n');
        }
        lastOutputLen.current = sessionOutput.length;
    }, [sessionOutput]);

    // ── Session status transitions ───────────────────────────────────────────
    const prevStatusRef = useRef<string | null>(null);
    useEffect(() => {
        const term = xtermRef.current;
        if (!term || sessionStatus === prevStatusRef.current) return;
        prevStatusRef.current = sessionStatus ?? null;

        if (!sessionStatus) return;

        const ts  = new Date().toLocaleTimeString('en-US', { hour12: false });
        const tsFmt = `\x1b[90m[${ts}]\x1b[0m `;
        const msgs: Record<string, string> = {
            starting:  `${tsFmt}\x1b[33m\x1b[1m◉ STARTING\x1b[0m   Initialising sandbox container…\r\n`,
            repairing: `${tsFmt}\x1b[33m\x1b[1m⟳ REPAIRING\x1b[0m  Auto-repair in progress…\r\n`,
            running:   `${tsFmt}\x1b[92m\x1b[1m◉ RUNNING\x1b[0m    Server ready — accepting connections.\r\n`,
            stopped:   `${tsFmt}\x1b[90m\x1b[1m◎ STOPPED\x1b[0m    Session terminated.\r\n`,
            error:     `${tsFmt}\x1b[91m\x1b[1m◉ ERROR\x1b[0m      Session encountered a fatal error.\r\n`,
        };
        if (msgs[sessionStatus]) term.write(msgs[sessionStatus]);
    }, [sessionStatus]);

    const handleClear = useCallback(() => {
        xtermRef.current?.clear();
        lastOutputLen.current = 0;
        onClear?.();
    }, [onClear]);

    if (variant === 'panel') {
        return (
            <div className="h-full flex flex-col bg-zinc-950 border-t border-zinc-800">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-zinc-800/80 bg-zinc-950 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <TerminalIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="text-xs font-mono font-medium text-zinc-300 tracking-wide">TERMINAL</span>

                        {sessionStatus && <StatusChip status={sessionStatus} />}

                        {!sessionStatus && (
                            <span className="text-[10px] font-mono text-zinc-600">
                                {projectId ? `· ${projectId.slice(0, 8)}` : '· no session'}
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5">
                        {sessionStatus === 'error' && sessionId && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-400 hover:text-red-200 hover:bg-zinc-800"
                                onClick={() => setDebugMode((v) => !v)}
                                title="Debug session"
                            >
                                <Bug className="w-3 h-3" />
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                            onClick={handleClear}
                            title="Clear terminal"
                        >
                            <Eraser className="w-3 h-3" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                            onClick={onClose}
                            title="Close terminal"
                        >
                            <X className="w-3 h-3" />
                        </Button>
                    </div>
                </div>

                {/* Debug panel or xterm container */}
                {debugMode && sessionId ? (
                    <DebugPanel
                        sessionId={sessionId}
                        backendUrl={backendUrl}
                        onClose={() => setDebugMode(false)}
                    />
                ) : (
                    <div
                        ref={containerRef}
                        className="flex-1 overflow-hidden"
                        style={{ padding: '6px 8px' }}
                    />
                )}
            </div>
        );
    }

    // Floating variant
    if (!isOpen) return null;

    return (
        <div className="fixed bottom-16 right-4 w-[640px] h-96 flex flex-col bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl shadow-black/60 z-50 overflow-hidden">
            {/* Traffic-light header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
                <div className="flex items-center gap-2">
                    {/* macOS dots */}
                    <div className="flex items-center gap-1.5 mr-1">
                        <button onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors" />
                        <span className="w-3 h-3 rounded-full bg-zinc-600" />
                        <span className="w-3 h-3 rounded-full bg-zinc-600" />
                    </div>
                    <TerminalIcon className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-400">terminal</span>
                    {sessionStatus && <StatusChip status={sessionStatus} />}
                </div>
                <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-200" onClick={handleClear}>
                        <Eraser className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-200" onClick={onClose}>
                        <X className="w-3 h-3" />
                    </Button>
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-hidden" style={{ padding: '6px 8px' }} />
        </div>
    );
}

// Re-export unused named imports from old API so existing call sites don't break
export { Zap as _unused1, Square as _unused2 };
