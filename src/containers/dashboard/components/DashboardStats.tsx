'use client';

import type { Project } from '@/types/feathers';
import { FolderOpen, LayoutGrid, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
    projects: Project[];
    loading: boolean;
}

export function DashboardStats({ projects, loading }: DashboardStatsProps) {
    const totalProjects = projects.length;
    const readyProjects = projects.filter((p) => p.status === 'ready' || p.status === 'running').length;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const thisWeekProjects = projects.filter((p) => new Date(p.createdAt) >= oneWeekAgo).length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-5 h-5 text-primary" />
                    </div>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Total Projects</p>
                    <p className="text-3xl font-bold text-foreground">{loading ? '...' : totalProjects}</p>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <LayoutGrid className="w-5 h-5 text-primary" />
                    </div>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">Ready Projects</p>
                    <p className="text-3xl font-bold text-foreground">{loading ? '...' : readyProjects}</p>
                </div>
            </div>

            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-primary" />
                    </div>
                </div>
                <div>
                    <p className="text-xs text-muted-foreground mb-1">This Week</p>
                    <p className="text-3xl font-bold text-foreground">{loading ? '...' : thisWeekProjects}</p>
                    <p className="text-xs text-primary mt-1">new projects</p>
                </div>
            </div>
        </div>
    );
}
