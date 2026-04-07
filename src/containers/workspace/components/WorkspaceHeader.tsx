'use client';

import { UserMenu } from '@/components/custom/UserMenu';
import { Button } from '@/components/ui/button';
import type { ActiveView } from '@/types/workspace';
import { Code2, Download, TestTube2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
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
    onViewChange: (view: ActiveView) => void;
    onDownload: () => void;
    onNavigate: (page: 'dashboard' | 'workspace' | 'initial') => void;
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
    onViewChange,
    onDownload,
    onNavigate
}: WorkspaceHeaderProps) {
    const router = useRouter();

    return (
        <div className="h-12 border-b border-zinc-200 flex items-center justify-between px-4 bg-white relative">
            <nav className="flex items-center gap-1 text-sm">
                <div className="w-6 h-6 bg-linear-to-br from-violet-500 to-purple-600 rounded-md flex items-center justify-center mr-1">
                    <Code2 className="w-3.5 h-3.5 text-white" />
                </div>
                <button onClick={() => router.push('/dashboard')} className="text-zinc-500 hover:text-zinc-900 transition-colors">
                    Dashboard
                </button>
                <span className="text-zinc-400 mx-1">/</span>
                <span className="text-zinc-700 font-medium">{projectName.slice(0, 40)}</span>
                {selectedFile && activeView === 'code' && (
                    <>
                        <span className="text-zinc-400 mx-1">/</span>
                        <span className="text-zinc-900 font-semibold flex items-center gap-1">
                            {selectedFile}
                            {hasUnsavedChanges && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" title="Unsaved changes" />
                            )}
                        </span>
                    </>
                )}
            </nav>

            <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-zinc-100 rounded-lg p-0.5">
                <button
                    onClick={() => onViewChange('code')}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeView === 'code' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                    <Code2 className="w-3.5 h-3.5" />
                    Code
                </button>
                <button
                    onClick={() => onViewChange('api')}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                        activeView === 'api'
                            ? 'bg-white text-zinc-900 shadow-sm'
                            : 'text-zinc-600 hover:text-zinc-900'
                    }`}
                >
                    <TestTube2 className="w-3.5 h-3.5" />
                    API Testing
                    {isBackendReady && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />}
                </button>
            </div>

            <div className="flex items-center gap-2">
                <Button onClick={onDownload} disabled={!currentProjectId || filesCount === 0} size="sm" variant="outline" className="h-7 text-xs">
                    <Download className="w-3 h-3 mr-1" />
                    Download
                </Button>
                <UserMenu currentUser={currentUser} currentPage="workspace" onNavigate={onNavigate} />
            </div>
        </div>
    );
}
