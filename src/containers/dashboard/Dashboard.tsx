'use client';

import Header from '@/components/custom/Header';
import { useProjects } from '@/hooks/useProjects';
import type { Project } from '@/types/feathers';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { UserData } from '../auth/types';
import { DashboardStats } from './components/DashboardStats';
import { ProjectList } from './components/ProjectList';
import { QuickActions } from './components/QuickActions';

interface DashboardProps {
    currentUser: UserData;
    initialProjects?: Project[];
}

export function Dashboard({ currentUser, initialProjects = [] }: DashboardProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showAllProjects, setShowAllProjects] = useState(false);
    const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);

    const { projects, loading, error, loadProjects, deleteProject, joinProject, leaveProject, refresh } = useProjects(initialProjects);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            loadProjects();
        }
    }, [loadProjects]);

    const joinedIdsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const currentIds = new Set(projects.map((p) => p._id));

        // Join new projects
        projects.forEach((project) => {
            if (!joinedIdsRef.current.has(project._id)) {
                joinProject(project._id);
                joinedIdsRef.current.add(project._id);
            }
        });

        // Leave removed projects
        joinedIdsRef.current.forEach((id) => {
            if (!currentIds.has(id)) {
                leaveProject(id);
                joinedIdsRef.current.delete(id);
            }
        });

        return () => {
            if (typeof window === 'undefined') return;
            const joinedIds = joinedIdsRef.current;
            joinedIds.forEach((id) => leaveProject(id));
            joinedIds.clear();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projects]);

    useEffect(() => {
        if (error) {
            toast.error(error);
        }
    }, [error]);

    const handleCreateProject = () => {
        router.push('/');
    };

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';
    const userName = currentUser ? currentUser.firstName || 'User' : 'User';

    const formatTimeAgo = (timestamp: number) => {
        const now = new Date().getTime();
        const diff = now - timestamp;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(hours / 24);

        if (days > 0) {
            return `${days} day${days > 1 ? 's' : ''} ago`;
        } else if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            return 'Just now';
        }
    };

    const handleProjectClick = (projectId: string) => {
        router.push(`/workspace?projectId=${projectId}`);
    };

    const handleDeleteProject = async (e: React.MouseEvent, projectId: string, projectName: string) => {
        e.stopPropagation();

        if (!confirm(`Are you sure you want to delete "${projectName}"?`)) {
            return;
        }

        setDeletingProjectId(projectId);
        try {
            const project = projects.find((p) => p._id === projectId);
            if (!currentUser || !project || project.userId !== currentUser.feathersId) {
                toast.error('You do not have permission to delete this project');
                return;
            }

            await deleteProject(projectId);
            toast.success(`Deleted: ${projectName}`);

            router.refresh();
        } catch (err) {
            console.error('Failed to delete project:', err);
            toast.error('Failed to delete project');
        } finally {
            setDeletingProjectId(null);
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <Header currentUser={currentUser} currentPage="dashboard" onNavigateClick={() => router.push('/')} />
            <div className="animate-element animate-delay-300 max-w-6xl mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        {greeting}, {userName}!
                    </h1>
                    <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your projects</p>
                </div>

                <DashboardStats projects={projects} loading={loading} />

                <QuickActions onCreateProject={handleCreateProject} onViewAllProjects={() => setShowAllProjects(true)} />

                <div className="animate-element animate-delay-700">
                    <ProjectList
                        projects={projects}
                        loading={loading}
                        showAllProjects={showAllProjects}
                        searchQuery={searchQuery}
                        statusFilter={statusFilter}
                        onSearchChange={setSearchQuery}
                        onStatusFilterChange={setStatusFilter}
                        onToggleView={() => setShowAllProjects(!showAllProjects)}
                        onProjectClick={handleProjectClick}
                        onDeleteProject={handleDeleteProject}
                        deletingProjectId={deletingProjectId}
                        onCreateProject={handleCreateProject}
                        formatTimeAgo={formatTimeAgo}
                    />
                </div>
            </div>
        </div>
    );
}
