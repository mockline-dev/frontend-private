'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { downloadProject } from '@/api/projects/downloadProject';
import { runBackend } from '@/api/projects/runBackend';
import { createUpload } from '@/api/uploads/createUpload';
import { FileTree } from '@/components/custom/FileTree';
import { MonacoEditor } from '@/components/custom/MonacoEditor';
import { ProjectCreationLoader } from '@/components/custom/ProjectCreationLoader';
import { UserMenu } from '@/components/custom/UserMenu';
import { Button } from '@/components/ui/button';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { defaultAiModel } from '@/config/environment';
import { AiAgent } from '@/containers/aiAgent/AIAgent';
import { Terminal } from '@/containers/workspace/components/Terminal';
import { TestPanel } from '@/containers/workspace/components/TestPanel';
import { useFiles } from '@/hooks/useFiles';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import { useProjects } from '@/hooks/useProjects';
import { useProjectChannel } from '@/hooks/useRealtimeUpdates';
import { useSnapshots } from '@/hooks/useSnapshots';
import type { Project, ProjectFile } from '@/types/feathers';
import { clearSavedPrompt, getSavedPrompt } from '@/utils/promptStorage';
import { Bot, ChevronRight, Code2, Download, FolderTree, History, Loader2, Play, RotateCcw, Save, Terminal as TerminalIcon, TestTube2, Trash2 } from 'lucide-react';
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
    const [activeView, setActiveView] = useState<'code' | 'api'>('code');
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [isSnapshotCreating, setIsSnapshotCreating] = useState(false);
    const [snapshotActionId, setSnapshotActionId] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

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

    // Use useProjects hook for project operations
    const { currentProject, loadProject } = useProjects(initialProject ? [initialProject] : []);

    // Use useFiles hook for file operations
    const { files, loadFiles, updateFile, currentFile, setCurrentFile } = useFiles(initialFiles);

    // Use useSnapshots hook for snapshot operations
    const { snapshots, loading: snapshotsLoading, createSnapshot, rollbackToSnapshot, deleteSnapshot, refresh: refreshSnapshots } = useSnapshots([]);

    // Join project channel for real-time updates
    useProjectChannel(currentProjectId || null);

    // Load project when projectId changes
    useEffect(() => {
        if (currentProjectId && isBrowser) {
            loadProject(currentProjectId);
        }
    }, [currentProjectId, loadProject, isBrowser]);

    // Load files when projectId changes
    useEffect(() => {
        if (currentProjectId && isBrowser) {
            loadFiles(currentProjectId);
        }
    }, [currentProjectId, loadFiles, isBrowser]);

    // Load snapshots when projectId changes
    useEffect(() => {
        if (currentProjectId && isBrowser) {
            refreshSnapshots(currentProjectId);
        }
    }, [currentProjectId, refreshSnapshots, isBrowser]);

    // Update project name when project changes
    useEffect(() => {
        if (currentProject) {
            setProjectName(currentProject.name);
        }
    }, [currentProject]);

    // Sync selected file with current file from hook
    useEffect(() => {
        if (currentFile) {
            const displayPath = getDisplayPath(currentFile);
            if (selectedFile !== displayPath) {
                setSelectedFile(displayPath);
            }
        }
    }, [currentFile, selectedFile]);

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
                // Error is already handled by useProjectCreation hook
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
                    setSelectedFileContent('// Error loading file content');
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

            // Upload content to R2
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

    // Global keyboard shortcuts
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

            // Decode base64 and create blob
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
     * Runs backend server for current project.
     */
    const handleRunBackend = useCallback(async () => {
        if (!currentProjectId) {
            toast.error('No project selected');
            return;
        }

        setIsRunning(true);
        setIsTerminalOpen(true);

        try {
            const result = await runBackend({ projectId: currentProjectId });

            if (!result.success) {
                throw new Error(result.error);
            }

            const data = result.data;

            if (data.success) {
                toast.success('Backend server started successfully!', {
                    description: data.project?.name ? `Project: ${data.project.name}` : undefined,
                    duration: 5000
                });

                console.log('=== Backend Server Information ===');
                console.log(`Message: ${data.message}`);
                console.log(`Project: ${data.project?.name}`);
                console.log('');
                console.log('Access Points:');
                console.log(`API: ${data.server?.url}`);
                console.log(`Docs: ${data.server?.docsUrl}`);
                console.log(`ReDoc: ${data.server?.redocUrl}`);
                console.log(`OpenAPI: ${data.server?.openapiUrl}`);
            } else {
                toast.error('Failed to start backend');
            }
        } catch (error) {
            console.error('Failed to run backend:', error);
            toast.error('Failed to start backend');
        } finally {
            setIsRunning(false);
        }
    }, [currentProjectId]);

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
        // Reset state and let user try again
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

    // Unified error handling - check both creation state and project status
    const hasError = creationState.status === 'error' || currentProject?.status === 'error';

    // Check if there's a prompt in URL (indicates new project creation in progress)
    const promptFromUrl = searchParams.get('prompt');

    // Show loader when creating or waiting for project to be ready (but not on error)
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

    // Unified error state handling for both creation errors and project status errors
    // Don't show error state if there's a prompt in URL and not creating yet (project creation might still be starting)
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

    // Build file tree from files
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
                        onClick={() => setActiveView('api')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                            activeView === 'api' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <TestTube2 className="w-3.5 h-3.5" />
                        API Testing
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
                                        className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
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
                                    />
                                ) : (
                                    <div className="h-full flex flex-col">
                                        <div className="p-3 border-b border-gray-200">
                                            <Button
                                                onClick={handleCreateSnapshot}
                                                disabled={!currentProjectId || isSnapshotCreating}
                                                size="sm"
                                                className="w-full h-8 text-xs"
                                            >
                                                {isSnapshotCreating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <History className="w-3 h-3 mr-1" />}
                                                Create Snapshot
                                            </Button>
                                        </div>
                                        <div className="flex-1 overflow-y-auto p-3 space-y-2">
                                            {snapshotsLoading ? (
                                                <div className="text-xs text-gray-500">Loading snapshots...</div>
                                            ) : snapshots.length === 0 ? (
                                                <div className="h-full flex items-center justify-center">
                                                    <div className="text-center py-8">
                                                        <History className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                                                        <p className="text-sm text-gray-500">No snapshots yet</p>
                                                        <p className="text-xs text-gray-400 mt-1">Create one before major edits</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                snapshots.map((snapshot) => {
                                                    const isBusy = snapshotActionId === snapshot._id;
                                                    return (
                                                        <div key={snapshot._id} className="border border-gray-200 rounded-lg p-2.5 bg-white">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <p className="text-xs font-medium text-gray-900">
                                                                        v{snapshot.version} · {snapshot.label}
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                                        {snapshot.fileCount} files · {(snapshot.totalSize / 1024).toFixed(1)} KB
                                                                    </p>
                                                                </div>
                                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
                                                                    {snapshot.trigger}
                                                                </span>
                                                            </div>
                                                            <p className="text-[11px] text-gray-400 mt-1.5">{new Date(snapshot.createdAt).toLocaleString()}</p>
                                                            <div className="mt-2 flex items-center gap-1.5">
                                                                <Button
                                                                    onClick={() => handleRollbackSnapshot(snapshot._id)}
                                                                    disabled={isBusy}
                                                                    variant="outline"
                                                                    size="sm"
                                                                    className="h-6 text-[11px]"
                                                                >
                                                                    {isBusy ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RotateCcw className="w-3 h-3 mr-1" />}
                                                                    Restore
                                                                </Button>
                                                                <Button
                                                                    onClick={() => handleDeleteSnapshot(snapshot._id)}
                                                                    disabled={isBusy}
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-6 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                >
                                                                    <Trash2 className="w-3 h-3 mr-1" />
                                                                    Delete
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
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
                                            <div className="border-b border-gray-200 px-4 py-2.5 bg-white flex items-center justify-between">
                                                <div className="inline-flex items-center gap-2 text-sm text-gray-600">
                                                    <Code2 className="w-4 h-4" />
                                                    <span>{selectedFile || 'No file selected'}</span>
                                                </div>
                                                <Button
                                                    onClick={handleSaveFile}
                                                    disabled={!selectedFile || !selectedFileContent}
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    variant="outline"
                                                >
                                                    <Save className="w-3 h-3 mr-1" />
                                                    Save
                                                </Button>
                                                <Button
                                                    onClick={handleRunBackend}
                                                    disabled={!currentProjectId || isRunning}
                                                    size="sm"
                                                    className="h-7 text-xs bg-green-600 hover:bg-green-700"
                                                >
                                                    {isRunning ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                                                    {isRunning ? 'Starting...' : 'Run Backend'}
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
                                    ) : (
                                        <TestPanel projectId={currentProjectId as string} />
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
        </div>
    );
}

// Helper function to build file tree
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

    // Prefer storage key because it preserves nested structure.
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
