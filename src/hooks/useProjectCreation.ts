'use client';

import { CreateProjectData, FilesPersistedEvent, GenerationProgress, IndexingCompletedEvent, IndexingErrorEvent, OrchestrationErrorEvent, OrchestrationStartedEvent, Project, SandboxResultEvent } from '@/types/feathers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProjects } from './useProjects';
import { useProjectChannel, useRealtimeUpdates, useSocketEvent } from './useRealtimeUpdates';

export type ProjectCreationStatus = 'idle' | 'creating' | 'generating' | 'ready' | 'error';

export interface ProjectCreationState {
    status: ProjectCreationStatus;
    project: Project | null;
    progress: GenerationProgress | null;
    error: string | null;
    enhancedPrompt: string | null;
    sandboxSuccess: boolean | null;
}

export interface UseProjectCreationReturn {
    state: ProjectCreationState;
    createProject: (data: CreateProjectData) => Promise<Project | undefined>;
    resetState: () => void;
    isCreating: boolean;
}

export function useProjectCreation(options?: { onSuccess?: (project: Project) => void; onError?: (error: string) => void }): UseProjectCreationReturn {
    const { createProject: createProjectService, error: projectError } = useProjects([], { disableRealtimeListeners: true });

    const optionsRef = useRef(options);
    useEffect(() => {
        optionsRef.current = options;
    });

    const [status, setStatus] = useState<ProjectCreationStatus>('idle');
    const [progress, setProgress] = useState<GenerationProgress | null>(null);
    const [localError, setLocalError] = useState<string | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [enhancedPrompt, setEnhancedPrompt] = useState<string | null>(null);
    const [sandboxSuccess, setSandboxSuccess] = useState<boolean | null>(null);

    const statusRef = useRef<ProjectCreationStatus>('idle');
    useEffect(() => { statusRef.current = status; }, [status]);

    const createProject = useCallback(
        async (data: CreateProjectData): Promise<Project | undefined> => {
            if (typeof window === 'undefined') {
                const error = 'Cannot create project on the server';
                setLocalError(error);
                setStatus('error');
                optionsRef.current?.onError?.(error);
                return undefined;
            }

            if (status === 'creating' || status === 'generating') {
                console.warn('[useProjectCreation] Cannot create project: operation already in progress');
                return undefined;
            }

            setStatus('creating');
            setProgress(null);
            setLocalError(null);

            try {
                const newProject = await createProjectService(data);
                setProject(newProject);

                if (newProject.status === 'ready') {
                    setStatus('ready');
                    optionsRef.current?.onSuccess?.(newProject);
                    return newProject;
                }

                if (newProject.status === 'error') {
                    const message = newProject.errorMessage || 'Project generation failed';
                    setLocalError(message);
                    setStatus('error');
                    optionsRef.current?.onError?.(message);
                    return undefined;
                }

                setStatus('generating');
                return newProject;
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
                setLocalError(errorMessage);
                setStatus('error');
                optionsRef.current?.onError?.(errorMessage);
                return undefined;
            }
        },
        [status, createProjectService]
    );

    const resetState = useCallback(() => {
        setStatus('idle');
        setProject(null);
        setProgress(null);
        setLocalError(null);
        setEnhancedPrompt(null);
        setSandboxSuccess(null);
    }, []);

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
                    optionsRef.current?.onSuccess?.(updatedProject);
                } else if (updatedProject.status === 'error') {
                    setStatus('error');
                    setLocalError(updatedProject.errorMessage || 'Project generation failed');
                    optionsRef.current?.onError?.(updatedProject.errorMessage || 'Project generation failed');
                }
            }
        },
        (data) => data._id === project?._id
    );

    useProjectChannel(project?._id || null);

    const hasReceivedFirstTokenRef = useRef(false);

    useSocketEvent<OrchestrationStartedEvent>('orchestration:started', (event) => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        if (event.projectId !== project?._id) return;
        hasReceivedFirstTokenRef.current = false;
        setStatus('generating');
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'analyzing',
            percentage: 5,
        }));
    });

    useSocketEvent('orchestration:intent', () => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'analyzing',
            percentage: 15,
        }));
    });

    useSocketEvent('orchestration:enhanced', () => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'planning',
            percentage: 25,
        }));
    });

    useSocketEvent('orchestration:context', () => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'planning',
            percentage: 35,
        }));
    });

    useSocketEvent('orchestration:token', () => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        if (hasReceivedFirstTokenRef.current) return;
        hasReceivedFirstTokenRef.current = true;
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'generating',
            percentage: 50,
        }));
    });

    useSocketEvent('orchestration:completed', () => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'validating',
            percentage: 70,
        }));
    });

    useSocketEvent<OrchestrationErrorEvent>('orchestration:error', (event) => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        setLocalError(event.error);
        setStatus('error');
        optionsRef.current?.onError?.(event.error);
    });

    useSocketEvent<SandboxResultEvent>('sandbox:result', (event) => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        setSandboxSuccess(event.success);
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'validating',
            percentage: 80,
        }));
    });

    useSocketEvent<FilesPersistedEvent>('files:persisted', (event) => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'finalizing',
            percentage: 90,
            filesGenerated: event.uploadedCount,
        }));
    });

    useSocketEvent<IndexingCompletedEvent>('indexing:completed', (event) => {
        if (statusRef.current !== 'creating' && statusRef.current !== 'generating') return;
        if (event.projectId !== project?._id) return;
        setProgress((prev) => ({
            ...(prev ?? { filesGenerated: 0, totalFiles: 0 }),
            currentStage: 'finalizing',
            percentage: 100,
        }));
    });

    useSocketEvent<IndexingErrorEvent>('indexing:error', (event) => {
        if (event.projectId !== project?._id) return;
        console.warn('[useProjectCreation] Indexing error:', event.error);
    });

    const isCreating = status === 'creating' || status === 'generating';

    return {
        state: {
            status,
            project,
            progress,
            error: localError || projectError,
            enhancedPrompt,
            sandboxSuccess
        },
        createProject,
        resetState,
        isCreating
    };
}
