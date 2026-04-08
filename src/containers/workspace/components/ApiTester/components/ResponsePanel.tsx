'use client';

import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyValueEditor } from './KeyValueEditor';
import { ResponseBodyViewer } from './ResponseBodyViewer';
import { formatSize } from '../utils/responseParser';
import type { ApiResponse, RequestStatus } from '../types';

interface ResponsePanelProps {
    response: ApiResponse | null;
    status: RequestStatus;
    error: string | null;
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
