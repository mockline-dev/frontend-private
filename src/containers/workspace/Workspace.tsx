'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { downloadProject } from '@/api/projects/downloadProject';
import { createUpload } from '@/api/uploads/createUpload';
import { ArchitectureGraph } from '@/components/custom/ArchitectureGraph';
import { FileTree } from '@/components/custom/FileTree';
import { MonacoEditor } from '@/components/custom/MonacoEditor';
import { ProjectCreationLoader } from '@/components/custom/ProjectCreationLoader';
import { UserMenu } from '@/components/custom/UserMenu';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { defaultAiModel } from '@/config/environment';
import { AiAgent } from '@/containers/aiAgent/AIAgent';
import { ApiClient } from '@/containers/workspace/components/ApiClient';
import { Breadcrumbs } from '@/containers/workspace/components/Breadcrumbs';
import { CommandPalette } from '@/containers/workspace/components/CommandPalette';
import { EditorTabs } from '@/containers/workspace/components/EditorTabs';
import { SnapshotPanel } from '@/containers/workspace/components/SnapshotPanel';
import { Terminal } from '@/containers/workspace/components/Terminal';
import { TestPanel } from '@/containers/workspace/components/TestPanel';
import { useArchitecture } from '@/hooks/useArchitecture';
import { useFiles } from '@/hooks/useFiles';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import { emitProjectLog } from '@/hooks/useProjectLogs';
import { useProjects } from '@/hooks/useProjects';
import { useProjectChannel, useRealtimeUpdates, useSocketEvent } from '@/hooks/useRealtimeUpdates';
import { useSessions } from '@/hooks/useSessions';
import { useSnapshots } from '@/hooks/useSnapshots';
import type { Project, ProjectFile } from '@/types/feathers';
import { clearSavedPrompt, getSavedPrompt } from '@/utils/promptStorage';
import {
    Bot,
    ChevronRight,
    Code2,
    Download,
    FolderTree,
    History,
    Layers,
    Loader2,
    Play,
    RotateCcw,
    Save,
    Terminal as TerminalIcon,
    TestTube2,
    Trash2
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
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
    const [sidebarView, setSidebarView] = useState<'files' | 'ai' | 'versions'>('files');
    const [activeView, setActiveView] = useState<'code' | 'api' | 'architecture'>('code');
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isSnapshotCreating, setIsSnapshotCreating] = useState(false);
    const [snapshotActionId, setSnapshotActionId] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);
    const [openFiles, setOpenFiles] = useState<string[]>([]);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

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
    const { currentSession, isSessionRunning, sessionProxyUrl, createSession, stopSession, loadSessions } = useSessions();

    // Derive backend state from session
    const isBackendReady = isSessionRunning;

    useProjectChannel(currentProjectId || null);

    useEffect(() => {
        if (currentProjectId && isBrowser) {
            loadProject(currentProjectId);
        }
    }, [currentProjectId, loadProject, isBrowser]);

    useEffect(() => {
        // Session state is scoped to the currently loaded project.
        if (activeView === 'api' && !isSessionRunning) {
            setActiveView('code');
        }
    }, [currentProjectId]);

    useEffect(() => {
        if (currentProjectId && isBrowser) {
            loadSessions(currentProjectId);
        }
    }, [currentProjectId, loadSessions, isBrowser]);

    useEffect(() => {
        if (currentProjectId && isBrowser) {
            loadFiles(currentProjectId);
        }
    }, [currentProjectId, loadFiles, isBrowser]);

    useEffect(() => {
        if (currentProjectId && isBrowser) {
            refreshSnapshots(currentProjectId);
        }
    }, [currentProjectId, refreshSnapshots, isBrowser]);

    useEffect(() => {
        if (currentProjectId && isBrowser) {
            loadArchitecture(currentProjectId);
        }
    }, [currentProjectId, loadArchitecture, isBrowser]);

    useEffect(() => {
        if (currentProject) {
            setProjectName(currentProject.name);
        }
    }, [currentProject]);

    useEffect(() => {
        if (currentFile) {
            const displayPath = getDisplayPath(currentFile);
            if (selectedFile !== displayPath) {
                setSelectedFile(displayPath);
            }
        }
    }, [currentFile, selectedFile]);

    // Cmd+P → command palette
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            }
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, []);

    /**
     * Creates a new project with given prompt.
     * Uses useProjectCreation hook for comprehensive error handling.
     */
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

    /**
     * Initializes workspace based on URL params or saved state.
     * Handles project creation from prompt, loading existing project,
     * or navigating to existing project.
     */
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
            if (promptFromUrl) {
                router.replace('/workspace');
            }
        } else if (prompt && !currentProjectId && !isCreating && !existingProjectId && !projectInitialized && !creationTriggeredRef.current) {
            console.log('[Workspace useEffect] Creating project, setting creationTriggeredRef to true');
            creationTriggeredRef.current = true;
            handleCreateProject(prompt);
            clearSavedPrompt();
        } else if (currentProjectId) {
            sessionStorage.setItem('projectInitialized', 'true');
        }
    }, [searchParams, currentProjectId, isCreating, handleCreateProject, router, isBrowser]);

    /**
     * Navigates to specified page.
     */
    const handleNavigate = (page: 'dashboard' | 'workspace' | 'initial') => {
        if (page === 'initial') {
            router.push('/');
        } else {
            router.push(page === 'dashboard' ? '/dashboard' : '/workspace');
        }
    };

    /**
     * Handles file selection from file tree.
     */
    const handleFileSelect = useCallback(
        async (filePath: string) => {
            setSelectedFile(filePath);
            // Add to open tabs if not already there
            setOpenFiles((prev) => (prev.includes(filePath) ? prev : [...prev, filePath]));
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
        [files, setCurrentFile]
    );

    /**
     * Handles editor content changes.
     */
    const handleContentChange = useCallback((value: string | undefined) => {
        setSelectedFileContent(value || '');
    }, []);

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

    /**
     * Saves the current file content.
     */
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
        } catch (error) {
            console.error('Failed to save file:', error);
            toast.error('Failed to save file');
        }
    }, [currentProjectId, currentFile, selectedFileContent, updateFile]);

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

    useEffect(() => {
        if (!isBrowser) return;

        const handler = (e: KeyboardEvent) => {
            const isMeta = e.metaKey || e.ctrlKey;
            if (isMeta && e.key === 's') {
                e.preventDefault();
                handleSaveFile();
            }
            if (isMeta && e.key === 'b') {
                e.preventDefault();
                setSidebarView((prev) => (prev === 'files' ? 'ai' : 'files'));
            }
            if (isMeta && e.key === 'j') {
                e.preventDefault();
                setIsTerminalOpen((prev) => !prev);
            }
            if (isMeta && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                setSidebarView('ai');
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleSaveFile, isBrowser]);

    /**
     * Downloads project as a ZIP file.
     */
    const handleDownload = useCallback(async () => {
        if (!currentProjectId) {
            toast.error('No project selected');
            return;
        }
        try {
            const result = await downloadProject({ projectId: currentProjectId });
            console.log('====================================');
            console.log(result);
            console.log('====================================');

            if (!result.success) {
                throw new Error(result.error);
            }

            const zipData = atob(result.data.zipBase64);
            const zipArray = new Uint8Array(zipData.length);
            for (let i = 0; i < zipData.length; i++) {
                zipArray[i] = zipData.charCodeAt(i);
            }
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

    /**
     * Starts a sandbox container for the current project via the Sessions service.
     * Container status transitions (starting → running) arrive via Socket.IO.
     */
    const handleRunBackend = useCallback(async () => {
        if (!currentProjectId) {
            toast.error('No project selected');
            return;
        }

        if (currentSession?.status === 'running') {
            toast.info('Backend is already running');
            return;
        }

        setIsRunning(true);
        setIsTerminalOpen(true);
        emitProjectLog({
            projectId: currentProjectId,
            type: 'system',
            message: 'Starting backend container...',
            source: 'workspace'
        });

        try {
            await createSession({
                projectId: currentProjectId,
                userId: currentUser.feathersId,
                language: 'python'
            });
            emitProjectLog({
                projectId: currentProjectId,
                type: 'system',
                message: 'Container is starting — waiting for it to become ready...',
                source: 'workspace'
            });
        } catch (error) {
            console.error('Failed to start session:', error);
            emitProjectLog({
                projectId: currentProjectId,
                type: 'error',
                message: error instanceof Error ? error.message : 'Failed to start backend container',
                source: 'workspace'
            });
            toast.error('Failed to start backend');
        } finally {
            setIsRunning(false);
        }
    }, [currentProjectId, currentSession, createSession, currentUser.feathersId]);

    // Bridge sandbox and session events into the terminal log stream
    useSocketEvent<{ success: boolean; syntaxValid?: boolean; compilationOutput?: string; testOutput?: string; durationMs: number }>(
        'sandbox:result',
        (event) => {
            if (!currentProjectId) return;
            const status = event.success ? 'success' : 'error';
            emitProjectLog({ projectId: currentProjectId, type: status, message: `Sandbox result: ${event.success ? 'passed' : 'failed'} (${event.durationMs}ms)`, source: 'sandbox' });
            if (event.compilationOutput) {
                emitProjectLog({ projectId: currentProjectId, type: event.success ? 'info' : 'error', message: event.compilationOutput, source: 'sandbox' });
            }
            if (event.testOutput) {
                emitProjectLog({ projectId: currentProjectId, type: 'info', message: event.testOutput, source: 'sandbox' });
            }
        }
    );

    useSocketEvent<{ attempt: number; error: string }>('sandbox:retry', (event) => {
        if (!currentProjectId) return;
        emitProjectLog({ projectId: currentProjectId, type: 'warning', message: `Sandbox retry attempt ${event.attempt}: ${event.error}`, source: 'sandbox' });
    });

    useRealtimeUpdates<{ _id: string; status: string; proxyUrl?: string; errorMessage?: string }>('sessions', 'patched', (session) => {
        if (!currentProjectId) return;
        if (session.status === 'running') {
            emitProjectLog({ projectId: currentProjectId, type: 'success', message: `Backend container is running${session.proxyUrl ? ` at ${session.proxyUrl}` : ''}`, source: 'session' });
            toast.success('Backend server started successfully!');
        } else if (session.status === 'stopped') {
            emitProjectLog({ projectId: currentProjectId, type: 'system', message: 'Backend container stopped', source: 'session' });
        } else if (session.status === 'error') {
            emitProjectLog({ projectId: currentProjectId, type: 'error', message: `Backend container error: ${session.errorMessage || 'unknown error'}`, source: 'session' });
        }
    });

    /**
     * Handles back to dashboard action.
     */
    const handleBackToDashboard = useCallback(() => {
        resetState();
        router.push('/dashboard');
    }, [resetState, router]);

    /**
     * Handles retry action.
     */
    const handleRetry = useCallback(() => {
        resetState();
    }, [resetState]);

    /**
     * Cleans up session storage when leaving workspace.
     */
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

    const hasError = creationState.status === 'error' || currentProject?.status === 'error';

    const promptFromUrl = searchParams.get('prompt');

    console.log('[Workspace] Loader check:', {
        hasError,
        isCreating,
        creationStateStatus: creationState.status,
        projectStatus: currentProject?.status,
        promptFromUrl: !!promptFromUrl,
        shouldShowLoader:
            !hasError && (isCreating || (!isCreating && promptFromUrl) || (currentProject && currentProject.status !== 'ready' && currentProject.status !== 'error'))
    });

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

    return (
        <div className="h-screen flex flex-col bg-white">
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4 bg-white">
                <nav className="flex items-center gap-1 text-sm">
                    <div className="w-6 h-6 bg-linear-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center mr-1">
                        <Code2 className="w-3.5 h-3.5 text-white" />
                    </div>
                    <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-900 transition-colors">
                        Dashboard
                    </button>
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                    <span className="text-gray-700 font-medium">{projectName.slice(0, 40)}</span>
                    {selectedFile && activeView === 'code' && (
                        <>
                            <ChevronRight className="w-3 h-3 text-gray-400" />
                            <span className="text-gray-900 font-semibold">{selectedFile}</span>
                        </>
                    )}
                </nav>

                <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                        onClick={() => setActiveView('code')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            activeView === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Code2 className="w-3.5 h-3.5" />
                        Code
                    </button>
                    <button
                        onClick={() => {
                            if (!isBackendReady) {
                                toast.info('Run backend first to enable API Testing');
                                return;
                            }
                            setActiveView('api');
                        }}
                        disabled={!isBackendReady}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            activeView === 'api'
                                ? 'bg-white text-gray-900 shadow-sm'
                                : isBackendReady
                                  ? 'text-gray-600 hover:text-gray-900'
                                  : 'text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        <TestTube2 className="w-3.5 h-3.5" />
                        API Testing
                    </button>
                    <button
                        onClick={() => setActiveView('architecture')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            activeView === 'architecture' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <Layers className="w-3.5 h-3.5" />
                        Architecture
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <Button onClick={handleDownload} disabled={!currentProjectId || files.length === 0} size="sm" variant="outline" className="h-7 text-xs">
                        <Download className="w-3 h-3 mr-1" />
                        Download
                    </Button>
                    <UserMenu currentUser={currentUser} currentPage="workspace" onNavigate={handleNavigate} />
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="flex-1">
                    <ResizablePanel defaultSize={25} minSize={15}>
                        <div className="h-full border-r border-gray-200 bg-white flex flex-col">
                            <div className="border-b border-gray-200 flex">
                                {(['files', 'ai', 'versions'] as const).map((view) => (
                                    <button
                                        key={view}
                                        onClick={() => setSidebarView(view)}
                                        className={`flex-1 px-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                                            sidebarView === view ? 'bg-white text-gray-900 border-b-2 border-black' : 'text-gray-500 hover:text-gray-900 bg-gray-50'
                                        }`}
                                    >
                                        {view === 'files' && <FolderTree className="w-3.5 h-3.5" />}
                                        {view === 'ai' && <Bot className="w-3.5 h-3.5" />}
                                        {view === 'versions' && <History className="w-3.5 h-3.5" />}
                                        {view === 'files' ? 'Files' : view === 'ai' ? 'Mocky' : 'Versions'}
                                    </button>
                                ))}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                {sidebarView === 'files' ? (
                                    <div className="h-full overflow-y-auto px-3 py-3">
                                        {fileTree.length > 0 ? (
                                            <FileTree data={fileTree} onFileClick={handleFileSelect} selectedFile={selectedFile || ''} />
                                        ) : (
                                            <div className="text-center py-8">
                                                <p className="text-sm text-gray-500">No files generated yet</p>
                                                <p className="text-xs text-gray-400 mt-1">Use Mocky to generate code</p>
                                            </div>
                                        )}
                                    </div>
                                ) : sidebarView === 'ai' ? (
                                    <AiAgent
                                        projectId={currentProjectId as string}
                                        files={files}
                                        selectedFile={selectedFile || ''}
                                        selectedFileContent={selectedFileContent}
                                        onFileApplied={handleAIAppliedFile}
                                    />
                                ) : (
                                    <SnapshotPanel
                                        snapshots={snapshots}
                                        loading={snapshotsLoading}
                                        onRollback={handleRollbackSnapshot}
                                        onCreateSnapshot={handleCreateSnapshot}
                                    />
                                )}
                            </div>
                        </div>
                    </ResizablePanel>
                    <ResizableHandle className="w-1 bg-gray-200 hover:bg-blue-400 transition-colors cursor-col-resize" />
                    <ResizablePanel defaultSize={75} minSize={40}>
                        <ResizablePanelGroup key={isTerminalOpen ? 'terminal-open' : 'terminal-closed'} direction="vertical" className="h-full">
                            <ResizablePanel defaultSize={isTerminalOpen ? 70 : 100} minSize={isTerminalOpen ? 50 : 30}>
                                <div className="h-full flex flex-col overflow-hidden bg-gray-50">
                                    {activeView === 'code' ? (
                                        <>
                                            {/* Editor tabs */}
                                            <EditorTabs
                                                openFiles={openFiles}
                                                activeFile={selectedFile}
                                                onSelect={handleFileSelect}
                                                onClose={(path) => {
                                                    setOpenFiles((prev) => prev.filter((f) => f !== path));
                                                    if (selectedFile === path) {
                                                        const remaining = openFiles.filter((f) => f !== path);
                                                        if (remaining.length > 0) handleFileSelect(remaining[remaining.length - 1] as string);
                                                        else { setSelectedFile(null); setSelectedFileContent(''); }
                                                    }
                                                }}
                                            />
                                            {/* Breadcrumbs */}
                                            {selectedFile && <Breadcrumbs path={selectedFile} />}
                                            {/* Action bar */}
                                            <div className="border-b border-zinc-800 px-3 py-1.5 bg-zinc-900 flex items-center justify-end gap-2">
                                                <Button
                                                    onClick={handleSaveFile}
                                                    disabled={!selectedFile || !selectedFileContent}
                                                    size="sm"
                                                    className="h-6 text-xs"
                                                    variant="outline"
                                                >
                                                    <Save className="w-3 h-3 mr-1" />
                                                    Save
                                                </Button>
                                                <Button
                                                    onClick={handleRunBackend}
                                                    disabled={!currentProjectId || isRunning}
                                                    size="sm"
                                                    className="h-6 text-xs bg-green-700 hover:bg-green-600 text-white border-0"
                                                >
                                                    {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                                                    {isRunning ? 'Starting...' : isBackendReady ? 'Restart' : 'Run'}
                                                </Button>
                                            </div>
                                            <div className="flex-1 overflow-hidden bg-white">
                                                {loadingContent ? (
                                                    <div className="flex items-center justify-center h-full">
                                                        <div className="text-center">
                                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
                                                            <p className="text-sm text-gray-600">Loading file content...</p>
                                                        </div>
                                                    </div>
                                                ) : selectedFileContent ? (
                                                    <MonacoEditor
                                                        value={selectedFileContent}
                                                        fileName={selectedFile || 'file'}
                                                        onChange={handleContentChange}
                                                        readOnly={false}
                                                        height="100%"
                                                    />
                                                ) : (
                                                    <div className="flex items-center justify-center h-full">
                                                        <div className="text-center">
                                                            <Code2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                                            <p className="text-sm text-gray-500">Select a file to view its content</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : activeView === 'architecture' ? (
                                        <ArchitectureGraph
                                            architecture={architecture}
                                            loading={architectureLoading}
                                            error={architectureError}
                                            onRefresh={
                                                currentProjectId
                                                    ? () => {
                                                          loadArchitecture(currentProjectId);
                                                      }
                                                    : undefined
                                            }
                                        />
                                    ) : (
                                        <ApiClient
                                            {...(currentSession?._id && { sessionId: currentSession._id })}
                                            {...(sessionProxyUrl && { sessionProxyUrl })}
                                            isSessionRunning={isSessionRunning}
                                        />
                                    )}
                                </div>
                            </ResizablePanel>
                            {isTerminalOpen && (
                                <>
                                    <ResizableHandle className="h-1 bg-gray-200 hover:bg-blue-400 transition-colors cursor-row-resize" />
                                    <ResizablePanel minSize={15} defaultSize={30}>
                                        <Terminal variant="panel" isOpen={true} onClose={() => setIsTerminalOpen(false)} projectId={currentProjectId as string} />
                                    </ResizablePanel>
                                </>
                            )}
                        </ResizablePanelGroup>
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            <Button onClick={() => setIsTerminalOpen((prev) => !prev)} className="fixed bottom-4 right-4 h-10 bg-black hover:bg-gray-800 text-white shadow-lg z-40">
                <TerminalIcon className="w-4 h-4 mr-2" />
                {isTerminalOpen ? 'Hide Terminal' : 'Terminal'}
            </Button>

            <div className="h-6 bg-gray-100 border-t border-gray-200 flex items-center justify-between px-3 text-[11px] text-gray-500">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span
                            className={`w-2 h-2 rounded-full ${
                                currentProject?.status === 'ready'
                                    ? 'bg-green-500'
                                    : currentProject?.status === 'generating'
                                      ? 'bg-blue-500 animate-pulse'
                                      : currentProject?.status === 'error'
                                        ? 'bg-red-500'
                                        : 'bg-gray-400'
                            }`}
                        />
                        {currentProject?.status ?? 'no project'}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <span>Model: {defaultAiModel}</span>
                    <span>{files.length} files</span>
                </div>
            </div>

            {/* Command Palette */}
            <CommandPalette
                files={files.map((f) => ({ name: f.name, path: getDisplayPath(f) }))}
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                onSelect={(path) => { handleFileSelect(path); }}
            />
        </div>
    );
}

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    path: string;
    fileId?: string;
    key?: string;
}

function buildFileTree(files: ProjectFile[]): FileNode[] {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();
    const sorted = [...files].sort((a, b) => getDisplayPath(a).localeCompare(getDisplayPath(b)));

    for (const file of sorted) {
        const displayPath = getDisplayPath(file);
        const parts = displayPath.split('/');
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            const isLast = i === parts.length - 1;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!pathMap.has(currentPath)) {
                const node: FileNode = isLast
                    ? { name: part, type: 'file', path: currentPath, fileId: file._id, key: file.key }
                    : { name: part, type: 'folder', path: currentPath, children: [] };

                pathMap.set(currentPath, node);

                if (i === 0) {
                    tree.push(node);
                } else {
                    const parentPath = parts.slice(0, i).join('/');
                    pathMap.get(parentPath)?.children?.push(node);
                }
            }
        }
    }

    sortTreeNodes(tree);

    return tree;
}

function getDisplayPath(file: ProjectFile): string {
    const key = file.key || '';
    const marker = '/';
    const projectsPrefix = 'projects/';

    if (key.startsWith(projectsPrefix)) {
        const firstSlashAfterProjectId = key.indexOf(marker, projectsPrefix.length);
        if (firstSlashAfterProjectId !== -1 && firstSlashAfterProjectId + 1 < key.length) {
            return key.slice(firstSlashAfterProjectId + 1);
        }
    }

    return file.name;
}

function sortTreeNodes(nodes: FileNode[]) {
    nodes.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });

    for (const node of nodes) {
        if (node.children?.length) {
            sortTreeNodes(node.children);
        }
    }
}
