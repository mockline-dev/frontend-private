'use client';

import { appRoutes } from '@/config/appRoutes';
import { defaultAiModel } from '@/config/environment';
import { UserData } from '@/containers/auth/types';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UseInitialScreenOptions {
    onProjectCreated?: (projectId: string) => void;
    currentUser: UserData | undefined;
}

type ProjectStackOption = 'fast-api/python' | 'feathers/typescript';

const SAVED_PROMPT_KEY = 'savedPrompt';

/**
 * Derives a project name from the prompt — short heuristic, no API call needed.
 * Backend handles prompt enhancement internally via orchestration pipeline.
 */
function deriveProjectName(prompt: string): string {
    const trimmed = prompt.trim();
    return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

export function useInitialScreen(options?: UseInitialScreenOptions) {
    const router = useRouter();
    const [promptValue, setPromptValue] = useState('');
    const [selectedStack, setSelectedStack] = useState<ProjectStackOption>('fast-api/python');

    const {
        state: creationState,
        createProject,
        isCreating
    } = useProjectCreation({
        onSuccess: (project) => {
            options?.onProjectCreated?.(project._id);
            router.push(`/workspace?projectId=${project._id}`);
        },
        onError: (error) => {
            toast.error(error);
        }
    });

    const handleSendPrompt = useCallback(
        async (prompt: string) => {
            const normalizedPrompt = prompt.trim();
            if (!normalizedPrompt || isCreating) return;

            if (!options?.currentUser) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(SAVED_PROMPT_KEY, normalizedPrompt);
                    document.cookie = `${SAVED_PROMPT_KEY}=true; path=/; max-age=3600`;
                }
                router.push(appRoutes.auth.login);
                return;
            }

            const [framework, language] = selectedStack.split('/') as ['fast-api' | 'feathers', 'python' | 'typescript'];

            try {
                await createProject({
                    name: deriveProjectName(normalizedPrompt),
                    description: normalizedPrompt,
                    framework,
                    language,
                    model: defaultAiModel
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to create project';
                toast.error(message);
            }
        },
        [createProject, isCreating, selectedStack, options?.currentUser, router]
    );

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const savedPrompt = localStorage.getItem(SAVED_PROMPT_KEY);
        if (savedPrompt && options?.currentUser) {
            setPromptValue(savedPrompt);
            localStorage.removeItem(SAVED_PROMPT_KEY);
            document.cookie = `${SAVED_PROMPT_KEY}=; path=/; max-age=0`;
        }
    }, [options?.currentUser]);

    return {
        promptValue,
        setPromptValue,
        // Kept for UI backward compatibility — enhancement now handled server-side
        enhancedPrompt: '',
        enhanceLoading: false,
        handleEnhancePrompt: async () => {},
        handleSendPrompt,
        selectedStack,
        setSelectedStack,
        creationState,
        isCreating,
        // UI compat aliases
        preparationPhase: 'idle' as const,
        isPreprocessing: false,
        showMorphLoading: isCreating,
        isMorphing: isCreating
    };
}

