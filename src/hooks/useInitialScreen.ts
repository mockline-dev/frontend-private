'use client';

import { enhancePrompt } from '@/api/enhancePrompt/enhancePrompt';
import { inferProjectMeta } from '@/api/inferProjectMeta/inferProjectMeta';
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

type PreparationPhase = 'idle' | 'enhancing' | 'inferring-meta';
type ProjectStackOption = 'fast-api/python' | 'feathers/typescript';

const SAVED_PROMPT_KEY = 'savedPrompt';

export function useInitialScreen(options?: UseInitialScreenOptions) {
    const router = useRouter();
    const [promptValue, setPromptValue] = useState('');
    const [enhancedPrompt, setEnhancedPrompt] = useState('');
    const [enhanceLoading, setEnhanceLoading] = useState(false);
    const [preparationPhase, setPreparationPhase] = useState<PreparationPhase>('idle');
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

    const handleEnhancePrompt = useCallback(
        async (prompt: string) => {
            try {
                setEnhanceLoading(true);
                const [framework, language] = selectedStack.split('/') as ['fast-api' | 'feathers', 'python' | 'typescript'];
                const response = await enhancePrompt({ userPrompt: prompt, framework, language });
                setEnhancedPrompt(response.enhancedPrompt);
            } catch (error) {
                console.error('Error enhancing prompt:', error);
                toast.error('Failed to enhance prompt');
            } finally {
                setEnhanceLoading(false);
            }
        },
        [selectedStack]
    );

    const handleSendPrompt = useCallback(
        async (prompt: string) => {
            const normalizedPrompt = prompt.trim();
            if (!normalizedPrompt || isCreating || preparationPhase !== 'idle') {
                return;
            }

            if (!options?.currentUser) {
                if (typeof window !== 'undefined') {
                    localStorage.setItem(SAVED_PROMPT_KEY, normalizedPrompt);
                    document.cookie = `${SAVED_PROMPT_KEY}=true; path=/; max-age=3600`;
                }
                router.push(appRoutes.auth.login);
                return;
            }

            try {
                setPreparationPhase('inferring-meta');
                const [framework, language] = selectedStack.split('/') as ['fast-api' | 'feathers', 'python' | 'typescript'];

                const response = await enhancePrompt({ userPrompt: normalizedPrompt, framework, language });
                const metadata = await inferProjectMeta({ enhancedPrompt: response.enhancedPrompt });

                setPreparationPhase('idle');
                await createProject({
                    name: metadata.name?.trim() || (normalizedPrompt.length > 60 ? `${normalizedPrompt.slice(0, 57)}...` : normalizedPrompt),
                    description: metadata.description?.trim() || normalizedPrompt,
                    framework,
                    language,
                    model: defaultAiModel
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to create project';
                toast.error(message);
            } finally {
                setPreparationPhase('idle');
            }
        },
        [createProject, isCreating, preparationPhase, selectedStack, options?.currentUser, router]
    );

    useEffect(() => {
        if (enhancedPrompt && enhanceLoading === false) {
            setPromptValue(enhancedPrompt);
        }
    }, [enhancedPrompt, enhanceLoading]);

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
        enhancedPrompt,
        enhanceLoading,
        handleEnhancePrompt,
        handleSendPrompt,
        selectedStack,
        setSelectedStack,
        creationState,
        isCreating,
        preparationPhase,
        isPreprocessing: preparationPhase !== 'idle',
        showMorphLoading: isCreating && preparationPhase === 'idle',
        isMorphing: isCreating && preparationPhase === 'idle'
    };
}
