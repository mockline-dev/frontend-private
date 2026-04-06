'use client';

import { CreateProjectData, FilesPersistedEvent, GenerationProgress, IndexingCompletedEvent, OrchestrationCompletedEvent, OrchestrationContextEvent, OrchestrationEnhancedEvent, OrchestrationErrorEvent, OrchestrationIntentEvent, OrchestrationStartedEvent, OrchestrationTokenEvent, Project, SandboxResultEvent } from '@/types/feathers';
import { useCallback, useState } from 'react';
import { useProjects } from './useProjects';
import { useProjectChannel, useRealtimeUpdates, useSocketEvent } from './useRealtimeUpdates';

/**
 * Simplified state for project creation process.
 */
export type ProjectCreationStatus = 'idle' | 'creating' | 'generating' | 'validating' | 'ready' | 'running' | 'error';

export interface ProjectCreationState {
    status: ProjectCreationStatus;
    project: Project | null;
    progress: GenerationProgress | null;
    error: string | null;
    streamingTokens: string;
    sandboxResult: SandboxResultEvent | null;
    filesPersistedCount: number;
}

/**
 * Return type for the simplified useProjectCreation hook.
 */
export interface UseProjectCreationReturn {
    /** Current state of the project creation process */
    state: ProjectCreationState;
    /** Creates a new project with the provided data */
    createProject: (data: CreateProjectData) => Promise<void>;
    /** Resets the state to idle */
    resetState: () => void;
    /** Whether a creation operation is in progress */
    isCreating: boolean;
}

