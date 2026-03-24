'use client';

import { cn } from '@/lib/utils';
import { ProjectCreationState } from '@/hooks/useProjectCreation';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProjectPreparationOverlayProps {
    visible: boolean;
    state: ProjectCreationState;
    onCancel?: () => void;
}

const STAGES = [
    { key: 'analyzing', label: 'Analyzing' },
    { key: 'planning', label: 'Planning' },
    { key: 'generating', label: 'Generating' },
    { key: 'validating', label: 'Validating' },
    { key: 'finalizing', label: 'Finalizing' },
] as const;

function resolveActiveStage(currentStage: string | undefined, percentage: number): number {
    if (currentStage) {
        const normalized = currentStage.toLowerCase().replace(/[_\s-]/g, '');
        const idx = STAGES.findIndex((s) => normalized.startsWith(s.key));
        if (idx >= 0) return idx;
    }
    // Fallback: linear percentage mapping (0-19 → 0, 20-39 → 1, …, 80-100 → 4)
    return Math.min(4, Math.floor(percentage / 20));
}

function formatElapsed(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
}

export default function ProjectPreparationOverlay({ visible, state, onCancel }: ProjectPreparationOverlayProps) {
    // BUG 1 fix: start as false so the 500ms delay actually applies
    const [showLoader, setShowLoader] = useState(false);
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!visible) return;

        let intervalId: ReturnType<typeof setInterval> | undefined;
        let start: number | null = null;

        const timerId = setTimeout(() => {
            setShowLoader(true);
            start = Date.now();
            intervalId = setInterval(() => {
                setElapsed(Math.floor((Date.now() - (start ?? Date.now())) / 1000));
            }, 1000);
        }, 500);

        return () => {
            clearTimeout(timerId);
            if (intervalId !== undefined) clearInterval(intervalId);
            setShowLoader(false);
            setElapsed(0);
        };
    }, [visible]);

    if (!visible || !showLoader) return null;

    const percent = Math.max(0, Math.min(100, Math.round(state.progress?.percentage ?? 0)));
    const activeStage = resolveActiveStage(state.progress?.currentStage, percent);
    const isError = state.status === 'error';

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/80 shadow-2xl p-8 space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xl font-semibold text-black">Building your backend</p>
                        <p className="text-sm text-black/50 mt-0.5">Started {formatElapsed(elapsed)} ago</p>
                    </div>
                    {onCancel && (
                        <button
                            onClick={onCancel}
                            className="p-1.5 rounded-lg hover:bg-black/5 text-black/40 hover:text-black/70 transition-colors"
                            aria-label="Cancel"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {isError ? (
                    /* Error state */
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
                            <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700">{state.error ?? 'Project generation failed. Please try again.'}</p>
                        </div>
                        <div className="flex gap-2">
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="flex-1 px-4 py-2 rounded-lg border border-black/10 text-sm font-medium text-black/70 hover:bg-black/5 transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={onCancel}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-black text-white text-sm font-medium hover:bg-black/80 transition-colors"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Try again
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Normal progress state */
                    <>
                        {/* Stage pipeline */}
                        <div className="flex items-center gap-1">
                            {STAGES.map((stage, idx) => {
                                const isDone = idx < activeStage;
                                const isActive = idx === activeStage;
                                return (
                                    <div key={stage.key} className="flex items-center flex-1 min-w-0">
                                        <div className="flex flex-col items-center gap-1.5 flex-1 min-w-0">
                                            <div
                                                className={cn(
                                                    'w-7 h-7 rounded-full flex items-center justify-center transition-colors',
                                                    isDone && 'bg-black text-white',
                                                    isActive && 'bg-black/10 text-black',
                                                    !isDone && !isActive && 'bg-black/5 text-black/30'
                                                )}
                                            >
                                                {isDone ? (
                                                    <CheckCircle2 className="w-4 h-4" />
                                                ) : isActive ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                ) : (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                )}
                                            </div>
                                            <span
                                                className={cn(
                                                    'text-[10px] font-medium truncate w-full text-center',
                                                    (isDone || isActive) ? 'text-black' : 'text-black/30'
                                                )}
                                            >
                                                {stage.label}
                                            </span>
                                        </div>
                                        {idx < STAGES.length - 1 && (
                                            <div
                                                className={cn(
                                                    'h-px flex-1 mx-1 mb-4 transition-colors',
                                                    isDone ? 'bg-black' : 'bg-black/10'
                                                )}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Shimmer progress bar */}
                        <div className="space-y-1.5">
                            <div className="relative h-2 rounded-full bg-black/8 overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full bg-black transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                />
                                {/* Shimmer sweep */}
                                <div
                                    className="absolute inset-y-0 rounded-full overflow-hidden transition-all duration-500"
                                    style={{ width: `${percent}%` }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-xs text-black/50">
                                <span>{percent}%</span>
                                {state.progress?.currentFile ? (
                                    <span className="truncate max-w-[200px] text-right">{state.progress.currentFile}</span>
                                ) : state.progress && state.progress.totalFiles > 0 ? (
                                    <span>{state.progress.filesGenerated}/{state.progress.totalFiles} files</span>
                                ) : (
                                    <span>Preparing files…</span>
                                )}
                            </div>
                        </div>

                        {/* Current stage label */}
                        {state.progress?.currentStage && (
                            <p className="text-sm text-black/60 text-center">
                                {state.progress.currentStage.replace(/[_-]/g, ' ').replace(/^\w/, (c) => c.toUpperCase())}…
                            </p>
                        )}
                    </>
                )}
            </div>
        </motion.div>
    );
}
