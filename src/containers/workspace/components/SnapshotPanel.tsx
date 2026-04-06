'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Snapshot } from '@/types/feathers';
import { Camera, Files, Loader2, RotateCcw } from 'lucide-react';
import { useState } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function relativeTime(ms: number): string {
    const diff = Date.now() - ms;
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'just now';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
}

const triggerConfig = {
    'auto-generation': {
        label: 'generated',
        className: 'bg-zinc-800 text-zinc-400 border-zinc-700'
    },
    'auto-ai-edit': {
        label: 'ai edit',
        className: 'bg-blue-950/60 text-blue-400 border-blue-800/50'
    },
    manual: {
        label: 'manual',
        className: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/50'
    }
} as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface SnapshotPanelProps {
    snapshots: Snapshot[];
    loading: boolean;
    onRollback: (id: string) => Promise<void>;
    onCreateSnapshot: () => Promise<void>;
}

export function SnapshotPanel({ snapshots, loading, onRollback, onCreateSnapshot }: SnapshotPanelProps) {
    const [rollingBack, setRollingBack] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const handleRollback = async (id: string) => {
        setRollingBack(id);
        try {
            await onRollback(id);
        } finally {
            setRollingBack(null);
        }
    };

    const handleCreate = async () => {
        setCreating(true);
        try {
            await onCreateSnapshot();
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="flex flex-col h-full bg-zinc-950">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Camera className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-300 tracking-wide">Snapshots</span>
                    {snapshots.length > 0 && (
                        <span className="text-[10px] text-zinc-600 font-mono">{snapshots.length}</span>
                    )}
                </div>
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCreate}
                    disabled={creating}
                    className="h-6 px-2 text-[10px] font-mono text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-600 transition-all"
                >
                    {creating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <>+ save now</>
                    )}
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="w-4 h-4 animate-spin text-zinc-600" />
                    </div>
                ) : snapshots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 gap-2 px-4">
                        <Camera className="w-6 h-6 text-zinc-700" />
                        <p className="text-xs text-zinc-600 text-center">No snapshots yet</p>
                        <p className="text-[10px] text-zinc-700 text-center">Snapshots are created automatically after generation</p>
                    </div>
                ) : (
                    /* Timeline */
                    <div className="relative py-3">
                        {/* Vertical spine */}
                        <div className="absolute left-[27px] top-0 bottom-0 w-px bg-zinc-800" />

                        <ul className="space-y-0">
                            {snapshots.map((snap, index) => {
                                const trigger = triggerConfig[snap.trigger] ?? triggerConfig['auto-generation'];
                                const isRollingThisBack = rollingBack === snap._id;
                                const isLatest = index === 0;

                                return (
                                    <li key={snap._id} className="relative flex gap-3 px-3 py-2.5 group hover:bg-zinc-900/60 transition-colors">
                                        {/* Node circle */}
                                        <div className="relative z-10 flex items-start pt-0.5 shrink-0">
                                            <div className={cn(
                                                'w-4 h-4 rounded-full border-2 transition-colors',
                                                isLatest
                                                    ? 'bg-zinc-300 border-zinc-300'
                                                    : 'bg-zinc-900 border-zinc-600 group-hover:border-zinc-500'
                                            )} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            {/* Top row */}
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <span className="text-xs font-mono text-zinc-400">v{snap.version}</span>
                                                <span className={cn(
                                                    'inline-flex items-center text-[10px] px-1.5 py-px rounded border font-mono',
                                                    trigger.className
                                                )}>
                                                    {trigger.label}
                                                </span>
                                                {isLatest && (
                                                    <span className="text-[10px] text-zinc-600 font-mono">current</span>
                                                )}
                                            </div>

                                            {/* Label */}
                                            <p className="text-xs text-zinc-300 truncate font-medium mb-1" title={snap.label}>
                                                {snap.label || `Snapshot v${snap.version}`}
                                            </p>

                                            {/* Meta row */}
                                            <div className="flex items-center gap-3 text-[10px] text-zinc-600 font-mono">
                                                <span className="flex items-center gap-1">
                                                    <Files className="w-2.5 h-2.5" />
                                                    {snap.fileCount} files
                                                </span>
                                                <span>{formatBytes(snap.totalSize)}</span>
                                                <span>{relativeTime(snap.createdAt)}</span>
                                            </div>

                                            {/* Rollback button — visible on hover, hidden for latest */}
                                            {!isLatest && (
                                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleRollback(snap._id)}
                                                        disabled={isRollingThisBack || rollingBack !== null}
                                                        className="h-6 px-2 text-[10px] font-mono text-zinc-500 hover:text-amber-300 hover:bg-amber-950/30 border border-zinc-800 hover:border-amber-800/50 transition-all"
                                                    >
                                                        {isRollingThisBack ? (
                                                            <>
                                                                <Loader2 className="w-2.5 h-2.5 mr-1 animate-spin" />
                                                                restoring…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <RotateCcw className="w-2.5 h-2.5 mr-1" />
                                                                restore
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
