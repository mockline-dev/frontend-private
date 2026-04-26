'use client';

import { GenerationProgress, Project } from '@/types/feathers';
import { AnimatePresence, motion, Variants, useReducedMotion } from 'framer-motion';
import { Activity, AlertCircle, ArrowLeft, CheckCircle2, Code2, Clock, Cpu, FileCode2, GitBranch, Layers, Loader2, RotateCcw, Terminal, Zap } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

export interface ProjectCreationLoaderProps {
    status: 'idle' | 'creating' | 'generating' | 'ready' | 'error';
    project: Project | null;
    progress: GenerationProgress | null;
    error: string | null;
    onRetry?: () => void;
    onBackToDashboard?: () => void;
    onCancel?: () => void;
    onViewArchitecture?: () => void;
    onViewFiles?: () => void;
}

const STAGES = [
    {
        icon: Cpu,
        label: 'Analyzing prompt',
        key: 'analyzing',
        description: 'Understanding requirements and planning architecture',
    },
    {
        icon: Layers,
        label: 'Planning architecture',
        key: 'planning',
        description: 'Designing system structure and dependencies',
    },
    {
        icon: FileCode2,
        label: 'Generating files',
        key: 'generating',
        description: 'Creating project files and code',
    },
    {
        icon: Code2,
        label: 'Validating code',
        key: 'validating',
        description: 'Checking code quality and consistency',
    },
    {
        icon: Zap,
        label: 'Finalizing project',
        key: 'finalizing',
        description: 'Completing setup and preparing workspace',
    },
];

const CONTEXT_MESSAGES = {
    analyzing: ['Parsing your requirements...', 'Identifying key components...', 'Mapping out dependencies...', 'Understanding project scope...'],
    planning: ['Designing system architecture...', 'Planning data models...', 'Defining API structure...', 'Setting up project structure...'],
    generating: ['Creating configuration files...', 'Generating models and services...', 'Building API endpoints...', 'Writing database schemas...'],
    validating: ['Checking code consistency...', 'Validating imports...', 'Running quality checks...', 'Ensuring best practices...'],
    finalizing: ['Finalizing project setup...', 'Preparing workspace...', 'Optimizing configuration...', 'Almost ready...'],
};

