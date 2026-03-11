'use client';

import { fetchProjectById } from '@/api/projects/fetchProjectById';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Project } from '@/types/feathers';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export type AIProject = Project;

export function useAIProject(projectId?: string, initialProject: Project | null = null) {
    const [project, setProject] = useState<Project | null>(initialProject);

    useEffect(() => {
        if (!projectId) return;
        if (initialProject?._id === projectId) return;

        fetchProjectById({ id: projectId })
            .then((result) => {
                setProject(result);
            })
            .catch(() => toast.error('Failed to load project'))
            .finally(() => undefined);
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePatched = useCallback((updated: Project) => {
        setProject((prev) => (prev?._id === updated._id ? updated : prev));
    }, []);

    useRealtimeUpdates<Project>('projects', 'patched', handlePatched, (p) => p._id === projectId);

    const loading = Boolean(projectId && !project);

    return { project, loading };
}
