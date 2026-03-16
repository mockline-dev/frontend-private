'use client';

import UniqueLoading from '@/components/ui/morph-loading';
import { Progress } from '@/components/ui/progress';
import { ProjectCreationState } from '@/hooks/useProjectCreation';
import { GenerationProgress } from '@/types/feathers';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Clock, FileText, Loader2, X, XCircle } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface ProjectPreparationOverlayProps {
    visible: boolean;
    state: ProjectCreationState;
    onCancel?: () => void;
}

interface StageConfig {
    label: string;
    description: string;
    icon: React.ReactNode;
}

const STAGE_CONFIGS: Record<string, StageConfig> = {
    initializing: {
        label: 'Initializing',
        description: 'Setting up your project environment',
        icon: <Loader2 className="w-5 h-5 animate-spin" />
    },
    generating: {
        label: 'Generating',
        description: 'Creating files and components',
        icon: <FileText className="w-5 h-5" />
    },
    validating: {
        label: 'Validating',
        description: 'Verifying generated code',
        icon: <CheckCircle2 className="w-5 h-5" />
    },
    ready: {
        label: 'Ready',
        description: 'Your project is ready to use',
        icon: <CheckCircle2 className="w-5 h-5" />
    },
    error: {
        label: 'Error',
        description: 'Something went wrong',
        icon: <XCircle className="w-5 h-5" />
    }
};

const formatStageLabel = (stage: string | undefined): string => {
    if (!stage) return 'Creating your project...';
    const config = STAGE_CONFIGS[stage];
    if (config) return config.label;

    const normalized = stage.replace(/[_-]/g, ' ').trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatTimeRemaining = (milliseconds: number): string => {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m`;
};

const calculateEstimatedTime = (progress: GenerationProgress | null, startTime: number | undefined): number | null => {
    if (!progress || !startTime || progress.percentage === 0) {
        return null;
    }

    const elapsed = Date.now() - startTime;
    const percentage = progress.percentage;
    const estimatedTotal = (elapsed / percentage) * 100;
    const remaining = estimatedTotal - elapsed;

    return Math.max(0, remaining);
};

export default function ProjectPreparationOverlay({ visible, state, onCancel }: ProjectPreparationOverlayProps) {
    const [showLoader, setShowLoader] = useState(false);
    const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { progress, status, error } = state;

    // Handle visibility delay for smooth animation
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(() => {
                setShowLoader(true);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [visible]);

    // Calculate and update estimated time remaining
    useEffect(() => {
        const shouldUpdate = visible && progress && progress.startedAt && status !== 'ready' && status !== 'error';

        if (!shouldUpdate) {
            // Use setTimeout to avoid synchronous setState in effect
            setTimeout(() => setEstimatedTime(null), 0);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Initial update
        setTimeout(() => setEstimatedTime(calculateEstimatedTime(progress, progress.startedAt)), 0);

        // Update every second
        intervalRef.current = setInterval(() => {
            setEstimatedTime(calculateEstimatedTime(progress, progress.startedAt));
        }, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [visible, progress, status]);

    // Memoize computed values
    const percent = useMemo(() => Math.max(0, Math.min(100, Math.round(progress?.percentage || 0))), [progress?.percentage]);

    const fileProgress = useMemo(() => {
        if (progress && progress.totalFiles > 0) {
            return `${progress.filesGenerated}/${progress.totalFiles} files`;
        }
        return null;
    }, [progress]);

    const currentStageConfig = useMemo(() => {
        const stage = progress?.currentStage || status;
        return STAGE_CONFIGS[stage] || STAGE_CONFIGS.initializing;
    }, [progress?.currentStage, status]);

    const isComplete = status === 'ready';
    const isError = status === 'error';
    const isLoading = status === 'creating' || status === 'generating';

    // Handle cancel action
    const handleCancel = useCallback(() => {
        if (onCancel && !isComplete && !isError) {
            onCancel();
        }
    }, [onCancel, isComplete, isError]);

    if (!visible || !showLoader) return null;

    return (
        <AnimatePresence mode="wait">
            <motion.div
                className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex items-center justify-center p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
            >
                <motion.div
                    className="w-full max-w-lg rounded-3xl border border-black/10 bg-white/90 shadow-2xl p-8 text-center"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    {/* Cancel Button */}
                    {onCancel && !isComplete && !isError && (
                        <motion.button
                            onClick={handleCancel}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/5 transition-colors"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label="Cancel project creation"
                        >
                            <X className="w-5 h-5 text-black/60" />
                        </motion.button>
                    )}

                    {/* Loading Animation */}
                    <motion.div
                        className="flex justify-center mb-6"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    >
                        <div className="relative">
                            {isComplete ? (
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                    className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center"
                                >
                                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                                </motion.div>
                            ) : isError ? (
                                <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                    className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center"
                                >
                                    <XCircle className="w-12 h-12 text-red-600" />
                                </motion.div>
                            ) : (
                                <UniqueLoading variant="morph" size="lg" className="w-full h-full" />
                            )}
                        </div>
                    </motion.div>

                    {/* Status Text */}
                    <motion.div className="space-y-2 mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
                        <h2 className="text-2xl font-bold text-black">{isComplete ? 'Project Ready!' : isError ? 'Generation Failed' : 'Building Your Project'}</h2>
                        <div className="flex items-center justify-center gap-2 text-sm text-black/70">
                            {currentStageConfig?.icon}
                            <span>{currentStageConfig?.description}</span>
                        </div>
                        {progress?.currentFile && !isComplete && !isError && (
                            <motion.p className="text-xs text-black/50 mt-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                Currently: {progress.currentFile}
                            </motion.p>
                        )}
                    </motion.div>

                    {/* Progress Bar */}
                    {!isComplete && !isError && (
                        <motion.div className="space-y-3 mb-6" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                            <Progress value={percent} className="h-3" />
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-black">{percent}%</span>
                                <span className="text-black/70">{fileProgress || 'Initializing...'}</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Estimated Time */}
                    {estimatedTime !== null && !isComplete && !isError && (
                        <motion.div
                            className="flex items-center justify-center gap-2 text-sm text-black/60 mb-4"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <Clock className="w-4 h-4" />
                            <span>~{formatTimeRemaining(estimatedTime)} remaining</span>
                        </motion.div>
                    )}

                    {/* Error Message */}
                    {isError && error && (
                        <motion.div
                            className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-left"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <p className="text-sm text-red-800 font-medium mb-1">Error Details</p>
                            <p className="text-xs text-red-700">{error}</p>
                        </motion.div>
                    )}

                    {/* Success Message */}
                    {isComplete && (
                        <motion.div
                            className="mt-4 p-4 rounded-xl bg-green-50 border border-green-200"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <p className="text-sm text-green-800">Your project has been successfully created and is ready to use!</p>
                        </motion.div>
                    )}

                    {/* Stage Progress Indicators */}
                    {isLoading && progress && (
                        <motion.div className="mt-6 pt-6 border-t border-black/10" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                            <div className="flex justify-center gap-2">
                                {['initializing', 'generating', 'validating'].map((stage, index) => {
                                    const isActive = progress.currentStage === stage;
                                    const isPast = index < ['initializing', 'generating', 'validating'].indexOf(progress.currentStage || '');

                                    return (
                                        <motion.div
                                            key={stage}
                                            className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-black' : isPast ? 'bg-black/40' : 'bg-black/20'}`}
                                            animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                                            transition={{ duration: 1, repeat: Infinity }}
                                        />
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
