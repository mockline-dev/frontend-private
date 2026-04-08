'use client';

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
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

    const { groups, loading } = useOpenApiSpec(isSessionRunning ? specUrl : undefined);

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

    const { response, status, error, sendRequest, cancelRequest } = useApiRequest();

    if (!isSessionRunning) {
        return <EmptyState onRunBackend={onRunBackend} isRunning={isRunning} />;
    }

    if (loading) {
        return <LoadingState />;
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
                {/* Sidebar */}
                <ResizablePanel defaultSize={22} minSize={15} maxSize={35}>
                    <EndpointSidebar
                        groups={groups}
                        selectedEndpointId={selectedEndpoint?.id ?? null}
                        onSelect={(ep) => selectEndpoint(ep, baseUrl)}
                    />
                </ResizablePanel>

                <ResizableHandle className="w-1 bg-zinc-200 hover:bg-blue-400 transition-colors cursor-col-resize" />

                {/* Main panel */}
                <ResizablePanel defaultSize={78}>
                    <ResizablePanelGroup direction="vertical" className="h-full">
                        {/* Request config */}
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

                        {/* Response */}
                        <ResizablePanel defaultSize={55} minSize={25}>
                            <ResponsePanel response={response} status={status} error={error} />
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    );
}
