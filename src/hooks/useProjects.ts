'use client';

import { createProject as createProjectAction } from '@/api/projects/createProject';
import { deleteProject as deleteProjectAction } from '@/api/projects/deleteProject';
import { fetchProjectById } from '@/api/projects/fetchProjectById';
import { fetchProjects } from '@/api/projects/fetchProjects';
import { updateProject as updateProjectAction } from '@/api/projects/updateProject';
import feathersClient from '@/services/featherClient';
import { CreateProjectData, ProgressEventData, Project, ProjectQuery } from '@/types/feathers';
import { useCallback, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export interface UseProjectsReturn {
    // State
    projects: Project[];
    loading: boolean;
    error: string | null;
    currentProject: Project | null;

    // Methods
    loadProjects: (query?: ProjectQuery) => Promise<void>;
    loadProject: (projectId: string) => Promise<void>;
    createProject: (data: CreateProjectData) => Promise<Project>;
    updateProject: (projectId: string, data: Partial<Project>) => Promise<Project>;
    deleteProject: (projectId: string) => Promise<void>;
    joinProject: (projectId: string) => void;
    leaveProject: (projectId: string) => void;
    refresh: () => Promise<void>;
}

export function useProjects(initialProjects: Project[] = [], opts?: { disableRealtimeListeners?: boolean }): UseProjectsReturn {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);

    const isBrowser = typeof window !== 'undefined';
    const disableRealtime = opts?.disableRealtimeListeners ?? false;

    // Load all projects
    const loadProjects = useCallback(
        async (query?: ProjectQuery) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchProjects({ query: query || { $sort: { createdAt: -1 } } });
                setProjects(Array.isArray(result) ? result : result.data || []);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load projects';
                setError(message);
                console.error('[useProjects] Error loading projects:', err);
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Load a single project
    const loadProject = useCallback(
        async (projectId: string) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const project = await fetchProjectById({ id: projectId });
                setCurrentProject(project);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load project';
                setError(message);
                console.error('[useProjects] Error loading project:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Create a new project
    const createProject = useCallback(
        async (data: CreateProjectData): Promise<Project> => {
            if (!isBrowser) {
                throw new Error('Cannot create project on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const project = await createProjectAction(data);
                setProjects((prev) => [project, ...prev]);
                setCurrentProject(project);
                return project;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to create project';
                setError(message);
                console.error('[useProjects] Error creating project:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Update a project
    const updateProject = useCallback(
        async (projectId: string, data: Partial<Project>): Promise<Project> => {
            if (!isBrowser) {
                throw new Error('Cannot update project on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const updated = await updateProjectAction({ id: projectId, data });
                setProjects((prev) => prev.map((p) => (p._id === projectId ? updated : p)));
                setCurrentProject((prev) => (prev?._id === projectId ? updated : prev));
                return updated;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to update project';
                setError(message);
                console.error('[useProjects] Error updating project:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Delete a project
    const deleteProject = useCallback(
        async (projectId: string): Promise<void> => {
            if (!isBrowser) {
                throw new Error('Cannot delete project on the server');
            }

            setLoading(true);
            setError(null);

            try {
                await deleteProjectAction({ id: projectId });
                setProjects((prev) => prev.filter((p) => p._id !== projectId));
                setCurrentProject((prev) => (prev?._id === projectId ? null : prev));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to delete project';
                setError(message);
                console.error('[useProjects] Error deleting project:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    const joinProject = useCallback(
        (projectId: string) => {
            if (!isBrowser) return;

            const socket = feathersClient.io;
            if (!socket) {
                console.warn('[useProjects] Socket not available');
                return;
            }

            socket.emit('join', `projects/${projectId}`);
        },
        [isBrowser]
    );

    const leaveProject = useCallback(
        (projectId: string) => {
            if (!isBrowser) return;

            const socket = feathersClient.io;
            if (!socket) {
                console.warn('[useProjects] Socket not available');
                return;
            }

            socket.emit('leave', `projects/${projectId}`);
        },
        [isBrowser]
    );

    // Refresh projects list
    const refresh = useCallback(async () => {
        await loadProjects();
    }, [loadProjects]);

    useRealtimeUpdates<Project>('projects', 'created', (project) => {
        if (disableRealtime) return;
        setProjects((prev) => (prev.some((p) => p._id === project._id) ? prev : [project, ...prev]));
    });

    useRealtimeUpdates<Project>('projects', 'patched', (project) => {
        if (disableRealtime) return;
        setProjects((prev) => prev.map((p) => (p._id === project._id ? project : p)));
        setCurrentProject((prev) => (prev?._id === project._id ? project : prev));
    });

    useRealtimeUpdates<Project>('projects', 'removed', (project) => {
        if (disableRealtime) return;
        setProjects((prev) => prev.filter((p) => p._id !== project._id));
        setCurrentProject((prev) => (prev?._id === project._id ? null : prev));
    });

    useRealtimeUpdates<ProgressEventData>('projects', 'progress', (data) => {
        if (disableRealtime) return;
        setProjects((prev) =>
            prev.map((p) =>
                p._id === data.projectId
                    ? {
                          ...p,
                          status: data.status,
                          generationProgress: data.progress
                      }
                    : p
            )
        );

        setCurrentProject((prev) =>
            prev?._id === data.projectId
                ? {
                      ...prev,
                      status: data.status,
                      generationProgress: data.progress
                  }
                : prev
        );
    });

    return {
        // State
        projects,
        loading,
        error,
        currentProject,

        // Methods
        loadProjects,
        loadProject,
        createProject,
        updateProject,
        deleteProject,
        joinProject,
        leaveProject,
        refresh
    };
}
