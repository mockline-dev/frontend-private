'use client';

import { ArrowRight, LayoutGrid, Plus } from 'lucide-react';

interface QuickActionsProps {
    onCreateProject: () => void;
    onViewAllProjects: () => void;
}

export function QuickActions({ onCreateProject, onViewAllProjects }: QuickActionsProps) {
    return (
        <div className="animate-element animate-delay-500 mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                    onClick={onCreateProject}
                    className="group bg-primary hover:bg-primary/90 rounded-xl p-6 text-left transition-all flex items-center justify-between"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-foreground/10 rounded-lg flex items-center justify-center">
                            <Plus className="w-6 h-6 text-primary-foreground" />
                        </div>
                        <div>
                            <p className="text-primary-foreground font-medium mb-1">Create New Project</p>
                            <p className="text-primary-foreground/70 text-sm">Start building with AI</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>

                <button
                    onClick={onViewAllProjects}
                    className="group bg-card/80 backdrop-blur-sm hover:bg-card border border-border rounded-xl p-6 text-left transition-all flex items-center justify-between shadow-sm"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                            <LayoutGrid className="w-6 h-6 text-foreground" />
                        </div>
                        <div>
                            <p className="text-foreground font-medium mb-1">View All Projects</p>
                            <p className="text-muted-foreground text-sm">Browse your collection</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
            </div>
        </div>
    );
}
