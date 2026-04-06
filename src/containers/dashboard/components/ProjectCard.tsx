'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import type { Project } from '@/types/feathers';
import { AlertCircle, ArrowRight, CheckCircle, Clock, Play, Trash2 } from 'lucide-react';

interface ProjectCardProps {
    project: Project;
    onClick: () => void;
    onDelete: (e: React.MouseEvent) => void;
    isDeleting?: boolean;
    formatTimeAgo: (timestamp: number) => string;
}

export function ProjectCard({ project, onClick, onDelete, isDeleting = false, formatTimeAgo }: ProjectCardProps) {
    const getStatusIcon = (status: Project['status']) => {
        switch (status) {
            case 'ready':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'running':
                return <Play className="w-4 h-4 text-green-500" />;
            case 'generating':
            case 'validating':
                return <Clock className="w-4 h-4 text-blue-600" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const isGenerating = project.status === 'generating' || project.status === 'validating';
    const progress = project.generationProgress?.percentage || 0;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClick();
                }
            }}
            className="group bg-card/80 backdrop-blur-sm hover:bg-card border border-border rounded-xl p-5 text-left transition-all shadow-sm relative w-full cursor-pointer"
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground truncate">{project.name}</p>
                        {getStatusIcon(project.status)}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-1">{project.description}</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground/70">{formatTimeAgo(project.updatedAt)}</p>
                        <span className="text-xs text-muted-foreground/70">•</span>
                        <p className="text-xs text-muted-foreground/70 capitalize">{project.framework}</p>
                    </div>
                    {isGenerating && project.generationProgress && (
                        <div className="mt-3">
                            <div className="flex items-center justify-between mb-1">
                                <p className="text-xs text-muted-foreground">{project.generationProgress.currentStage}</p>
                                <p className="text-xs text-muted-foreground">{progress}%</p>
                            </div>
                            <Progress value={progress} className="h-2" />
                            {project.generationProgress.totalFiles > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                    {project.generationProgress.filesGenerated} / {project.generationProgress.totalFiles} files
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                    <Button
                        onClick={onDelete}
                        disabled={isDeleting}
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                        {isDeleting ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-foreground" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
