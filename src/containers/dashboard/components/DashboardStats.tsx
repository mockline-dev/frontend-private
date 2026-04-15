'use client';

import { FolderOpen, LayoutGrid, TrendingUp } from 'lucide-react';

export interface StatsData {
    total: number;
    ready?: number;
    byStatus: Record<string, number>;
    thisWeek: number;
}

interface DashboardStatsProps {
    stats: StatsData | null;
    loading: boolean;
}

export function DashboardStats({ stats, loading }: DashboardStatsProps) {
    const total = stats?.total ?? 0;
    const ready = stats?.ready ?? ((stats?.byStatus?.['ready'] ?? 0) + (stats?.byStatus?.['running'] ?? 0));
    const thisWeek = stats?.thisWeek ?? 0;

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
                    <p className="text-3xl font-bold text-foreground">{loading ? '...' : total}</p>
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
                    <p className="text-3xl font-bold text-foreground">{loading ? '...' : ready}</p>
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
                    <p className="text-3xl font-bold text-foreground">{loading ? '...' : thisWeek}</p>
                    <p className="text-xs text-primary mt-1">new projects</p>
                </div>
            </div>
        </div>
    );
}
