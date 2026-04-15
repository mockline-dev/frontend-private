'use client';

import { UserMenu } from '@/components/custom/UserMenu';
import { Button } from '@/components/ui/button';
import type { ActiveView } from '@/types/workspace';
import { Check, Code2, Download, Loader2, Pencil, TestTube2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { UserData } from '../../auth/types';

interface WorkspaceHeaderProps {
    currentUser: UserData;
    projectName: string;
    selectedFile: string | null;
    activeView: ActiveView;
    isBackendReady: boolean;
    currentProjectId: string | undefined;
    filesCount: number;
    hasUnsavedChanges?: boolean;
    isDownloading?: boolean;
    onViewChange: (view: ActiveView) => void;
    onDownload: () => void;
    onNavigate: (page: 'dashboard' | 'workspace' | 'initial') => void;
    onRenameProject?: (name: string) => Promise<void>;
}

export function WorkspaceHeader({
    currentUser,
    projectName,
    selectedFile,
    activeView,
    isBackendReady,
    currentProjectId,
    filesCount,
    hasUnsavedChanges,
    isDownloading,
    onViewChange,
    onDownload,
    onNavigate,
    onRenameProject
}: WorkspaceHeaderProps) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(projectName);
    const [isSaving, setIsSaving] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setEditValue(projectName);
    }, [projectName]);

    useEffect(() => {
        if (isEditing) inputRef.current?.select();
    }, [isEditing]);

    const isDirty = editValue.trim() !== projectName && editValue.trim().length > 0;

    const handleSave = async () => {
        const trimmed = editValue.trim();
        if (!trimmed || trimmed === projectName) { setIsEditing(false); return; }
        setIsSaving(true);
        try {
            await onRenameProject?.(trimmed);
        } finally {
            setIsSaving(false);
            setIsEditing(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') { void handleSave(); }
        if (e.key === 'Escape') { setEditValue(projectName); setIsEditing(false); }
    };

    return (
        <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-background relative">
            <nav className="flex items-center gap-1 text-sm">
                <div className="w-6 h-6 bg-linear-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center mr-1">
                    <Code2 className="w-3.5 h-3.5 text-white" />
                </div>
                <button onClick={() => router.push('/dashboard')} className="text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                </button>
                <span className="text-muted-foreground mx-1">/</span>

                {isEditing ? (
                    <div className="flex items-center gap-1">
                        <input
                            ref={inputRef}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={() => { if (!isDirty) setIsEditing(false); }}
                            className="text-sm font-medium text-foreground bg-muted border border-border rounded px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-ring w-48"
                            maxLength={80}
                        />
                        {isDirty && (
                            <>
                                <button
                                    onClick={() => void handleSave()}
                                    disabled={isSaving}
                                    className="text-emerald-600 hover:text-emerald-500 disabled:opacity-50"
                                    title="Save"
                                >
                                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                    onClick={() => { setEditValue(projectName); setIsEditing(false); }}
                                    className="text-muted-foreground hover:text-foreground"
                                    title="Cancel"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => onRenameProject ? setIsEditing(true) : undefined}
                        className={`flex items-center gap-1 text-foreground/80 font-medium group ${onRenameProject ? 'hover:text-foreground' : 'cursor-default'}`}
                        title={onRenameProject ? 'Click to rename' : undefined}
                    >
                        <span>{projectName.slice(0, 40)}</span>
                        {onRenameProject && <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />}
                    </button>
                )}

                {selectedFile && activeView === 'code' && (
                    <>
                        <span className="text-muted-foreground mx-1">/</span>
                        <span className="text-foreground font-semibold flex items-center gap-1">
                            {selectedFile}
                            {hasUnsavedChanges && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Unsaved changes" />
                            )}
                        </span>
                    </>
                )}
            </nav>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-muted rounded-lg p-0.5">
                <button
                    onClick={() => onViewChange('code')}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeView === 'code' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Code2 className="w-3.5 h-3.5" />
                    Code
                </button>
                <button
                    onClick={() => onViewChange('api')}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeView === 'api'
                            ? 'bg-background text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <TestTube2 className="w-3.5 h-3.5" />
                    API Testing
                    {isBackendReady && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                </button>
            </div>

            <div className="flex items-center gap-2">
                <Button
                    onClick={onDownload}
                    disabled={!currentProjectId || filesCount === 0 || isDownloading}
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                >
                    {isDownloading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Download className="w-3 h-3 mr-1" />}
                    {isDownloading ? 'Downloading…' : 'Download'}
                </Button>
                <UserMenu currentUser={currentUser} currentPage="workspace" onNavigate={onNavigate} />
            </div>
        </div>
    );
}
