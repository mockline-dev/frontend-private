'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { EmptyState } from './components/EmptyState';
import { EndpointSidebar } from './components/EndpointSidebar';
import { LoadingState } from './components/LoadingState';
import { RequestConfigTabs } from './components/RequestConfigTabs';
import { ResponsePanel } from './components/ResponsePanel';
import { UrlBar } from './components/UrlBar';
import { useApiRequest } from './hooks/useApiRequest';
import { useOpenApiSpec } from './hooks/useOpenApiSpec';
import { useRequestCollection } from './hooks/useRequestCollection';
import type { ApiTesterProps } from './types';

export function ApiTester({ sessionProxyUrl, isSessionRunning, onRunBackend, isRunning }: ApiTesterProps) {
    const specUrl = sessionProxyUrl ? `${sessionProxyUrl}/openapi.json` : undefined;
    const baseUrl = sessionProxyUrl ?? '';

    const { groups, loading, error, refetch } = useOpenApiSpec(isSessionRunning ? specUrl : undefined);

    const {
        selectedEndpoint,
        requestState,
        selectEndpoint,
        updateMethod,
        updateUrl,
        updateParams,
        updateHeaders,
        updateBody,
        updateContentType,
        updateAuth,
    } = useRequestCollection(groups, baseUrl);

    const { response, status, error: requestError, sendRequest, cancelRequest } = useApiRequest();

    if (!isSessionRunning) {
        return <EmptyState onRunBackend={onRunBackend} isRunning={isRunning} />;
    }

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-white">
                <div className="text-center max-w-sm px-6">
                    <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-3">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                    </div>
                    <p className="text-sm font-semibold text-zinc-900 mb-1">Could not load API spec</p>
                    <p className="text-xs text-zinc-500 mb-4 leading-relaxed">{error}</p>
                    <Button onClick={refetch} size="sm" variant="outline" className="h-8 text-xs">
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden bg-white">
            <UrlBar
                method={requestState.method}
                url={requestState.url}
                status={status}
                onMethodChange={updateMethod}
                onUrlChange={updateUrl}
                onSend={() => void sendRequest(requestState)}
                onCancel={cancelRequest}
            />

            <ResizablePanelGroup direction="horizontal" className="flex-1 overflow-hidden">
                <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
                    <EndpointSidebar
                        groups={groups}
                        selectedEndpointId={selectedEndpoint?.id ?? null}
                        onSelect={(ep) => selectEndpoint(ep, baseUrl)}
                    />
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-zinc-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

                <ResizablePanel defaultSize={78}>
                    <ResizablePanelGroup direction="vertical" className="h-full">
                        <ResizablePanel defaultSize={45} minSize={25}>
                            <RequestConfigTabs
                                params={requestState.params}
                                headers={requestState.headers}
                                body={requestState.body}
                                contentType={requestState.contentType}
                                auth={requestState.auth}
                                onParamsChange={updateParams}
                                onHeadersChange={updateHeaders}
                                onBodyChange={updateBody}
                                onContentTypeChange={updateContentType}
                                onAuthChange={updateAuth}
                            />
                        </ResizablePanel>

                        <ResizableHandle className="h-1 bg-zinc-200 hover:bg-blue-400 transition-colors cursor-row-resize" />

                        <ResizablePanel defaultSize={55} minSize={25}>
                            <ResponsePanel response={response} status={status} error={requestError} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
