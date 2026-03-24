'use client';

import { ArchitectureGraph } from '@/components/custom/ArchitectureGraph';
import { EditorTabs } from '@/components/custom/EditorTabs';
import { MonacoEditor } from '@/components/custom/MonacoEditor';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Terminal } from '@/containers/workspace/components/Terminal';
import { TestPanel } from '@/containers/workspace/components/TestPanel';
import type { ActiveView, CursorPosition, EditorTab } from '@/types/workspace';
import type { Architecture } from '@/types/feathers';
import { EmptyEditor } from '@/components/custom/EmptyEditor';
import { Code2, Loader2, Play, Save, TestTube2 } from 'lucide-react';

interface EditorPanelProps {
    activeView: ActiveView;
    selectedFile: string | null;
    selectedFileContent: string;
    loadingContent: boolean;
    isTerminalOpen: boolean;
    isRunning: boolean;
    isBackendReady: boolean;
    currentProjectId: string | undefined;
    architecture: Architecture | null;
    architectureLoading: boolean;
    architectureError: string | null;
    onContentChange: (value: string | undefined) => void;
    onSaveFile: () => void;
    onRunBackend: () => void;
    onTerminalClose: () => void;
    onLoadArchitecture: () => void;
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
    architecture,
    architectureLoading,
    architectureError,
    onContentChange,
    onSaveFile,
    onRunBackend,
    onTerminalClose,
    onLoadArchitecture,
    onCursorPositionChange,
    onOpenQuickOpen,
    tabs,
    activeTabId,
    onSelectTab,
    onCloseTab
}: EditorPanelProps) {
    return (
        <ResizablePanelGroup key={isTerminalOpen ? 'terminal-open' : 'terminal-closed'} direction="vertical" className="h-full">
            <ResizablePanel defaultSize={isTerminalOpen ? 70 : 100} minSize={isTerminalOpen ? 50 : 30}>
                <div className="h-full flex flex-col overflow-hidden bg-zinc-50">
                    {activeView === 'code' ? (
                        <>
                            <EditorTabs
                                tabs={tabs}
                                activeTabId={activeTabId}
                                onSelectTab={onSelectTab}
                                onCloseTab={onCloseTab}
                            />
                            <div className="border-b border-zinc-200 px-4 py-2.5 bg-white flex items-center justify-between">
                                <div className="inline-flex items-center gap-2 text-sm text-zinc-600">
                                    <Code2 className="w-4 h-4" />
                                    <span>{selectedFile || 'No file selected'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        onClick={onSaveFile}
                                        disabled={!selectedFile || !selectedFileContent}
                                        size="sm"
                                        className="h-7 text-xs"
                                        variant="outline"
                                    >
                                        <Save className="w-3 h-3 mr-1" />
                                        Save
                                    </Button>
                                    <Button
                                        onClick={onRunBackend}
                                        disabled={!currentProjectId || isRunning}
                                        size="sm"
                                        className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                    >
                                        {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                                        {isRunning ? 'Starting...' : 'Run Backend'}
                                    </Button>
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
                                    <EmptyEditor
                                        {...(onOpenQuickOpen ? { onOpenQuickOpen } : {})}
                                    />
                                )}
                            </div>
                        </>
                    ) : activeView === 'architecture' ? (
                        <ArchitectureGraph
                            architecture={architecture}
                            loading={architectureLoading}
                            error={architectureError}
                            {...(currentProjectId ? { onRefresh: onLoadArchitecture } : {})}
                        />
                    ) : isBackendReady ? (
                        <TestPanel projectId={currentProjectId as string} />
                    ) : (
                        <div className="h-full flex items-center justify-center bg-white">
                            <div className="text-center max-w-md px-6">
                                <TestTube2 className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                                <p className="text-sm font-medium text-zinc-900">API Testing is disabled</p>
                                <p className="text-xs text-zinc-500 mt-1 mb-4">Start the backend first, then open API Testing.</p>
                                <Button
                                    onClick={onRunBackend}
                                    disabled={!currentProjectId || isRunning}
                                    size="sm"
                                    className="h-8 bg-green-600 hover:bg-green-700"
                                >
                                    {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                                    {isRunning ? 'Starting...' : 'Run Backend'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </ResizablePanel>
            {isTerminalOpen && (
                <>
                    <ResizableHandle className="h-1 bg-zinc-200 hover:bg-blue-400 transition-colors cursor-row-resize" />
                    <ResizablePanel minSize={15} defaultSize={30}>
                        <Terminal variant="panel" isOpen={true} onClose={onTerminalClose} projectId={currentProjectId as string} />
                    </ResizablePanel>
                </>
            )}
        </ResizablePanelGroup>
    );
}
