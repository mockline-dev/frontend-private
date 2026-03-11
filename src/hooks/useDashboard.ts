'use client';

import { deleteProject as deleteProjectApi } from '@/api/projects/deleteProject';
import { useAIProjects } from '@/hooks/useAIProjects';
import { Project } from '@/services/api/projects';
import { useCallback, useMemo, useState } from 'react';
import { toast } from 'sonner';

export interface UseDashboardReturn {
    projects: Project[];
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    statusFilter: string;
    setStatusFilter: (s: string) => void;
    showAllProjects: boolean;
    setShowAllProjects: (v: boolean) => void;
    deletingProjectId: string | null;
    filteredProjects: Project[];
    recentProjects: Project[];
    stats: { total: number; ready: number; generating: number };
    weeklyCount: number;
    handleDeleteProject: (e: React.MouseEvent, projectId: string, projectName: string) => Promise<void>;
}

export function useDashboard(initialProjects: Project[] = []): UseDashboardReturn {
    const { projects, loading, getProjectStats, getRecentProjects } = useAIProjects(initialProjects);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAllProjects, setShowAllProjects] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

    const filteredProjects = useMemo(() => {
        return projects.filter((p) => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [projects, searchQuery, statusFilter]);

    const recentProjects = useMemo(() => getRecentProjects(3), [getRecentProjects]);

    const stats = useMemo(() => getProjectStats(), [getProjectStats]);

    const weeklyCount = useMemo(() => {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        return projects.filter((p) => new Date(p.createdAt) >= oneWeekAgo).length;
    }, [projects]);

    const handleDeleteProject = useCallback(async (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.stopPropagation();
        if (!confirm(`Are you sure you want to delete "${projectName}"?`)) return;

        setDeletingProjectId(projectId);
        try {
            await deleteProjectApi({ id: projectId });
            toast.success(`Deleted: ${projectName}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to delete project');
        } finally {
            setDeletingProjectId(null);
        }
    }, []);

    return {
        projects,
        loading,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        showAllProjects,
        setShowAllProjects,
        deletingProjectId,
        filteredProjects,
        recentProjects,
        stats,
        weeklyCount,
        handleDeleteProject
    };
}