function SkeletonShimmer({ className }: { className?: string }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div className={`relative overflow-hidden bg-muted/30 ${className}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
            {!prefersReducedMotion && (
                <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
                />
            )}
        </motion.div>
    );
}

function FileSkeleton({ index, delay = 0 }: { index: number; delay?: number }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay + index * 0.06, duration: prefersReducedMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-3 px-3 py-2.5 bg-muted/20 border border-border/40 rounded-lg"
        >
            <SkeletonShimmer className="w-8 h-8 rounded-md" />
            <div className="flex-1 space-y-1.5">
                <SkeletonShimmer className="h-2.5 w-3/4 rounded" />
                <SkeletonShimmer className="h-1.5 w-1/2 rounded" />
            </div>
            <SkeletonShimmer className="w-6 h-6 rounded" />
        </motion.div>
    );
}

function ContextMessage({ stage }: { stage: string }) {
    const [messageIndex, setMessageIndex] = useState(0);
    const prefersReducedMotion = useReducedMotion();
    const messages = CONTEXT_MESSAGES[stage as keyof typeof CONTEXT_MESSAGES] || ['Processing...'];

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % messages.length);
        }, 2500);
        return () => clearInterval(interval);
    }, [messages]);

    return (
        <AnimatePresence mode="wait">
            <motion.span
                key={messageIndex}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
                className="inline-block text-[11px] text-muted-foreground font-medium"
            >
                {messages[messageIndex]}
            </motion.span>
        </AnimatePresence>
    );
}

function StaggeredChildren({ children, delay = 0.05 }: { children: React.ReactNode; delay?: number }) {
    const prefersReducedMotion = useReducedMotion();

    return (
        <>
            {React.Children.map(children, (child, i) => (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * delay, duration: prefersReducedMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                >
                    {child}
                </motion.div>
            ))}
        </>
    );
}

const BACKEND_STAGE_TO_UI: Record<string, number> = {
    classifying: 0,
    enhancing: 0,
    orchestrating: 0,
    retrieving: 1,
    generating: 2,
    validating: 3,
    fixing: 3,
    persisting: 4,
    complete: 4,
};

export function ProjectCreationLoader({ status, project, progress, error, onRetry, onBackToDashboard, onCancel, onViewArchitecture, onViewFiles }: ProjectCreationLoaderProps) {
    const isActive = status === 'creating' || status === 'generating';
    const isError = status === 'error';
    const isReady = status === 'ready';
    const percentage = Math.min(100, Math.round(progress?.percentage || 0));
    const prefersReducedMotion = useReducedMotion();
    const [showErrorDetails, setShowErrorDetails] = useState(false);
    const [elapsedSecs, setElapsedSecs] = useState(0);
    const startedAtRef = useRef<number | null>(null);

    useEffect(() => {
        if (!isActive) {
            startedAtRef.current = null;
            return;
        }
        if (!startedAtRef.current) startedAtRef.current = Date.now();
        const id = setInterval(() => {
            if (startedAtRef.current) setElapsedSecs(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }, 1000);
        return () => clearInterval(id);
    }, [isActive]);

    const activeStageIndex = progress?.currentStage ? (BACKEND_STAGE_TO_UI[progress.currentStage] ?? 0) : 0;
    const currentStage = STAGES[activeStageIndex] ?? STAGES[0];

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { duration: prefersReducedMotion ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] },
        },
    };

    return (
        <div className="flex items-center justify-center h-screen bg-background p-4">
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="w-full max-w-lg">
                <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-5 h-5 rounded bg-primary/15 border border-primary/25 flex items-center justify-center">
                                        <Image alt='' src='/logo.png' width={20} height={20} className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-[10px] font-medium text-primary tracking-widest uppercase">Mockline AI</span>
                                </div>
                                <h1 className="text-[20px] font-semibold text-foreground tracking-tight">
                                    {isError ? 'Build failed' : isReady ? 'Ready to code' : 'Building your project'}
                                </h1>
                                {project?.name && <p className="text-[12px] text-muted-foreground mt-1 font-mono truncate max-w-[340px]">{project.name}</p>}
                            </div>

                            <div
                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-medium ${
                                    isError
                                        ? 'bg-destructive/8 border-destructive/20 text-destructive'
                                        : isReady
                                          ? 'bg-green-500/8 border-green-500/15 text-green-500'
                                          : 'bg-primary/8 border-primary/20 text-primary'
                                }`}
                            >
                                {isActive && !prefersReducedMotion && (
                                    <motion.span className="w-1.5 h-1.5 rounded-full bg-primary" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1, repeat: Infinity }} />
                                )}
                                {isError && <AlertCircle className="w-3 h-3" />}
                                {isReady && <CheckCircle2 className="w-3 h-3" />}
                                {isActive ? 'Running' : isError ? 'Error' : isReady ? 'Complete' : 'Starting'}
                            </div>
                        </div>

                        {!isError && (
                            <div className="mb-5">
                                {isActive && (
                                    <div className="mb-3 min-h-[24px]">
                                        <ContextMessage stage={currentStage?.key ?? 'analyzing'} />
                                    </div>
                                )}

                                <div className="h-[3px] bg-muted rounded-full overflow-hidden mb-3">
                                    <motion.div
                                        className={`h-full rounded-full ${isReady ? 'bg-green-500' : 'bg-primary'}`}
                                        initial={{ width: '0%' }}
                                        animate={{ width: `${percentage}%` }}
                                        transition={{ duration: prefersReducedMotion ? 0 : 0.7, ease: 'easeOut' }}
                                    />
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    {isActive && elapsedSecs > 0 && (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            <span>{elapsedSecs >= 60 ? `${Math.floor(elapsedSecs / 60)}m ${elapsedSecs % 60}s` : `${elapsedSecs}s`}</span>
                                        </motion.div>
                                    )}
                                    {progress?.filesGenerated ? (
                                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                            <FileCode2 className="w-3 h-3" />
                                            <span>
                                                {progress.filesGenerated} file{progress.filesGenerated !== 1 ? 's' : ''}
                                            </span>
                                        </motion.div>
                                    ) : (
                                        <span />
                                    )}
                                    <span className="text-[11px] font-mono font-semibold text-muted-foreground">{percentage}%</span>
                                </div>
                            </div>
                        )}

                        {!isError && (
                            <div className="space-y-1.5 mb-5">
                                <StaggeredChildren delay={0.05}>
                                    {STAGES.map((stage, i) => {
                                        const StageIcon = stage.icon;
                                        const isDone = isReady || i < activeStageIndex;
                                        const isCurrentStage = !isReady && i === activeStageIndex && isActive;
                                        const isPending = !isReady && i > activeStageIndex;

                                        return (
                                            <div
                                                key={stage.key}
                                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 ${
                                                    isCurrentStage ? 'bg-primary/8 border border-primary/20' : isDone ? 'bg-muted/10' : isPending ? 'opacity-40' : ''
                                                }`}
                                            >
                                                <div
                                                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                                        isDone
                                                            ? 'bg-green-500/15 border border-green-500/20'
                                                            : isCurrentStage
                                                              ? 'bg-primary/15 border border-primary/20'
                                                              : 'bg-muted/30 border border-border'
                                                    }`}
                                                >
                                                    {isDone ? (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 12 }}>
                                                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                                                        </motion.div>
                                                    ) : isCurrentStage ? (
                                                        <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                                    ) : (
                                                        <StageIcon className="w-4 h-4 text-muted-foreground/50" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span
                                                        className={`text-[12px] font-medium transition-colors duration-300 ${
                                                            isDone ? 'text-muted-foreground' : isCurrentStage ? 'text-foreground' : 'text-muted-foreground/50'
                                                        }`}
                                                    >
                                                        {stage.label}
                                                    </span>
                                                    {isCurrentStage && (
                                                        <p className="text-[10px] text-muted-foreground/70 mt-0.5 break-all line-clamp-2">
                                                            {stage.key === 'generating' && progress?.currentFile ? progress.currentFile : stage.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </StaggeredChildren>
                            </div>
                        )}

                        {isActive && (currentStage?.key === 'generating' || currentStage?.key === 'validating') && (
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                                    <span className="text-[11px] text-muted-foreground font-medium">
                                        {progress?.filesGenerated ? `${progress.filesGenerated} file${progress.filesGenerated !== 1 ? 's' : ''} generated` : 'Generating files...'}
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    {[0, 1, 2].map((i) => (
                                        <FileSkeleton key={i} index={i} />
                                    ))}
                                </div>
                                {progress?.currentStage && (
                                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-muted-foreground/60 font-mono mt-2 truncate flex items-center gap-1.5">
                                        <Activity className="w-3 h-3" />
                                        {progress.currentStage.replace(/_/g, ' ')}
                                    </motion.p>
                                )}
                            </div>
                        )}

                        {isError && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, scale: 0.99 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.25 }}
                                className="bg-destructive/8 border border-destructive/20 rounded-xl overflow-hidden mb-5"
                            >
                                <div className="p-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                                        <div className="flex-1">
                                            <p className="text-[13px] text-destructive font-semibold mb-1">Build error</p>
                                            <p className="text-[11px] text-destructive/75 leading-relaxed">{error || 'An unexpected error occurred. Please try again.'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-destructive/10">
                                    <button
                                        onClick={() => setShowErrorDetails((prev) => !prev)}
                                        className="w-full px-4 py-2.5 flex items-center justify-between text-[11px] text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            View error details
                                        </span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                    {showErrorDetails && (
                                        <div className="px-4 pb-4 space-y-2.5">
                                            <div className="bg-destructive/5 rounded-lg p-3">
                                                <p className="text-[10px] text-destructive/60 font-medium mb-1">Error Message</p>
                                                <p className="text-[11px] text-destructive font-mono leading-relaxed">{error || 'Unknown error'}</p>
                                            </div>
                                            <div className="bg-destructive/5 rounded-lg p-3">
                                                <p className="text-[10px] text-destructive/60 font-medium mb-2">Suggested Solutions</p>
                                                <ul className="space-y-1.5">
                                                    <li className="text-[11px] text-destructive/80 flex items-start gap-2">
                                                        <span className="text-destructive mt-0.5">•</span>
                                                        <span>Try simplifying your prompt or breaking it into smaller tasks</span>
                                                    </li>
                                                    <li className="text-[11px] text-destructive/80 flex items-start gap-2">
                                                        <span className="text-destructive mt-0.5">•</span>
                                                        <span>Check if you have sufficient API credits or quota</span>
                                                    </li>
                                                    <li className="text-[11px] text-destructive/80 flex items-start gap-2">
                                                        <span className="text-destructive mt-0.5">•</span>
                                                        <span>Try again in a few moments if the service is busy</span>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}

                        {isReady && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 180, damping: 15 }}
                                className="bg-green-500/8 border border-green-500/15 rounded-xl p-4 mb-5 flex items-center gap-3"
                            >
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 180, damping: 12, delay: 0.08 }}>
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                </motion.div>
                                <div>
                                    <p className="text-[12px] text-green-600 font-medium">Project ready</p>
                                    <p className="text-[11px] text-green-600/60">Loading workspace...</p>
                                </div>
                            </motion.div>
                        )}

                        {(isError || isActive) && (
                            <div className="flex items-center gap-2">
                                {isError && onRetry && (
                                    <motion.button
                                        onClick={onRetry}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[12px] font-medium transition-colors"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        Retry
                                    </motion.button>
                                )}
                                {onBackToDashboard && (
                                    <motion.button
                                        onClick={onBackToDashboard}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-[12px] font-medium transition-colors border border-border"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Dashboard
                                    </motion.button>
                                )}
                                {isActive && onCancel && (
                                    <motion.button
                                        onClick={onCancel}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="h-9 px-4 rounded-lg text-muted-foreground/60 hover:text-muted-foreground text-[12px] transition-colors"
                                    >
                                        Cancel
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {isReady && (
                            <div className="flex items-center gap-2">
                                {onViewArchitecture && (
                                    <motion.button
                                        onClick={onViewArchitecture}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground text-[12px] font-medium transition-colors border border-border"
                                    >
                                        <GitBranch className="w-3.5 h-3.5" />
                                        Architecture
                                    </motion.button>
                                )}
                                {onViewFiles && (
                                    <motion.button
                                        onClick={onViewFiles}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-[12px] font-medium transition-colors"
                                    >
                                        <Code2 className="w-3.5 h-3.5" />
                                        View Files
                                    </motion.button>
                                )}
                            </div>
                        )}

                        {isActive && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="text-[10px] text-muted-foreground/50 text-center mt-4">
                                This usually takes 30–90 seconds depending on project complexity
                            </motion.p>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
