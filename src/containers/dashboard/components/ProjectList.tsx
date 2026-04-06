'use client';

import { Button } from '@/components/ui/button';
import type { Project } from '@/types/feathers';
import { Plus, Search, X } from 'lucide-react';
import { ProjectCard } from './ProjectCard';

interface ProjectListProps {
    projects: Project[];
    loading: boolean;
    showAllProjects: boolean;
    searchQuery: string;
    statusFilter: string;
    onSearchChange: (query: string) => void;
    onStatusFilterChange: (filter: string) => void;
    onToggleView: () => void;
    onProjectClick: (projectId: string) => void;
    onDeleteProject: (e: React.MouseEvent, projectId: string, projectName: string) => void;
    deletingProjectId: string | null;
    onCreateProject: () => void;
    formatTimeAgo: (timestamp: number) => string;
}

export function ProjectList({
    projects,
    loading,
    showAllProjects,
    searchQuery,
    statusFilter,
    onSearchChange,
    onStatusFilterChange,
    onToggleView,
    onProjectClick,
    onDeleteProject,
    deletingProjectId,
    onCreateProject,
    formatTimeAgo
}: ProjectListProps) {
    // Filter projects based on search query and status
    const filteredProjects = projects.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Get recent projects (first 3)
    const recentProjects = projects.slice(0, 3);
    const displayedProjects = showAllProjects ? filteredProjects : recentProjects;

    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">{showAllProjects ? 'All Projects' : 'Recent Projects'}</h2>
                {!showAllProjects && (
                    <button onClick={onToggleView} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                        View all
                        <X className="w-4 h-4" />
                    </button>
                )}
                {showAllProjects && (
                    <button onClick={onToggleView} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <X className="w-4 h-4" />
                        Show recent
                    </button>
                )}
            </div>

            {showAllProjects && (
                <div className="flex gap-3 mb-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => onStatusFilterChange(e.target.value)}
                        className="px-4 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">All Status</option>
                        <option value="ready">Ready</option>
                        <option value="running">Running</option>
                        <option value="generating">Generating</option>
                        <option value="validating">Validating</option>
                        <option value="error">Error</option>
                    </select>
                </div>
            )}

            <div className="grid grid-cols-1 gap-3">
                {loading ? (
                    <div className="grid grid-cols-1 gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-card/80 backdrop-blur-sm rounded-xl border border-border shadow-sm p-5 animate-pulse">
                                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                                <div className="h-3 bg-muted rounded w-2/3 mb-3" />
                                <div className="h-3 bg-muted rounded w-1/4" />
                            </div>
                        ))}
                    </div>
                ) : displayedProjects.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-muted-foreground mb-2">No projects found</p>
                        <Button onClick={onCreateProject} variant="outline" size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Create your first project
                        </Button>
                    </div>
                ) : (
                    displayedProjects.map((project) => (
                        <ProjectCard
                            key={project._id}
                            project={project}
                            onClick={() => onProjectClick(project._id)}
                            onDelete={(e) => onDeleteProject(e, project._id, project.name)}
                            isDeleting={deletingProjectId === project._id}
                            formatTimeAgo={formatTimeAgo}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
