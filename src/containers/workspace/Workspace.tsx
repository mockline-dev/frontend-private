'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { downloadProject } from '@/api/projects/downloadProject';
import { createUpload } from '@/api/uploads/createUpload';
import { ProjectCreationLoader } from '@/components/custom/ProjectCreationLoader';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { defaultAiModel } from '@/config/environment';
import { EditorPanel } from '@/containers/workspace/components/EditorPanel';
import { WorkspaceHeader } from '@/containers/workspace/components/WorkspaceHeader';
import { WorkspaceSidebar } from '@/containers/workspace/components/WorkspaceSidebar';
import { WorkspaceStatusBar } from '@/containers/workspace/components/WorkspaceStatusBar';
import { buildFileTree, getDisplayPath } from '@/containers/workspace/utils/fileTree';
import { useArchitecture } from '@/hooks/useArchitecture';
import { useFiles } from '@/hooks/useFiles';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import { emitProjectLog } from '@/hooks/useProjectLogs';
import { useProjects } from '@/hooks/useProjects';
import { useProjectChannel } from '@/hooks/useRealtimeUpdates';
import { useSnapshots } from '@/hooks/useSnapshots';
import type { Project, ProjectFile } from '@/types/feathers';
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
    const { architecture, loading: architectureLoading, error: architectureError, loadArchitecture } = useArchitecture();

    useProjectChannel(currentProjectId || null);

    useEffect(() => {
        if (currentProjectId && isBrowser) loadProject(currentProjectId);
    }, [currentProjectId, loadProject, isBrowser]);

    useEffect(() => {
        setIsBackendReady(false);
        setActiveView((v) => v === 'api' ? 'code' : v);
    }, [currentProjectId]);

    useEffect(() => {
        if (currentProjectId && isBrowser) loadFiles(currentProjectId);
    }, [currentProjectId, loadFiles, isBrowser]);

    useEffect(() => {
        if (currentProjectId && isBrowser) refreshSnapshots(currentProjectId);
    }, [currentProjectId, refreshSnapshots, isBrowser]);

    useEffect(() => {
        if (currentProjectId && isBrowser) loadArchitecture(currentProjectId);
    }, [currentProjectId, loadArchitecture, isBrowser]);

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
                    name: prompt.length > 50 ? prompt.substring(0, 50) + '...' : prompt,
                    description: prompt,
                    framework: 'fast-api',
                    language: 'python',
                    model: defaultAiModel
                });
            } catch (error) {
                console.error('[Workspace] Failed to create project:', error);
            }
        },
        [createProject, isCreating]
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

    const handleAIAppliedFile = useCallback(
        async (event: { action: 'create' | 'modify' | 'delete'; filename: string; content?: string }) => {
            if (!currentProjectId) return;

            const normalizedSelected = (selectedFile || '').replace(/^\.\//, '').replace(/^\/+/, '');
            const normalizedEvent = event.filename.replace(/^\.\//, '').replace(/^\/+/, '');
            const selectedMatches = normalizedSelected === normalizedEvent || normalizedSelected.endsWith(`/${normalizedEvent}`);

            if (selectedMatches) {
                if (event.action === 'delete') {
                    setSelectedFileContent('');
                } else if (typeof event.content === 'string') {
                    setSelectedFileContent(event.content);
                }
            }

            await loadFiles(currentProjectId);
        },
        [currentProjectId, selectedFile, loadFiles]
    );

    const handleSaveFile = useCallback(async () => {
        if (!currentProjectId || !currentFile) return;
        try {
            await updateFile(currentFile._id, {
                size: new TextEncoder().encode(selectedFileContent).length,
                currentVersion: (currentFile.currentVersion || 1) + 1
            });
            await createUpload({
                key: currentFile.key,
                content: selectedFileContent,
                contentType: 'text/plain',
                projectId: currentProjectId
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

        setIsRunning(true);
        setIsTerminalOpen(true);
        emitProjectLog({ projectId: currentProjectId, type: 'system', message: 'Starting backend run pipeline...', source: 'workspace' });

        try {
            const response = await fetch('/api/run-backend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ projectId: currentProjectId })
            });

            if (!response.ok || !response.body) throw new Error(`Failed to start backend run: ${response.statusText}`);

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.event === 'log') {
                            emitProjectLog({ projectId: currentProjectId, type: data.type, message: data.message, source: data.source || 'runner' });
                        } else if (data.event === 'done') {
                            if (data.result?.data?.success) {
                                setIsBackendReady(true);
                                toast.success('Backend server started successfully!');
                            } else {
                                setIsBackendReady(false);
                                toast.error(data.result?.error || 'Failed to start backend');
                            }
                        } else if (data.event === 'error') {
                            emitProjectLog({ projectId: currentProjectId, type: 'error', message: data.message, source: 'runner' });
                            toast.error(data.message || 'Failed to start backend');
                        }
                    } catch { /* ignore parse errors on partial chunks */ }
                }
            }
        } catch (error) {
            setIsBackendReady(false);
            console.error('Failed to run backend:', error);
            emitProjectLog({ projectId: currentProjectId, type: 'error', message: error instanceof Error ? error.message : 'Failed to run backend', source: 'workspace' });
            toast.error('Failed to start backend');
        } finally {
            setIsRunning(false);
        }
    }, [currentProjectId]);

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

    if (!hasError && (isCreating || (!isCreating && promptFromUrl) || (currentProject && currentProject.status !== 'ready' && currentProject.status !== 'error'))) {
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
                            files={files}
                            selectedFileContent={selectedFileContent}
                            onFileApplied={handleAIAppliedFile}
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
                            architecture={architecture}
                            architectureLoading={architectureLoading}
                            architectureError={architectureError}
                            onContentChange={handleContentChange}
                            onSaveFile={handleSaveFile}
                            onRunBackend={handleRunBackend}
                            onTerminalClose={() => setIsTerminalOpen(false)}
                            onLoadArchitecture={() => currentProjectId && loadArchitecture(currentProjectId)}
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

            <Button
                onClick={() => setIsTerminalOpen((prev) => !prev)}
                className="fixed bottom-4 right-4 h-10 bg-black hover:bg-zinc-800 text-white shadow-lg z-40"
            >
                <TerminalIcon className="w-4 h-4 mr-2" />
                {isTerminalOpen ? 'Hide Terminal' : 'Terminal'}
            </Button>

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
