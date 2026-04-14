'use client';

import { createProject as createProjectAction } from '@/api/projects/createProject';
import { deleteProject as deleteProjectAction } from '@/api/projects/deleteProject';
import { fetchProjectById } from '@/api/projects/fetchProjectById';
import { fetchProjects } from '@/api/projects/fetchProjects';
import { updateProject as updateProjectAction } from '@/api/projects/updateProject';
import feathersClient from '@/services/featherClient';
import { CreateProjectData, Project, ProjectQuery } from '@/types/feathers';
import { useCallback, useRef, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

const PAGE_SIZE = 20;

export interface UseProjectsReturn {
    // State
    projects: Project[];
    loading: boolean;
    loadingMore: boolean;
    hasMore: boolean;
    error: string | null;
    currentProject: Project | null;

    // Methods
    loadProjects: (query?: ProjectQuery) => Promise<void>;
    loadMore: () => Promise<void>;
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
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(initialProjects.length >= PAGE_SIZE);
    const [error, setError] = useState<string | null>(null);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const skipRef = useRef(initialProjects.length);

    const isBrowser = typeof window !== 'undefined';
    const disableRealtime = opts?.disableRealtimeListeners ?? false;

    // Load all projects (resets pagination)
    const loadProjects = useCallback(
        async (query?: ProjectQuery) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const result = await fetchProjects({
                    query: query || { $sort: { createdAt: -1 }, $limit: PAGE_SIZE }
                });
                const data = Array.isArray(result) ? result : result.data || [];
                setProjects(data);
                skipRef.current = data.length;
                setHasMore(data.length >= PAGE_SIZE);
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

    // Load next page of projects
    const loadMore = useCallback(async () => {
        if (!isBrowser || loadingMore || !hasMore) return;

        setLoadingMore(true);
        try {
            const result = await fetchProjects({
                query: { $sort: { createdAt: -1 }, $limit: PAGE_SIZE, $skip: skipRef.current }
            });
            const data = Array.isArray(result) ? result : result.data || [];
            setProjects((prev) => [...prev, ...data]);
            skipRef.current += data.length;
            setHasMore(data.length >= PAGE_SIZE);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to load more projects';
            setError(message);
            console.error('[useProjects] Error loading more projects:', err);
        } finally {
            setLoadingMore(false);
        }
    }, [isBrowser, loadingMore, hasMore]);

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

            setError(null);

            try {
                const project = await createProjectAction(data);
                setProjects((prev) => [project, ...prev]);
                skipRef.current += 1;
                setCurrentProject(project);
                return project;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to create project';
                setError(message);
                console.error('[useProjects] Error creating project:', err);
                throw err;
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

            setError(null);

            try {
                await deleteProjectAction({ id: projectId });
                setProjects((prev) => prev.filter((p) => p._id !== projectId));
                skipRef.current = Math.max(0, skipRef.current - 1);
                setCurrentProject((prev) => (prev?._id === projectId ? null : prev));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to delete project';
                setError(message);
                console.error('[useProjects] Error deleting project:', err);
                throw err;
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

    // Refresh projects list (resets to first page)
    const refresh = useCallback(async () => {
        await loadProjects();
    }, [loadProjects]);

    useRealtimeUpdates<Project>('projects', 'created', (project) => {
        if (disableRealtime) return;
        setProjects((prev) => (prev.some((p) => p._id === project._id) ? prev : [project, ...prev]));
        skipRef.current += 1;
    });

    useRealtimeUpdates<Project>('projects', 'patched', (project) => {
        if (disableRealtime) return;
        setProjects((prev) => prev.map((p) => (p._id === project._id ? project : p)));
        setCurrentProject((prev) => (prev?._id === project._id ? project : prev));
    });

    useRealtimeUpdates<Project>('projects', 'removed', (project) => {
        if (disableRealtime) return;
        setProjects((prev) => prev.filter((p) => p._id !== project._id));
        skipRef.current = Math.max(0, skipRef.current - 1);
        setCurrentProject((prev) => (prev?._id === project._id ? null : prev));
    });

    return {
        // State
        projects,
        loading,
        loadingMore,
        hasMore,
        error,
        currentProject,

        // Methods
        loadProjects,
        loadMore,
        loadProject,
        createProject,
        updateProject,
        deleteProject,
        joinProject,
        leaveProject,
        refresh
    };
}
