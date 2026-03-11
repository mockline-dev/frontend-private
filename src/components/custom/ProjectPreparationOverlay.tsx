'use client';

import UniqueLoading from '@/components/ui/morph-loading';
import { Progress } from '@/components/ui/progress';
import { ProjectCreationState } from '@/hooks/useProjectCreation';
import { motion } from 'framer-motion';

interface ProjectPreparationOverlayProps {
    visible: boolean;
    state: ProjectCreationState;
}

const toStageLabel = (stage: string | undefined): string => {
    if (!stage) return 'Creating your project...';

    const normalized = stage.replace(/[_-]/g, ' ').trim();
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export default function ProjectPreparationOverlay({ visible, state }: ProjectPreparationOverlayProps) {
    if (!visible) return null;

    const percent = Math.max(0, Math.min(100, Math.round(state.progress?.percentage || 0)));
    const fileProgress = state.progress && state.progress.totalFiles > 0 ? `${state.progress.filesGenerated}/${state.progress.totalFiles} files` : null;

    return (
        <motion.div
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white/80 shadow-2xl p-8 text-center space-y-5">
                <div className="flex justify-center">
                    <UniqueLoading variant="morph" size="lg" className="w-full h-full" />
                </div>

                <div className="space-y-1">
                    <p className="text-xl font-semibold text-black">Building your backend</p>
                    <p className="text-sm text-black/70">{toStageLabel(state.progress?.currentStage)}</p>
                </div>

                <div className="space-y-2">
                    <Progress value={percent} className="h-2" />
                    <div className="flex items-center justify-between text-xs text-black/60">
                        <span>{percent}%</span>
                        <span>{fileProgress || 'Preparing files'}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
