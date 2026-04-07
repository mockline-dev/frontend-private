'use client';

import { EditorTabs } from '@/components/custom/EditorTabs';
import { MonacoEditor } from '@/components/custom/MonacoEditor';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { ApiClient } from '@/containers/workspace/components/ApiClient';
import { Breadcrumbs } from '@/containers/workspace/components/Breadcrumbs';
import { Terminal } from '@/containers/workspace/components/Terminal';
import type { ActiveView, CursorPosition, EditorTab } from '@/types/workspace';
import { EmptyEditor } from '@/components/custom/EmptyEditor';
import { Code2, Loader2, Play, Save, Square } from 'lucide-react';

interface EditorPanelProps {
    activeView: ActiveView;
    selectedFile: string | null;
    selectedFileContent: string;
    loadingContent: boolean;
    isTerminalOpen: boolean;
    isRunning: boolean;
    isBackendReady: boolean;
    currentProjectId: string | undefined;
    sessionStatus?: 'starting' | 'running' | 'stopped' | 'error' | null;
    sessionProxyUrl?: string | null;
    terminalOutput?: string[];
    onContentChange: (value: string | undefined) => void;
    onSaveFile: () => void;
    onRunBackend: () => void;
    onStopBackend?: () => void;
    onTerminalClose: () => void;
    onCursorPositionChange?: ((pos: CursorPosition) => void) | undefined;
    onOpenQuickOpen?: (() => void) | undefined;
    // Tab system
    tabs: EditorTab[];
    activeTabId: string | null;
    onSelectTab: (tabId: string) => void;
    onCloseTab: (tabId: string) => void;
}

export function EditorPanel({
    activeView,
    selectedFile,
    selectedFileContent,
    loadingContent,
    isTerminalOpen,
    isRunning,
    isBackendReady,
    currentProjectId,
    sessionStatus,
    sessionProxyUrl,
    terminalOutput = [],
    onContentChange,
    onSaveFile,
    onRunBackend,
    onStopBackend,
    onTerminalClose,
    onCursorPositionChange,
    onOpenQuickOpen,
    tabs,
    activeTabId,
    onSelectTab,
    onCloseTab,
}: EditorPanelProps) {
    return (
        <ResizablePanelGroup key={isTerminalOpen ? 'terminal-open' : 'terminal-closed'} direction="vertical" className="h-full">
            <ResizablePanel defaultSize={isTerminalOpen ? 70 : 100} minSize={isTerminalOpen ? 50 : 30}>
                <div className="h-full flex flex-col overflow-hidden bg-zinc-50">
                    {activeView === 'code' ? (
                        <>
                            <EditorTabs tabs={tabs} activeTabId={activeTabId} onSelectTab={onSelectTab} onCloseTab={onCloseTab} />
                            <div className="border-b border-zinc-200 px-4 py-2.5 bg-white flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 text-sm text-zinc-600 min-w-0">
                                    <Code2 className="w-4 h-4 shrink-0" />
                                    <Breadcrumbs filePath={selectedFile} />
                                    {!selectedFile && <span className="text-zinc-400">No file selected</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button onClick={onSaveFile} disabled={!selectedFile || !selectedFileContent} size="sm" className="h-7 text-xs" variant="outline">
                                        <Save className="w-3 h-3 mr-1" />
                                        Save
                                    </Button>
                                    {isBackendReady && onStopBackend ? (
                                        <Button onClick={onStopBackend} size="sm" className="h-7 text-xs bg-red-600 hover:bg-red-700">
                                            <Square className="w-3 h-3 mr-1" />
                                            Stop
                                        </Button>
                                    ) : (
                                        <Button onClick={onRunBackend} disabled={!currentProjectId || isRunning} size="sm" className="h-7 text-xs bg-green-600 hover:bg-green-700">
                                            {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                                            {isRunning ? 'Starting...' : 'Run Backend'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden bg-white">
                                {loadingContent ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="text-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900 mx-auto mb-2" />
                                            <p className="text-sm text-zinc-600">Loading file content...</p>
                                        </div>
                                    </div>
                                ) : selectedFileContent ? (
                                    <MonacoEditor
                                        value={selectedFileContent}
                                        fileName={selectedFile || 'file'}
                                        onChange={onContentChange}
                                        readOnly={false}
                                        height="100%"
                                        {...(onCursorPositionChange ? { onCursorPositionChange } : {})}
                                    />
                                ) : (
                                    <EmptyEditor {...(onOpenQuickOpen ? { onOpenQuickOpen } : {})} />
                                )}
                            </div>
                        </>
                    ) : (
                        <ApiClient
                            sessionProxyUrl={sessionProxyUrl ?? null}
                            isSessionRunning={isBackendReady}
                            {...(currentProjectId ? { projectId: currentProjectId } : {})}
                            onRunBackend={onRunBackend}
                            isRunning={isRunning}
                        />
                    )}
                </div>
            </ResizablePanel>
            {isTerminalOpen && (
                <>
                    <ResizableHandle className="h-1 bg-zinc-200 hover:bg-blue-400 transition-colors cursor-row-resize" />
                    <ResizablePanel minSize={15} defaultSize={30}>
                        <Terminal variant="panel" isOpen={true} onClose={onTerminalClose} projectId={currentProjectId} sessionStatus={sessionStatus} sessionOutput={terminalOutput} />
                    </ResizablePanel>
                </>
            )}
        </ResizablePanelGroup>
    );
}
