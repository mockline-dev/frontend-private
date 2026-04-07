'use client';

import '@scalar/api-client-react/style.css';
import '@/styles/scalar-zinc-theme.css';

import { ApiClientModalProvider, useApiClientModal } from '@scalar/api-client-react';
import { Button } from '@/components/ui/button';
import { Loader2, Play, Zap } from 'lucide-react';
import { useEffect } from 'react';

// ─── Inner component that has access to the modal hook ────────────────────────

interface ApiClientPanelInnerProps {
    sessionProxyUrl: string | null;
    isSessionRunning: boolean;
    isActive: boolean;
    openApiSpecUrl?: string | undefined;
    projectId?: string | undefined;
    onRunBackend: () => void;
    isRunning: boolean;
}

function ApiClientPanelInner({
    sessionProxyUrl,
    isSessionRunning,
    isActive,
    openApiSpecUrl,
    onRunBackend,
    isRunning
}: ApiClientPanelInnerProps) {
    const client = useApiClientModal();

    // Auto-open modal whenever the API tab is active and session is running
    useEffect(() => {
        if (isActive && isSessionRunning && client) {
            client.open(undefined);
        }
    }, [isActive, isSessionRunning, client]);

    if (!isSessionRunning) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="text-center max-w-sm px-6">
                    <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto mb-4">
                        <Zap className="w-6 h-6 text-zinc-400" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 mb-1">API Client ready</p>
                    <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                        Start the backend to auto-discover your API endpoints and send requests through the sandbox proxy.
                    </p>
                    <Button
                        onClick={onRunBackend}
                        disabled={isRunning}
                        size="sm"
                        className="bg-zinc-900 hover:bg-zinc-700 text-white h-9 px-5"
                    >
                        {isRunning ? (
                            <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Starting…</>
                        ) : (
                            <><Play className="w-3.5 h-3.5 mr-2" />Run Backend</>
                        )}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col items-center justify-center bg-white gap-4">
            <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700 mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Session running
                </div>
                {sessionProxyUrl && (
                    <p className="text-xs text-zinc-400 font-mono mb-4 break-all">{sessionProxyUrl}</p>
                )}
            </div>
            <Button
                onClick={() => client?.open(undefined)}
                size="sm"
                className="bg-zinc-900 hover:bg-zinc-700 text-white h-9 px-5"
            >
                <Zap className="w-3.5 h-3.5 mr-2" />
                Open API Client
            </Button>
            {openApiSpecUrl && (
                <p className="text-xs text-zinc-400">OpenAPI spec: <span className="font-mono">{openApiSpecUrl}</span></p>
            )}
        </div>
    );
}

// ─── Public component (includes Provider) ────────────────────────────────────

interface ApiClientProps {
    sessionProxyUrl: string | null;
    isSessionRunning: boolean;
    isActive: boolean;
    projectId?: string | undefined;
    onRunBackend: () => void;
    isRunning: boolean;
}

export function ApiClient({ sessionProxyUrl, isSessionRunning, isActive, projectId, onRunBackend, isRunning }: ApiClientProps) {
    // Build OpenAPI spec URL from the session proxy (FastAPI auto-generates /openapi.json)
    const openApiSpecUrl = sessionProxyUrl ? `${sessionProxyUrl}/openapi.json` : undefined;

    const configuration = {
        ...(openApiSpecUrl ? { spec: { url: openApiSpecUrl } } : {}),
        ...(sessionProxyUrl ? { proxyUrl: sessionProxyUrl } : {}),
    };

    return (
        <div className="h-full scalar-app">
            <ApiClientModalProvider configuration={configuration}>
                <ApiClientPanelInner
                    sessionProxyUrl={sessionProxyUrl}
                    isSessionRunning={isSessionRunning}
                    isActive={isActive}
                    {...(openApiSpecUrl ? { openApiSpecUrl } : {})}
                    {...(projectId ? { projectId } : {})}
                    onRunBackend={onRunBackend}
                    isRunning={isRunning}
                />
            </ApiClientModalProvider>
        </div>
    );
}
