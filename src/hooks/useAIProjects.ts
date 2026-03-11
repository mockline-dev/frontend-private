'use client';

import { fetchProjects } from '@/api/projects/fetchProjects';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Project } from '@/services/api/projects';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useAIProjects(initialProjects: Project[] = []) {
    const [projects, setProjects] = useState<Project[]>(initialProjects);
    const [loading, setLoading] = useState(initialProjects.length === 0);

    const loadProjects = useCallback(async () => {
        try {
            setLoading(true);
            const result = await fetchProjects({ query: { $sort: { createdAt: -1 }, $limit: 50 } });
            setProjects(Array.isArray(result) ? result : result.data || []);
        } catch {
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialProjects.length === 0) {
            loadProjects();
        }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleCreated = useCallback((project: Project) => {
        setProjects((prev) => [project, ...prev]);
    }, []);

    const handlePatched = useCallback((project: Project) => {
        setProjects((prev) => prev.map((p) => (p._id === project._id ? project : p)));
    }, []);

    const handleRemoved = useCallback((project: Project) => {
        setProjects((prev) => prev.filter((p) => p._id !== project._id));
    }, []);

    useRealtimeUpdates<Project>('projects', 'created', handleCreated);
    useRealtimeUpdates<Project>('projects', 'patched', handlePatched);
    useRealtimeUpdates<Project>('projects', 'removed', handleRemoved);

    const getProjectStats = useCallback(
        () => ({
            total: projects.length,
            ready: projects.filter((p) => p.status === 'ready').length,
            generating: projects.filter((p) => p.status === 'generating').length
        }),
        [projects]
    );

    const getRecentProjects = useCallback(
        (limit = 3) => {
            return projects.slice(0, limit);
        },
        [projects]
    );

    return {
        projects,
        loading,
        loadProjects,
        getProjectStats,
        getRecentProjects
    };
}
