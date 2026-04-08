'use client';

import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyValueEditor } from './KeyValueEditor';
import { ResponseBodyViewer } from './ResponseBodyViewer';
import { formatSize } from '../utils/responseParser';
import type { ApiResponse, RequestStatus } from '../types';
import { useState } from 'react';
import { ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';

interface ResponsePanelProps {
    response: ApiResponse | null;
    status: RequestStatus;
    error: string | null;
}

interface StructuredError {
    error: string;
    serverLog?: string;
    hint?: string;
}

function tryParseStructuredError(body: string, status: number): StructuredError | null {
    if (status !== 502) return null;
    try {
        const parsed = JSON.parse(body) as Record<string, unknown>;
        if (typeof parsed.error === 'string') return parsed as unknown as StructuredError;
    } catch {}
    return null;
}

function StructuredErrorView({ error, durationMs }: { error: StructuredError; durationMs: number }) {
    const [logOpen, setLogOpen] = useState(false);
    return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-200 shrink-0">
                <span className="text-xs font-semibold font-mono px-2 py-0.5 rounded bg-red-50 text-red-700">502</span>
                <span className="text-xs text-zinc-500">Bad Gateway</span>
                <span className="text-xs text-zinc-400">{durationMs}ms</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <div className="flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                        <p className="text-sm font-semibold text-red-700 mb-0.5">Server Error</p>
                        <p className="text-xs text-red-600">{error.error}</p>
                    </div>
                </div>

                {error.hint && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-xs font-semibold text-amber-700 mb-0.5">Hint</p>
                        <p className="text-xs text-amber-600">{error.hint}</p>
                    </div>
                )}

                {error.serverLog && (
                    <div className="border border-zinc-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setLogOpen((o) => !o)}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-zinc-50 hover:bg-zinc-100 transition-colors text-left"
                        >
                            {logOpen ? <ChevronDown className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />}
                            <span className="text-xs font-semibold text-zinc-600">Server Log</span>
                        </button>
                        {logOpen && (
                            <pre className="p-3 text-xs font-mono text-red-600 bg-zinc-950 whitespace-pre-wrap overflow-x-auto max-h-64">
                                {error.serverLog}
                            </pre>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: number }) {
    const isOk = status >= 200 && status < 300;
    const isRedirect = status >= 300 && status < 400;
    return (
        <span className={cn('text-xs font-semibold font-mono px-2 py-0.5 rounded', isOk ? 'bg-emerald-50 text-emerald-700' : isRedirect ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700')}>
            {status}
        </span>
    );
}

export function ResponsePanel({ response, status, error }: ResponsePanelProps) {
    if (status === 'loading') {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <p className="text-xs text-zinc-400 animate-pulse">Sending request…</p>
            </div>
        );
    }

    if (status === 'error' && error) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <p className="text-xs text-red-500">{error}</p>
            </div>
        );
    }

    if (!response) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <p className="text-xs text-zinc-400">Hit Send to get a response</p>
            </div>
        );
    }

    const structuredError = tryParseStructuredError(response.body, response.status);
    if (structuredError) {
        return <StructuredErrorView error={structuredError} durationMs={response.durationMs} />;
    }

    const responseHeaderPairs = Object.entries(response.headers).map(([key, value], i) => ({
        id: String(i),
        key,
        value,
        enabled: true,
    }));

    const ct = response.headers['content-type'] ?? '';

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
            <div className="flex items-center gap-3 px-3 py-2 border-b border-zinc-200 shrink-0">
                <StatusBadge status={response.status} />
                <span className="text-xs text-zinc-500">{response.statusText}</span>
                <span className="text-xs text-zinc-400">{response.durationMs}ms</span>
                <span className="text-xs text-zinc-400">{formatSize(response.size)}</span>
            </div>

            <Tabs defaultValue="body" className="flex-1 flex flex-col overflow-hidden">
                <TabsList className="shrink-0 h-8 bg-zinc-100 mx-3 mt-2 w-auto self-start">
                    <TabsTrigger value="body" className="text-xs h-6 px-3">Body</TabsTrigger>
                    <TabsTrigger value="headers" className="text-xs h-6 px-3">Headers</TabsTrigger>
                </TabsList>

                <TabsContent value="body" className="flex-1 overflow-hidden mt-0">
                    <ResponseBodyViewer body={response.body} contentType={ct} />
                </TabsContent>

                <TabsContent value="headers" className="flex-1 overflow-y-auto p-3 mt-0">
                    <KeyValueEditor pairs={responseHeaderPairs} onChange={() => void 0} readOnly />
                </TabsContent>
            </Tabs>
        </div>
    );
}

