'use client';

import { fetchProjectById } from '@/api/projects/fetchProjectById';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { Project } from '@/services/api/projects';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export type AIProject = Project;

export function useAIProject(projectId?: string, initialProject: Project | null = null) {
    const [project, setProject] = useState<Project | null>(initialProject);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!projectId) return;
        if (initialProject?._id === projectId) return;

        setLoading(true);
        fetchProjectById({ id: projectId })
            .then((result) => {
                if (result.success) setProject(result.data);
                else toast.error('Failed to load project');
            })
            .catch(() => toast.error('Failed to load project'))
            .finally(() => setLoading(false));
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    const handlePatched = useCallback((updated: Project) => {
        setProject((prev) => (prev?._id === updated._id ? updated : prev));
    }, []);

    useRealtimeUpdates<Project>('projects', 'patched', handlePatched, (p) => p._id === projectId);

    return { project, loading };
}