export function useProjectCreation(options?: { onSuccess?: (project: Project) => void; onError?: (error: string) => void }): UseProjectCreationReturn {
    const { createProject: createProjectService, error: projectError } = useProjects();

    const [status, setStatus] = useState<ProjectCreationStatus>('idle');
    const [progress, setProgress] = useState<GenerationProgress | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [streamingTokens, setStreamingTokens] = useState('');
    const [sandboxResult, setSandboxResult] = useState<SandboxResultEvent | null>(null);
    const [filesPersistedCount, setFilesPersistedCount] = useState(0);

    const createProject = useCallback(
        async (data: CreateProjectData) => {
            if (typeof window === 'undefined') {
                const error = 'Cannot create project on the server';
                setLocalError(error);
                setStatus('error');
                options?.onError?.(error);
                return;
            }

            if (status === 'creating' || status === 'generating') {
                console.warn('[useProjectCreation] Cannot create project: operation already in progress');
                return;
            }

            setStatus('creating');
            setProgress(null);
            setLocalError(null);
            setStreamingTokens('');
            setSandboxResult(null);
            setFilesPersistedCount(0);

            try {
                const newProject = await createProjectService(data);
                setProject(newProject);

                if (newProject.status === 'ready') {
                    setStatus('ready');
                    options?.onSuccess?.(newProject);
                    return;
                }

                if (newProject.status === 'error') {
                    const message = newProject.errorMessage || 'Project generation failed';
                    setLocalError(message);
                    setStatus('error');
                    options?.onError?.(message);
                    return;
                }

                setStatus('generating');
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
                setLocalError(errorMessage);
                setStatus('error');
                options?.onError?.(errorMessage);
            }
        },
        [status, createProjectService, options]
    );

    const resetState = useCallback(() => {
        setStatus('idle');
        setProject(null);
        setProgress(null);
        setLocalError(null);
        setStreamingTokens('');
        setSandboxResult(null);
        setFilesPersistedCount(0);
    }, []);

    // Feathers real-time: project patched
    useRealtimeUpdates<Project>(
        'projects',
        'patched',
        (updatedProject) => {
            if (updatedProject._id === project?._id) {
                setProject(updatedProject);

                if (updatedProject.generationProgress) {
                    setProgress(updatedProject.generationProgress);
                }

                if (updatedProject.status === 'ready') {
                    setStatus('ready');
                    options?.onSuccess?.(updatedProject);
                } else if (updatedProject.status === 'running') {
                    setStatus('running');
                } else if (updatedProject.status === 'validating') {
                    setStatus('validating');
                } else if (updatedProject.status === 'error') {
                    setStatus('error');
                    setLocalError(updatedProject.errorMessage || 'Project generation failed');
                    options?.onError?.(updatedProject.errorMessage || 'Project generation failed');
                }
            }
        },
        (data) => data._id === project?._id
    );

    // Feathers real-time: legacy progress event
    useRealtimeUpdates<{ projectId: string; status: Project['status']; progress: GenerationProgress }>(
        'projects',
        'progress',
        (event) => {
            if (event.projectId !== project?._id) return;

            setProgress(event.progress);

            if (event.status === 'error') {
                const message = event.progress.errorMessage || 'Project generation failed';
                setLocalError(message);
                setStatus('error');
                options?.onError?.(message);
                return;
            }

            if (event.status === 'ready') {
                setStatus('ready');
                return;
            }

            setStatus('generating');
        },
        (event) => event.projectId === project?._id
    );

    // Orchestration pipeline events
    useSocketEvent<OrchestrationStartedEvent>('orchestration:started', (event) => {
        if (event.projectId !== project?._id) return;
        setStatus('generating');
        setStreamingTokens('');
    });

    useSocketEvent<OrchestrationIntentEvent>('orchestration:intent', () => {
        // Intent classified — update progress stage label if available
        setProgress((prev) => (prev ? { ...prev, currentStage: 'Analyzing intent' } : null));
    });

    useSocketEvent<OrchestrationEnhancedEvent>('orchestration:enhanced', () => {
        setProgress((prev) => (prev ? { ...prev, currentStage: 'Enhancing prompt' } : null));
    });

    useSocketEvent<OrchestrationContextEvent>('orchestration:context', () => {
        setProgress((prev) => (prev ? { ...prev, currentStage: 'Retrieving context' } : null));
    });

    useSocketEvent<OrchestrationTokenEvent>('orchestration:token', (event) => {
        setStreamingTokens((prev) => prev + event.token);
    });

    useSocketEvent<OrchestrationCompletedEvent>('orchestration:completed', () => {
        setProgress((prev) => (prev ? { ...prev, currentStage: 'Generation complete', percentage: 80 } : null));
    });

    useSocketEvent<OrchestrationErrorEvent>('orchestration:error', (event) => {
        setLocalError(event.error);
        setStatus('error');
        options?.onError?.(event.error);
    });

    // Sandbox events
    useSocketEvent<SandboxResultEvent>('sandbox:result', (event) => {
        setSandboxResult(event);
        if (!event.success) {
            setProgress((prev) => (prev ? { ...prev, currentStage: 'Validation failed' } : null));
        } else {
            setProgress((prev) => (prev ? { ...prev, currentStage: 'Validated', percentage: 95 } : null));
        }
    });

    // Files persisted event
    useSocketEvent<FilesPersistedEvent>('files:persisted', (event) => {
        setFilesPersistedCount(event.uploadedCount);
        setProgress((prev) => (prev ? { ...prev, currentStage: 'Files saved', filesGenerated: event.uploadedCount, percentage: 100 } : null));
    });

    // Indexing events
    useSocketEvent<IndexingCompletedEvent>('indexing:completed', (event) => {
        if (event.projectId !== project?._id) return;
        console.log('[useProjectCreation] Indexing completed:', event);
    });

    useSocketEvent<{ projectId: string; error: string }>('indexing:error', (event) => {
        if (event.projectId !== project?._id) return;
        console.warn('[useProjectCreation] Indexing error:', event.error);
    });

    useProjectChannel(project?._id || null);

    const isCreating = status === 'creating' || status === 'generating' || status === 'validating';

    return {
        state: {
            status,
            project,
            progress,
            error: localError || projectError,
            streamingTokens,
            sandboxResult,
            filesPersistedCount
        },
        createProject,
        resetState,
        isCreating
    };
}


export interface ProjectCreationState {
    status: ProjectCreationStatus;
    project: Project | null;
    progress: GenerationProgress | null;
    error: string | null;
}

/**
 * Return type for the simplified useProjectCreation hook.
 */
export interface UseProjectCreationReturn {
    /** Current state of the project creation process */
    state: ProjectCreationState;
    /** Creates a new project with the provided data */
    createProject: (data: CreateProjectData) => Promise<void>;
    /** Resets the state to idle */
    resetState: () => void;
    /** Whether a creation operation is in progress */
    isCreating: boolean;
}
