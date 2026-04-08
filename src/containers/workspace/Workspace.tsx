'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { downloadProject } from '@/api/projects/downloadProject';
import { createUpload } from '@/api/uploads/createUpload';
import { patchUpload } from '@/api/uploads/patchUpload';
import { updateUpload } from '@/api/uploads/updateUpload';
import { ProjectCreationLoader } from '@/components/custom/ProjectCreationLoader';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { EditorPanel } from '@/containers/workspace/components/EditorPanel';
import { WorkspaceHeader } from '@/containers/workspace/components/WorkspaceHeader';
import { WorkspaceSidebar } from '@/containers/workspace/components/WorkspaceSidebar';
import { WorkspaceStatusBar } from '@/containers/workspace/components/WorkspaceStatusBar';
import { buildFileTree, getDisplayPath } from '@/containers/workspace/utils/fileTree';
import { useFiles } from '@/hooks/useFiles';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import { useProjects } from '@/hooks/useProjects';
import { useProjectChannel, useSocketEvent } from '@/hooks/useRealtimeUpdates';
import { useSessions } from '@/hooks/useSessions';
import { useSnapshots } from '@/hooks/useSnapshots';
import type { Project, ProjectFile, SandboxResultEvent } from '@/types/feathers';
import type { ActiveView, CursorPosition, SidebarView } from '@/types/workspace';
import { QuickOpen } from '@/components/custom/QuickOpen';
import { useOpenTabs } from '@/hooks/useOpenTabs';
import { flattenFileTree } from '@/containers/workspace/utils/fileTree';
import { clearSavedPrompt, getSavedPrompt } from '@/utils/promptStorage';
import { Terminal as TerminalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { UserData } from '../auth/types';

interface WorkspaceProps {
    currentUser: UserData;
    initialProjectId: string | undefined;
    initialProject?: Project | null;
    initialFiles?: ProjectFile[];
}

export function Workspace({ currentUser, initialProjectId, initialProject = null, initialFiles = [] }: WorkspaceProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const isBrowser = typeof window !== 'undefined';

    const [projectName, setProjectName] = useState('New Project');
    const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(initialProjectId || initialProject?._id);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [selectedFileContent, setSelectedFileContent] = useState<string>('');
    const [sidebarView, setSidebarView] = useState<SidebarView>('files');
    const [activeView, setActiveView] = useState<ActiveView>('code');
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isBackendReady, setIsBackendReady] = useState(false);
    const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
    const [isSnapshotCreating, setIsSnapshotCreating] = useState(false);
    const [snapshotActionId, setSnapshotActionId] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [cursorPosition, setCursorPosition] = useState<CursorPosition | undefined>(undefined);
    const [quickOpenOpen, setQuickOpenOpen] = useState(false);
    const [recentFiles, setRecentFiles] = useState<string[]>([]);

    const { tabs, activeTabId, openTab, closeTab, setActiveTab, markDirty, markClean, hasUnsavedChanges } = useOpenTabs();

    const creationTriggeredRef = useRef(false);

    const {
        state: creationState,
        createProject,
        resetState,
        isCreating
    } = useProjectCreation({
        onSuccess: (project) => {
            setCurrentProjectId(project._id);
            setProjectName(project.name);
            sessionStorage.setItem('currentProjectId', project._id);
            sessionStorage.setItem('projectInitialized', 'true');
            router.replace(`/workspace?projectId=${project._id}`);
        },
        onError: (error) => {
            toast.error(error);
        }
    });

    const { currentProject, loadProject } = useProjects(initialProject ? [initialProject] : []);
    const { files, loadFiles, updateFile, currentFile, setCurrentFile } = useFiles(initialFiles);
    const { snapshots, loading: snapshotsLoading, createSnapshot, rollbackToSnapshot, deleteSnapshot, refresh: refreshSnapshots } = useSnapshots([]);
    const { currentSession, isSessionRunning, sessionProxyUrl, createSession, stopSession, loadSessions } = useSessions();

    useProjectChannel(currentProjectId || null);

    useEffect(() => {
        if (currentProjectId && isBrowser) loadProject(currentProjectId);
    }, [currentProjectId, loadProject, isBrowser]);

    useEffect(() => {
        setIsBackendReady(false);
        setTerminalOutput([]);
        setActiveView((v) => v === 'api' ? 'code' : v);
    }, [currentProjectId]);

    useEffect(() => {
        if (currentProjectId && isBrowser) loadSessions(currentProjectId);
    }, [currentProjectId, loadSessions, isBrowser]);

    // Sync session running state with isBackendReady
    useEffect(() => {
        setIsBackendReady(isSessionRunning);
        if (isSessionRunning) {
            setIsRunning(false);
            setIsTerminalOpen(true);
            toast.success('Backend session started');
        }
        if (currentSession?.status === 'error') {
            setIsRunning(false);
            toast.error(currentSession.errorMessage || 'Session failed to start');
        }
    }, [isSessionRunning, currentSession?.status, currentSession?.errorMessage]);

    // Listen for sandbox results to display in terminal
    useSocketEvent<SandboxResultEvent>('sandbox:result', (event) => {
        // payload has no projectId — scoped to joined project channel
        const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
        const status = event.success ? '\x1b[92m✔ Sandbox passed\x1b[0m' : '\x1b[91m✖ Sandbox failed\x1b[0m';
        const lines = [
            `\x1b[90m[${ts}]\x1b[0m ${status}${event.durationMs !== undefined ? `  \x1b[90m(${event.durationMs}ms)\x1b[0m` : ''}`,
            ...(event.compilationOutput ? event.compilationOutput.split('\n').map((l) => `  ${l}`) : []),
            ...(event.testOutput ? event.testOutput.split('\n').map((l) => `  ${l}`) : [])
        ];
        setTerminalOutput((prev) => [...prev, ...lines]);
    });

    useEffect(() => {
        if (currentProjectId && isBrowser) loadFiles(currentProjectId);
    }, [currentProjectId, loadFiles, isBrowser]);

    useEffect(() => {
        if (currentProjectId && isBrowser) refreshSnapshots(currentProjectId);
    }, [currentProjectId, refreshSnapshots, isBrowser]);

    useEffect(() => {
        if (currentProject) setProjectName(currentProject.name);
    }, [currentProject]);

    useEffect(() => {
        if (currentFile) {
            const displayPath = getDisplayPath(currentFile);
            if (selectedFile !== displayPath) setSelectedFile(displayPath);
        }
    }, [currentFile, selectedFile]);

    const handleCreateProject = useCallback(
        async (prompt: string) => {
            if (isCreating) return;
            try {
                await createProject({
                    userId: currentUser.feathersId,
                    name: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
                    description: prompt,
                    framework: 'fast-api',
                    language: 'python',
                    status: 'initializing'
                });
            } catch (error) {
                console.error('[Workspace] Failed to create project:', error);
            }
        },
        [createProject, isCreating, currentUser.feathersId]
    );

    useEffect(() => {
        if (!isBrowser) return;

        const promptFromUrl = searchParams.get('prompt');
        const existingProjectId = searchParams.get('projectId');
        const savedPromptFromStorage = getSavedPrompt();
        const prompt = promptFromUrl || savedPromptFromStorage;

        const projectInitialized = sessionStorage.getItem('projectInitialized');
        const storedProjectId = sessionStorage.getItem('currentProjectId');

        if (existingProjectId && existingProjectId !== currentProjectId) {
            setCurrentProjectId(existingProjectId);
            sessionStorage.setItem('currentProjectId', existingProjectId);
            sessionStorage.setItem('projectInitialized', 'true');
        } else if (storedProjectId && !currentProjectId) {
            setCurrentProjectId(storedProjectId);
            if (promptFromUrl) router.replace('/workspace');
        } else if (prompt && !currentProjectId && !isCreating && !existingProjectId && !projectInitialized && !creationTriggeredRef.current) {
            console.log('[Workspace useEffect] Creating project, setting creationTriggeredRef to true');
            creationTriggeredRef.current = true;
            handleCreateProject(prompt);
            clearSavedPrompt();
        } else if (currentProjectId) {
            sessionStorage.setItem('projectInitialized', 'true');
        }
    }, [searchParams, currentProjectId, isCreating, handleCreateProject, router, isBrowser]);

    const handleNavigate = (page: 'dashboard' | 'workspace' | 'initial') => {
        if (page === 'initial') router.push('/');
        else router.push(page === 'dashboard' ? '/dashboard' : '/workspace');
    };

    const handleFileSelect = useCallback(
        async (filePath: string) => {
            setSelectedFile(filePath);
            const fileName = filePath.split('/').pop() ?? filePath;
            openTab({ id: filePath, filePath, fileName });
            setRecentFiles((prev) => [filePath, ...prev.filter((p) => p !== filePath)].slice(0, 5));

            const file = files.find((f) => getDisplayPath(f) === filePath || f.name === filePath);
            if (file) {
                setCurrentFile(file);
                setLoadingContent(true);
                try {
                    const result = await fetchFileContent({ fileId: file._id });
                    if (!result.success) throw new Error(result.error);
                    setSelectedFileContent(result.content);
                } catch (error) {
                    console.error('Failed to load file content:', error);
                    toast.error('Failed to load file content');
                } finally {
                    setLoadingContent(false);
                }
            }
        },
        [files, setCurrentFile, openTab]
    );

    const handleContentChange = useCallback((value: string | undefined) => {
        setSelectedFileContent(value || '');
        if (selectedFile) markDirty(selectedFile);
    }, [selectedFile, markDirty]);

    const handleFilesChanged = useCallback(async () => {
        if (!currentProjectId) return;
        await loadFiles(currentProjectId);
    }, [currentProjectId, loadFiles]);

    const handleSaveFile = useCallback(async () => {
        if (!currentProjectId || !currentFile) return;
        try {
            // Step 1: Initiate multipart upload
            const initiated = await createUpload({ key: currentFile.key, contentType: 'text/plain' });
            // Step 2: Upload single part (base64 encoded content)
            const contentBytes = new TextEncoder().encode(selectedFileContent);
            const base64 = btoa(String.fromCharCode(...contentBytes));
            const { ETag } = await patchUpload('upload', {
                key: currentFile.key,
                uploadId: initiated.uploadId,
                partNumber: 1,
                content: base64 as unknown as Buffer,
            });
            // Step 3: Complete multipart upload
            await updateUpload('upload', {
                key: currentFile.key,
                uploadId: initiated.uploadId,
                parts: [{ ETag, PartNumber: 1 }],
            });
            await updateFile(currentFile._id, {
                size: contentBytes.length,
                currentVersion: (currentFile.currentVersion || 1) + 1,
            });
            toast.success(`Saved: ${currentFile.name}`);
            if (selectedFile) markClean(selectedFile);
        } catch (error) {
            console.error('Failed to save file:', error);
            toast.error('Failed to save file');
        }
    }, [currentProjectId, currentFile, selectedFileContent, updateFile, selectedFile, markClean]);

    const handleCreateSnapshot = useCallback(async () => {
        if (!currentProjectId) return;
        setIsSnapshotCreating(true);
        try {
            await createSnapshot({
                projectId: currentProjectId,
                label: `Manual snapshot ${new Date().toLocaleString()}`,
                trigger: 'manual'
            });
            toast.success('Snapshot created');
            await refreshSnapshots(currentProjectId);
        } catch (error) {
            console.error('Failed to create snapshot:', error);
            toast.error('Failed to create snapshot');
        } finally {
            setIsSnapshotCreating(false);
        }
    }, [createSnapshot, currentProjectId, refreshSnapshots]);

    const handleRollbackSnapshot = useCallback(
        async (snapshotId: string) => {
            if (!currentProjectId) return;
            setSnapshotActionId(snapshotId);
            try {
                await rollbackToSnapshot(snapshotId);
                toast.success('Rollback completed');
                await Promise.all([loadFiles(currentProjectId), refreshSnapshots(currentProjectId)]);
            } catch (error) {
                console.error('Failed to rollback snapshot:', error);
                toast.error('Failed to rollback snapshot');
            } finally {
                setSnapshotActionId(null);
            }
        },
        [currentProjectId, loadFiles, refreshSnapshots, rollbackToSnapshot]
    );

    const handleDeleteSnapshot = useCallback(
        async (snapshotId: string) => {
            if (!currentProjectId) return;
            setSnapshotActionId(snapshotId);
            try {
                await deleteSnapshot(snapshotId);
                toast.success('Snapshot deleted');
                await refreshSnapshots(currentProjectId);
            } catch (error) {
                console.error('Failed to delete snapshot:', error);
                toast.error('Failed to delete snapshot');
            } finally {
                setSnapshotActionId(null);
            }
        },
        [currentProjectId, deleteSnapshot, refreshSnapshots]
    );

    const handleTabSelect = useCallback((tabId: string) => {
        setActiveTab(tabId);
        handleFileSelect(tabId);
    }, [setActiveTab, handleFileSelect]);

    const handleTabClose = useCallback((tabId: string) => {
        const nextId = closeTab(tabId);
        if (nextId) {
            handleFileSelect(nextId);
        } else {
            setSelectedFile(null);
            setSelectedFileContent('');
        }
    }, [closeTab, handleFileSelect]);

    useEffect(() => {
        if (!isBrowser) return;
        const handler = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;
            if (isMeta && e.key === 's') { e.preventDefault(); handleSaveFile(); }
            if (isMeta && e.key === 'b') { e.preventDefault(); setSidebarView((prev) => (prev === 'files' ? 'ai' : 'files')); }
            if (isMeta && e.key === 'j') { e.preventDefault(); setIsTerminalOpen((prev) => !prev); }
            if (isMeta && e.shiftKey && e.key === 'M') { e.preventDefault(); setSidebarView('ai'); }
            if (isMeta && e.key === 'w') { e.preventDefault(); if (activeTabId) handleTabClose(activeTabId); }
            if (isMeta && e.key === 'p') { e.preventDefault(); setQuickOpenOpen(true); }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSaveFile, isBrowser, activeTabId, handleTabClose]);

    const handleDownload = useCallback(async () => {
        if (!currentProjectId) { toast.error('No project selected'); return; }
        try {
            const result = await downloadProject({ projectId: currentProjectId });
            if (!result.success) throw new Error(result.error);

            const zipData = atob(result.data.zipBase64);
            const zipArray = new Uint8Array(zipData.length);
            for (let i = 0; i < zipData.length; i++) zipArray[i] = zipData.charCodeAt(i);
            const blob = new Blob([zipArray], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.data.filename;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to download project');
        }
    }, [currentProjectId]);

    const handleRunBackend = useCallback(async () => {
        if (!currentProjectId) { toast.error('No project selected'); return; }
        if (isRunning) return;

        setIsRunning(true);
        setIsTerminalOpen(true);

        try {
            if (currentSession?.status === 'running') {
                // Stop existing session first
                await stopSession(currentSession._id);
            }

            const session = await createSession({
                projectId: currentProjectId,
                userId: currentUser.feathersId,
                language: 'python'
            });
            void session; // status transitions written by Terminal component via sessionStatus prop
        } catch (error) {
            console.error('[Workspace] Failed to start session:', error);
            toast.error('Failed to start backend session');
            setIsRunning(false);
        }
    }, [currentProjectId, isRunning, currentSession, createSession, stopSession, currentUser.feathersId]);

    const handleStopBackend = useCallback(async () => {
        if (!currentSession) return;
        try {
            await stopSession(currentSession._id);
            setIsBackendReady(false);
            toast.success('Session stopped');
        } catch {
            toast.error('Failed to stop session');
        }
    }, [currentSession, stopSession]);

    const handleBackToDashboard = useCallback(() => { resetState(); router.push('/dashboard'); }, [resetState, router]);
    const handleRetry = useCallback(() => { resetState(); }, [resetState]);

    useEffect(() => {
        if (!isBrowser) return;
        return () => {
            const currentPath = window.location.pathname;
            if (!currentPath.includes('/workspace')) {
                sessionStorage.removeItem('currentProjectId');
                sessionStorage.removeItem('projectInitialized');
            }
        };
    }, [isBrowser]);

    const updatingFiles = useMemo(() => new Set<string>(), []);

    const hasError = creationState.status === 'error' || currentProject?.status === 'error';
    const promptFromUrl = searchParams.get('prompt');
    const isWorkspaceLoading = !!currentProjectId && !currentProject && !isCreating;

    if (!hasError && (isCreating || (!isCreating && promptFromUrl))) {
        return (
            <ProjectCreationLoader
                status={creationState.status}
                project={creationState.project}
                progress={creationState.progress}
                error={creationState.error}
                onBackToDashboard={handleBackToDashboard}
                {...(creationState.status === 'error' ? { onRetry: handleRetry } : {})}
            />
        );
    }

    if (hasError && !(promptFromUrl && !isCreating)) {
        return (
            <ProjectCreationLoader
                status={creationState.status}
                project={creationState.project}
                progress={creationState.progress}
                error={creationState.error || currentProject?.errorMessage || 'Project generation failed'}
                onBackToDashboard={handleBackToDashboard}
                onRetry={handleRetry}
            />
        );
    }

    if (isWorkspaceLoading) {
        return (
            <div className="h-screen flex flex-col bg-background">
                <WorkspaceHeader
                    currentUser={currentUser}
                    projectName={projectName}
                    selectedFile={selectedFile}
                    activeView={activeView}
                    isBackendReady={isBackendReady}
                    currentProjectId={currentProjectId}
                    filesCount={0}
                    hasUnsavedChanges={false}
                    onViewChange={setActiveView}
                    onDownload={handleDownload}
                    onNavigate={handleNavigate}
                />
                <div className="flex-1 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                        <div className="w-6 h-6 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                        <span className="text-sm">Loading workspace…</span>
                    </div>
                </div>
            </div>
        );
    }

    const fileTree = files.length > 0 ? buildFileTree(files) : [];
    const flatFiles = flattenFileTree(fileTree);

    // Detect language for status bar
    const activeFileName = selectedFile?.split('/').pop() ?? '';
    const statusLanguage = activeFileName ? getLanguageFromFileName(activeFileName) : undefined;

    return (
        <div className="h-screen flex flex-col bg-white">
            <WorkspaceHeader
                currentUser={currentUser}
                projectName={projectName}
                selectedFile={selectedFile}
                activeView={activeView}
                isBackendReady={isBackendReady}
                currentProjectId={currentProjectId}
                filesCount={files.length}
                hasUnsavedChanges={hasUnsavedChanges}
                onViewChange={setActiveView}
                onDownload={handleDownload}
                onNavigate={handleNavigate}
            />

            <div className="flex-1 flex overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="flex-1">
                    <ResizablePanel defaultSize={25} minSize={15}>
                        <WorkspaceSidebar
                            sidebarView={sidebarView}
                            onSidebarViewChange={setSidebarView}
                            fileTree={fileTree}
                            selectedFile={selectedFile}
                            onFileSelect={handleFileSelect}
                            updatingFiles={updatingFiles}
                            currentProjectId={currentProjectId}
                            onFilesChanged={handleFilesChanged}
                            snapshots={snapshots}
                            snapshotsLoading={snapshotsLoading}
                            isSnapshotCreating={isSnapshotCreating}
                            snapshotActionId={snapshotActionId}
                            onCreateSnapshot={handleCreateSnapshot}
                            onRollbackSnapshot={handleRollbackSnapshot}
                            onDeleteSnapshot={handleDeleteSnapshot}
                        />
                    </ResizablePanel>
                    <ResizableHandle className="w-1 bg-zinc-200 hover:bg-blue-400 transition-colors cursor-col-resize" />
                    <ResizablePanel defaultSize={75} minSize={40}>
                        <EditorPanel
                            activeView={activeView}
                            selectedFile={selectedFile}
                            selectedFileContent={selectedFileContent}
                            loadingContent={loadingContent}
                            isTerminalOpen={isTerminalOpen}
                            isRunning={isRunning}
                            isBackendReady={isBackendReady}
                            currentProjectId={currentProjectId}
                            sessionStatus={currentSession?.status ?? null}
                            sessionProxyUrl={sessionProxyUrl}
                            terminalOutput={terminalOutput}
                            onContentChange={handleContentChange}
                            onSaveFile={handleSaveFile}
                            onRunBackend={handleRunBackend}
                            onStopBackend={handleStopBackend}
                            onTerminalClose={() => setIsTerminalOpen(false)}
                            onCursorPositionChange={setCursorPosition}
                            onOpenQuickOpen={() => setQuickOpenOpen(true)}
                            tabs={tabs}
                            activeTabId={activeTabId}
                            onSelectTab={handleTabSelect}
                            onCloseTab={handleTabClose}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {activeView === 'code' && (
                <Button
                    onClick={() => setIsTerminalOpen((prev) => !prev)}
                    className="fixed bottom-4 right-4 h-10 bg-black hover:bg-zinc-800 text-white shadow-lg z-40"
                >
                    <TerminalIcon className="w-4 h-4 mr-2" />
                    {isTerminalOpen ? 'Hide Terminal' : 'Terminal'}
                </Button>
            )}

            <QuickOpen
                open={quickOpenOpen}
                onOpenChange={setQuickOpenOpen}
                files={flatFiles}
                recentFiles={recentFiles}
                onSelect={handleFileSelect}
            />

            <WorkspaceStatusBar
                currentProject={currentProject}
                filesCount={files.length}
                selectedFile={selectedFile}
                {...(cursorPosition ? { cursorPosition } : {})}
                {...(statusLanguage ? { language: statusLanguage } : {})}
            />
        </div>
    );
}

function getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const map: Record<string, string> = {
        ts: 'TypeScript', tsx: 'TypeScript', js: 'JavaScript', jsx: 'JavaScript',
        py: 'Python', json: 'JSON', css: 'CSS', scss: 'SCSS', html: 'HTML',
        md: 'Markdown', yaml: 'YAML', yml: 'YAML', sh: 'Shell', go: 'Go',
        rs: 'Rust', java: 'Java', sql: 'SQL'
    };
    return map[ext] || ext.toUpperCase() || 'Plain Text';
}
