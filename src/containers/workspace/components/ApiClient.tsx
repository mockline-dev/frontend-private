'use client';

import { ApiClientModalProvider, useApiClientModal } from '@scalar/api-client-react';
import '@/styles/scalar-zinc-theme.css';
import { backendUrl } from '@/config/environment';
import { cn } from '@/lib/utils';
import { AlertCircle, ExternalLink, Loader2, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Inline client trigger ────────────────────────────────────────────────────

function ApiClientInner({
    sessionId,
    sessionProxyUrl,
    isSessionRunning
}: {
    sessionId?: string;
    sessionProxyUrl?: string;
    isSessionRunning: boolean;
}) {
    const client = useApiClientModal();
    const [openApiSpec, setOpenApiSpec] = useState<string | null>(null);
    const [loadingSpec, setLoadingSpec] = useState(false);
    const hasFetchedRef = useRef(false);

    // When session becomes running, attempt to fetch the FastAPI OpenAPI spec
    useEffect(() => {
        if (!isSessionRunning || !sessionProxyUrl || !sessionId || hasFetchedRef.current) return;

        const fetchSpec = async () => {
            setLoadingSpec(true);
            try {
                const res = await fetch(`${backendUrl}/api-test/${sessionId}/openapi.json`, {
                    headers: { Authorization: `Bearer ${typeof window !== 'undefined' ? document.cookie.match(/jwt=([^;]+)/)?.[1] ?? '' : ''}` }
                });
                if (res.ok) {
                    const spec = await res.json();
                    setOpenApiSpec(JSON.stringify(spec));
                    hasFetchedRef.current = true;
                }
            } catch {
                // Spec not available — Scalar works without it for manual testing
            } finally {
                setLoadingSpec(false);
            }
        };

        fetchSpec();
    }, [isSessionRunning, sessionProxyUrl, sessionId]);

    const handleOpenClient = () => {
        if (!client) return;
        client.open();
    };

    return (
        <div className="h-full flex flex-col bg-zinc-950">
            {/* Status bar */}
            <div className={cn(
                'flex items-center justify-between px-4 py-2.5 border-b border-zinc-800',
                'text-xs font-mono'
            )}>
                <div className="flex items-center gap-2">
                    <span className={cn(
                        'inline-block w-1.5 h-1.5 rounded-full',
                        isSessionRunning ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-zinc-600'
                    )} />
                    <span className={isSessionRunning ? 'text-zinc-300' : 'text-zinc-600'}>
                        {isSessionRunning
                            ? `container · ${sessionProxyUrl ?? 'running'}`
                            : 'container not running — start backend first'}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    {loadingSpec && (
                        <span className="flex items-center gap-1 text-zinc-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            loading spec…
                        </span>
                    )}
                    {openApiSpec && (
                        <span className="text-emerald-500">openapi ✓</span>
                    )}
                </div>
            </div>

            {/* Main content */}
            {isSessionRunning ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
                    <div className="text-center max-w-sm">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3">
                            <Play className="w-4 h-4 text-zinc-300" />
                        </div>
                        <p className="text-sm font-medium text-zinc-200 mb-1">API Client ready</p>
                        <p className="text-xs text-zinc-500 mb-4">
                            {openApiSpec
                                ? 'OpenAPI spec loaded — endpoints are auto-discovered.'
                                : 'No spec found. You can test endpoints manually.'}
                        </p>
                        <button
                            onClick={handleOpenClient}
                            className={cn(
                                'inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono',
                                'bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600',
                                'text-zinc-200 hover:text-white transition-all'
                            )}
                        >
                            <ExternalLink className="w-3 h-3" />
                            Open API Client
                        </button>
                    </div>

                    {/* Quick reference */}
                    <div className="w-full max-w-sm bg-zinc-900/60 border border-zinc-800 rounded-lg p-3 font-mono text-[11px]">
                        <p className="text-zinc-600 mb-2">proxy endpoint</p>
                        <p className="text-zinc-400 break-all">
                            {sessionId
                                ? `${backendUrl}/api-test/${sessionId}/*`
                                : '—'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6">
                    <AlertCircle className="w-8 h-8 text-zinc-700" />
                    <p className="text-sm text-zinc-500 text-center">Start the backend to enable API testing</p>
                    <p className="text-xs text-zinc-700 text-center font-mono">Run → session starts → container ready → test</p>
                </div>
            )}
        </div>
    );
}

// ─── Exported wrapper ─────────────────────────────────────────────────────────

interface ApiClientProps {
    sessionId?: string;
    sessionProxyUrl?: string;
    isSessionRunning: boolean;
}

export function ApiClient(props: ApiClientProps) {
    const proxyUrl = props.sessionId
        ? `${backendUrl}/api-test/${props.sessionId}`
        : undefined;

    return (
        <div className="scalar-api-client-embedded h-full">
            <ApiClientModalProvider
                /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                configuration={proxyUrl ? ({ proxyUrl } as any) : undefined}
            >
                <ApiClientInner {...props} />
            </ApiClientModalProvider>
        </div>
    );
}
