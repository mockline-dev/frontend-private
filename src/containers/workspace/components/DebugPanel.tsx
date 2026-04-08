'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Loader2, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DebugInfo {
    serverLog?: string;
    workspaceFiles?: string[];
    port8000?: boolean;
    processList?: string;
    error?: string;
}

export interface DebugPanelProps {
    sessionId: string;
    backendUrl: string;
    onClose: () => void;
}

export function DebugPanel({ sessionId, backendUrl, onClose }: DebugPanelProps) {
    const [data, setData] = useState<DebugInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [logOpen, setLogOpen] = useState(true);
    const [psOpen, setPsOpen] = useState(false);

    useEffect(() => {
        const url = `${backendUrl.replace(/\/$/, '')}/api-test/${sessionId}/_debug`;
        fetch(url)
            .then(async (res) => {
                const json = await res.json();
                setData(json);
            })
            .catch((err) => {
                setData({ error: err instanceof Error ? err.message : 'Failed to fetch debug info' });
            })
            .finally(() => setLoading(false));
    }, [sessionId, backendUrl]);

    return (
        <div className="flex-1 overflow-y-auto bg-zinc-950 text-zinc-200 text-xs font-mono p-3 space-y-3">
            <div className="flex items-center justify-between mb-1">
                <span className="text-zinc-400 font-semibold tracking-wide text-[10px] uppercase">Debug — {sessionId.slice(0, 8)}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-zinc-500 hover:text-zinc-200" onClick={onClose}>
                    <X className="w-3 h-3" />
                </Button>
            </div>

            {loading && (
                <div className="flex items-center gap-2 text-zinc-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Fetching debug info…</span>
                </div>
            )}

            {data?.error && (
                <p className="text-red-400">{data.error}</p>
            )}

            {data && !data.error && (
                <>
                    {/* Port badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-zinc-500">port 8000:</span>
                        <span className={cn(
                            'px-1.5 py-0.5 rounded text-[10px] font-semibold',
                            data.port8000 ? 'bg-emerald-900 text-emerald-300' : 'bg-red-900 text-red-300'
                        )}>
                            {data.port8000 ? 'BOUND' : 'NOT BOUND'}
                        </span>
                    </div>

                    {/* Workspace files */}
                    {data.workspaceFiles && data.workspaceFiles.length > 0 && (
                        <div>
                            <p className="text-zinc-500 mb-1">workspace files ({data.workspaceFiles.length}):</p>
                            <ul className="space-y-0.5 pl-2">
                                {data.workspaceFiles.map((f) => (
                                    <li key={f} className="text-zinc-300">{f}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Server log */}
                    {data.serverLog && (
                        <div>
                            <button
                                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                                onClick={() => setLogOpen((v) => !v)}
                            >
                                {logOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <span>server log</span>
                            </button>
                            {logOpen && (
                                <pre className="mt-1 p-2 bg-zinc-900 rounded overflow-x-auto whitespace-pre-wrap break-words text-zinc-300 leading-relaxed">
                                    {data.serverLog}
                                </pre>
                            )}
                        </div>
                    )}

                    {/* Process list */}
                    {data.processList && (
                        <div>
                            <button
                                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
                                onClick={() => setPsOpen((v) => !v)}
                            >
                                {psOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                <span>process list</span>
                            </button>
                            {psOpen && (
                                <pre className="mt-1 p-2 bg-zinc-900 rounded overflow-x-auto whitespace-pre-wrap break-words text-zinc-300 leading-relaxed">
                                    {data.processList}
                                </pre>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
