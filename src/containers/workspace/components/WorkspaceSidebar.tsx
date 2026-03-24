'use client';

import { FileTree } from '@/components/custom/FileTree';
import { FileTreeHeader } from '@/components/custom/FileTreeHeader';
import { Button } from '@/components/ui/button';
import { AiAgent } from '@/containers/aiAgent/AIAgent';
import type { SidebarView, FileNode } from '@/types/workspace';
import type { File as FileType } from '@/services/api/files';
import type { Snapshot } from '@/types/feathers';
import { Bot, FolderTree, History, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';


interface WorkspaceSidebarProps {
    sidebarView: SidebarView;
    onSidebarViewChange: (view: SidebarView) => void;
    fileTree: FileNode[];
    selectedFile: string | null;
    onFileSelect: (path: string) => void;
    updatingFiles: Set<string>;

    // AI agent
    currentProjectId: string | undefined;
    files: FileType[];
    selectedFileContent: string;
    onFileApplied: (event: { action: 'create' | 'modify' | 'delete'; filename: string; content?: string }) => void;

    // Versions / Snapshots
    snapshots: Snapshot[];
    snapshotsLoading: boolean;
    isSnapshotCreating: boolean;
    snapshotActionId: string | null;
    onCreateSnapshot: () => void;
    onRollbackSnapshot: (id: string) => void;
    onDeleteSnapshot: (id: string) => void;
}

const SIDEBAR_VIEWS: { id: SidebarView; label: string }[] = [
    { id: 'files', label: 'Files' },
    { id: 'ai', label: 'Mocky' },
    { id: 'versions', label: 'Versions' }
];

export function WorkspaceSidebar({
    sidebarView,
    onSidebarViewChange,
    fileTree,
    selectedFile,
    onFileSelect,
    updatingFiles,
    currentProjectId,
    files,
    selectedFileContent,
    onFileApplied,
    snapshots,
    snapshotsLoading,
    isSnapshotCreating,
    snapshotActionId,
    onCreateSnapshot,
    onRollbackSnapshot,
    onDeleteSnapshot
}: WorkspaceSidebarProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [renamingPath, setRenamingPath] = useState<string | null>(null);

    const handleCopyPath = (path: string) => {
        navigator.clipboard.writeText(path).catch(() => {});
        toast.success('Path copied');
    };

    return (
        <div className="h-full border-r border-zinc-200 bg-white flex flex-col">
            {/* Tab strip */}
            <div className="border-b border-zinc-200 flex">
                {SIDEBAR_VIEWS.map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => onSidebarViewChange(id)}
                        className={`flex-1 px-1 py-2.5 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                            sidebarView === id
                                ? 'bg-white text-zinc-900 border-b-2 border-black'
                                : 'text-zinc-500 hover:text-zinc-900 bg-zinc-50'
                        }`}
                    >
                        {id === 'files' && <FolderTree className="w-3.5 h-3.5" />}
                        {id === 'ai' && <Bot className="w-3.5 h-3.5" />}
                        {id === 'versions' && <History className="w-3.5 h-3.5" />}
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
                {sidebarView === 'files' ? (
                    <div className="h-full flex flex-col">
                        <FileTreeHeader
                            searchQuery={searchQuery}
                            onSearchChange={setSearchQuery}
                            onNewFile={() => toast.info('New file: coming soon')}
                            onNewFolder={() => toast.info('New folder: coming soon')}
                        />
                        <div className="flex-1 overflow-y-auto px-2 py-2">
                            {fileTree.length > 0 ? (
                                <FileTree
                                    data={fileTree}
                                    onFileClick={onFileSelect}
                                    selectedFile={selectedFile || ''}
                                    updatingFiles={updatingFiles}
                                    renamingPath={renamingPath}
                                    onRenameConfirm={() => {
                                        toast.info('Rename: coming soon');
                                        setRenamingPath(null);
                                    }}
                                    onRenameCancel={() => setRenamingPath(null)}
                                    onDelete={() => toast.info('Delete: coming soon')}
                                    onCopyPath={handleCopyPath}
                                    onNewFile={() => toast.info('New file: coming soon')}
                                    onNewFolder={() => toast.info('New folder: coming soon')}
                                    searchQuery={searchQuery}
                                />
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-sm text-zinc-500">No files generated yet</p>
                                    <p className="text-xs text-zinc-400 mt-1">Use Mocky to generate code</p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : sidebarView === 'ai' ? (
                    <AiAgent
                        {...(currentProjectId ? { projectId: currentProjectId } : {})}
                        files={files}
                        selectedFile={selectedFile || ''}
                        selectedFileContent={selectedFileContent}
                        onFileApplied={onFileApplied}
                    />
                ) : (
                    <VersionsPanel
                        currentProjectId={currentProjectId}
                        snapshots={snapshots}
                        snapshotsLoading={snapshotsLoading}
                        isSnapshotCreating={isSnapshotCreating}
                        snapshotActionId={snapshotActionId}
                        onCreateSnapshot={onCreateSnapshot}
                        onRollbackSnapshot={onRollbackSnapshot}
                        onDeleteSnapshot={onDeleteSnapshot}
                    />
                )}
            </div>
        </div>
    );
}

interface VersionsPanelProps {
    currentProjectId: string | undefined;
    snapshots: Snapshot[];
    snapshotsLoading: boolean;
    isSnapshotCreating: boolean;
    snapshotActionId: string | null;
    onCreateSnapshot: () => void;
    onRollbackSnapshot: (id: string) => void;
    onDeleteSnapshot: (id: string) => void;
}

function VersionsPanel({
    currentProjectId,
    snapshots,
    snapshotsLoading,
    isSnapshotCreating,
    snapshotActionId,
    onCreateSnapshot,
    onRollbackSnapshot,
    onDeleteSnapshot
}: VersionsPanelProps) {
    return (
        <div className="h-full flex flex-col">
            <div className="p-3 border-b border-zinc-200">
                <Button
                    onClick={onCreateSnapshot}
                    disabled={!currentProjectId || isSnapshotCreating}
                    size="sm"
                    className="w-full h-8 text-xs"
                >
                    {isSnapshotCreating ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <History className="w-3 h-3 mr-1" />}
                    Create Snapshot
                </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {snapshotsLoading ? (
                    <div className="text-xs text-zinc-500">Loading snapshots...</div>
                ) : snapshots.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <div className="text-center py-8">
                            <History className="w-8 h-8 text-zinc-300 mx-auto mb-3" />
                            <p className="text-sm text-zinc-500">No snapshots yet</p>
                            <p className="text-xs text-zinc-400 mt-1">Create one before major edits</p>
                        </div>
                    </div>
                ) : (
                    snapshots.map((snapshot) => {
                        const isBusy = snapshotActionId === snapshot._id;
                        return (
                            <div key={snapshot._id} className="border border-zinc-200 rounded-lg p-2.5 bg-white">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <p className="text-xs font-medium text-zinc-900">
                                            v{snapshot.version} · {snapshot.label}
                                        </p>
                                        <p className="text-[11px] text-zinc-500 mt-0.5">
                                            {snapshot.fileCount} files · {(snapshot.totalSize / 1024).toFixed(1)} KB
                                        </p>
                                    </div>
                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 uppercase">
                                        {snapshot.trigger}
                                    </span>
                                </div>
                                <p className="text-[11px] text-zinc-400 mt-1.5">
                                    {new Date(snapshot.createdAt).toLocaleString()}
                                </p>
                                <div className="mt-2 flex items-center gap-1.5">
                                    <Button
                                        onClick={() => onRollbackSnapshot(snapshot._id)}
                                        disabled={isBusy}
                                        variant="outline"
                                        size="sm"
                                        className="h-6 text-[11px]"
                                    >
                                        {isBusy ? (
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        ) : (
                                            <RotateCcw className="w-3 h-3 mr-1" />
                                        )}
                                        Restore
                                    </Button>
                                    <Button
                                        onClick={() => onDeleteSnapshot(snapshot._id)}
                                        disabled={isBusy}
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 text-[11px] text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
