'use client';

import type { Terminal as XTerm } from '@xterm/xterm';
import { useCallback, useRef, useState } from 'react';

export interface TerminalLine {
    id: string;
    raw: string; // may contain ANSI escape codes
    timestamp: number;
}

export interface UseTerminalReturn {
    lines: TerminalLine[];
    terminalRef: React.MutableRefObject<XTerm | null>;
    write: (text: string) => void;
    writeln: (text: string) => void;
    writeAnsi: (text: string) => void;
    clear: () => void;
    writeSessionStatus: (status: 'starting' | 'running' | 'stopped' | 'error', message?: string) => void;
    writeSandboxResult: (params: { success: boolean; compilationOutput?: string; testOutput?: string; durationMs?: number }) => void;
}

let lineCounter = 0;
const mkId = () => `tl-${Date.now()}-${++lineCounter}`;

// ANSI colour helpers (zinc-mapped)
const ANSI = {
    reset: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    green: '\x1b[32m',
    brightGreen: '\x1b[92m',
    yellow: '\x1b[33m',
    brightYellow: '\x1b[93m',
    red: '\x1b[31m',
    brightRed: '\x1b[91m',
    cyan: '\x1b[36m',
    brightCyan: '\x1b[96m',
    white: '\x1b[37m',
    brightWhite: '\x1b[97m',
    gray: '\x1b[90m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
} as const;

export function useTerminal(): UseTerminalReturn {
    const [lines, setLines] = useState<TerminalLine[]>([]);
    const terminalRef = useRef<XTerm | null>(null);

    const write = useCallback((text: string) => {
        terminalRef.current?.write(text);
        setLines((prev) => [...prev, { id: mkId(), raw: text, timestamp: Date.now() }]);
    }, []);

    const writeln = useCallback((text: string) => {
        const line = text + '\r\n';
        terminalRef.current?.write(line);
        setLines((prev) => [...prev, { id: mkId(), raw: line, timestamp: Date.now() }]);
    }, []);

    const writeAnsi = useCallback((text: string) => {
        terminalRef.current?.write(text);
        setLines((prev) => [...prev, { id: mkId(), raw: text, timestamp: Date.now() }]);
    }, []);

    const clear = useCallback(() => {
        terminalRef.current?.clear();
        setLines([]);
    }, []);

    const writeSessionStatus = useCallback(
        (status: 'starting' | 'running' | 'stopped' | 'error', message?: string) => {
            const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
            const timestamp = `${ANSI.gray}[${ts}]${ANSI.reset} `;

            const statusMap = {
                starting: `${ANSI.yellow}${ANSI.bold}◉ STARTING${ANSI.reset}  ${message ?? 'Initialising sandbox container…'}`,
                running:  `${ANSI.brightGreen}${ANSI.bold}◉ RUNNING${ANSI.reset}   ${message ?? 'Server is ready and accepting connections.'}`,
                stopped:  `${ANSI.gray}${ANSI.bold}◎ STOPPED${ANSI.reset}   ${message ?? 'Session terminated.'}`,
                error:    `${ANSI.brightRed}${ANSI.bold}◉ ERROR${ANSI.reset}     ${message ?? 'Session encountered a fatal error.'}`,
            };

            const line = timestamp + statusMap[status] + '\r\n';
            terminalRef.current?.write(line);
            setLines((prev) => [...prev, { id: mkId(), raw: line, timestamp: Date.now() }]);
        },
        []
    );

    const writeSandboxResult = useCallback(
        ({ success, compilationOutput, testOutput, durationMs }: { success: boolean; compilationOutput?: string; testOutput?: string; durationMs?: number }) => {
            const divider = `${ANSI.gray}${'─'.repeat(60)}${ANSI.reset}\r\n`;
            const header = success
                ? `${ANSI.brightGreen}${ANSI.bold}✔ Sandbox passed${ANSI.reset}${durationMs !== undefined ? `  ${ANSI.gray}(${durationMs}ms)${ANSI.reset}` : ''}\r\n`
                : `${ANSI.brightRed}${ANSI.bold}✖ Sandbox failed${ANSI.reset}${durationMs !== undefined ? `  ${ANSI.gray}(${durationMs}ms)${ANSI.reset}` : ''}\r\n`;

            let out = divider + header;

            if (compilationOutput?.trim()) {
                out += `${ANSI.cyan}${ANSI.bold}── Compilation${ANSI.reset}\r\n`;
                for (const l of compilationOutput.split('\n')) {
                    out += `  ${ANSI.dim}${l}${ANSI.reset}\r\n`;
                }
            }

            if (testOutput?.trim()) {
                out += `${ANSI.cyan}${ANSI.bold}── Tests${ANSI.reset}\r\n`;
                for (const l of testOutput.split('\n')) {
                    out += `  ${l.startsWith('FAIL') || l.startsWith('✖') || l.includes('Error')
                        ? `${ANSI.red}${l}${ANSI.reset}`
                        : l.startsWith('PASS') || l.startsWith('✔')
                            ? `${ANSI.green}${l}${ANSI.reset}`
                            : l}\r\n`;
                }
            }

            out += divider;
            terminalRef.current?.write(out);
            setLines((prev) => [...prev, { id: mkId(), raw: out, timestamp: Date.now() }]);
        },
        []
    );

    return { lines, terminalRef, write, writeln, writeAnsi, clear, writeSessionStatus, writeSandboxResult };
}
