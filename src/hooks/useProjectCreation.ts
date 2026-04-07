'use client';

import { CreateProjectData, FilesPersistedEvent, GenerationProgress, IndexingCompletedEvent, IndexingErrorEvent, OrchestrationErrorEvent, OrchestrationIntentEvent, OrchestrationStartedEvent, Project, SandboxResultEvent } from '@/types/feathers';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useProjects } from './useProjects';
import { useProjectChannel, useRealtimeUpdates, useSocketEvent } from './useRealtimeUpdates';

/**
 * Simplified state for project creation process.
 */
export type ProjectCreationStatus = 'idle' | 'creating' | 'generating' | 'ready' | 'error';

export interface ProjectCreationState {
    status: ProjectCreationStatus;
    project: Project | null;
    progress: GenerationProgress | null;
    error: string | null;
    enhancedPrompt: string | null;
    sandboxSuccess: boolean | null;
}

/**
 * Return type for the simplified useProjectCreation hook.
 */
export interface UseProjectCreationReturn {
    /** Current state of the project creation process */
    state: ProjectCreationState;
    /** Creates a new project with the provided data */
    createProject: (data: CreateProjectData) => Promise<Project | undefined>;
    /** Resets the state to idle */
    resetState: () => void;
    /** Whether a creation operation is in progress */
    isCreating: boolean;
}

/**
 * Simplified hook for managing project creation.
 *
 * This hook uses the new useProjects and useRealtimeUpdates hooks to:
 * - Create projects via the projects service
 * - Listen to real-time progress updates
 * - Join project channels for updates
 * - Handle loading, error, and success states properly
 *
 * @example
 * ```typescript
 * const { state, createProject, resetState, isCreating } = useProjectCreation({
 *   onSuccess: (project) => {
 *     console.log('Project created:', project.name)
 *   }
 * })
 *
 * // Create a project
 * await createProject({
 *   name: 'My Project',
 *   description: 'A test project',
 *   framework: 'fast-api',
 *   language: 'python'
 * })
 * ```
 *
 * @param options - Optional configuration for callbacks
 * @returns An object containing state, actions, and computed values
 */
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

    /**
     * Creates a new project with the provided data.
     */
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

    /**
     * Resets the state to idle.
     */
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
            // Only process updates for our current project
            if (updatedProject._id === project?._id) {
                setProject(updatedProject);

                // Update progress if available
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

    // New orchestration event handlers (payloads per backend alpha/e2e-generation-pipeline)
    // Events arrive on the joined project channel — no projectId in most payloads
    useSocketEvent<OrchestrationStartedEvent>('orchestration:started', (event) => {
        if (event.projectId !== project?._id) return; // has projectId
        setStatus('generating');
    });

    useSocketEvent<OrchestrationIntentEvent>('orchestration:intent', (event) => {
        // payload: { intent, confidence, entities } — no projectId
        setProgress((prev) => ({ ...(prev ?? { percentage: 10, filesGenerated: 0, totalFiles: 0 }), currentStage: event.intent }));
    });

    // orchestration:enhanced payload is { originalLength, enhancedLength } — enhancedPrompt
    // is stored in the assistant message metadata, not in the event. No action needed here.

    useSocketEvent<OrchestrationErrorEvent>('orchestration:error', (event) => {
        // payload: { error } — no projectId
        setLocalError(event.error);
        setStatus('error');
        optionsRef.current?.onError?.(event.error);
    });

    useSocketEvent<SandboxResultEvent>('sandbox:result', (event) => {
        // payload: { success, syntaxValid, compilationOutput, testOutput?, durationMs } — no projectId
        setSandboxSuccess(event.success);
    });

    useSocketEvent<FilesPersistedEvent>('files:persisted', (event) => {
        // payload: { fileIds, snapshotId, uploadedCount, filePaths } — no projectId
        setProgress((prev) => ({
            ...(prev ?? { percentage: 80, filesGenerated: 0, totalFiles: 0, currentStage: 'persisting' }),
            filesGenerated: event.uploadedCount
        }));
    });

    useSocketEvent<IndexingCompletedEvent>('indexing:completed', (event) => {
        if (event.projectId !== project?._id) return; // has projectId
        setProgress((prev) => ({
            ...(prev ?? { percentage: 100, filesGenerated: 0, totalFiles: 0, currentStage: 'indexed' }),
            currentStage: 'indexed',
            percentage: 100
        }));
    });

    useSocketEvent<IndexingErrorEvent>('indexing:error', (event) => {
        if (event.projectId !== project?._id) return; // has projectId
        console.warn('[useProjectCreation] Indexing error:', event.error);
    });

    // Computed values
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
