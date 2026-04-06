'use client';

import { createMessage } from '@/api/messages/createMessage';
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

const SAVED_PROMPT_KEY = 'savedPrompt';

function deriveProjectName(prompt: string): string {
    const trimmed = prompt.trim();
    return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
}

export function useInitialScreen(options?: UseInitialScreenOptions) {
    const router = useRouter();
    const [promptValue, setPromptValue] = useState('');

    const {
        state: creationState,
        createProject,
        isCreating,
        resetState
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
            if (!normalizedPrompt || isCreating) {
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
                // Step 1: Create project with basic metadata derived from prompt
                const project = await createProject({
                    userId: options?.currentUser?.feathersId ?? '',
                    name: deriveProjectName(normalizedPrompt),
                    description: normalizedPrompt,
                    framework: 'fast-api',
                    language: 'python',
                    model: defaultAiModel,
                    status: 'initializing'
                });

                if (!project) return;

                // Step 2: POST first message — triggers backend orchestration pipeline
                await createMessage({
                    projectId: project._id,
                    role: 'user',
                    content: normalizedPrompt
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to create project';
                toast.error(message);
            }
        },
        [createProject, isCreating, options?.currentUser, router]
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
        // Backend now handles enhancement; expose state for UI compatibility
        enhancedPrompt: creationState.enhancedPrompt ?? '',
        enhanceLoading: false,
        handleEnhancePrompt: async () => {},
        handleSendPrompt,
        creationState,
        isCreating,
        resetState,
        isPreprocessing: false,
        showMorphLoading: isCreating,
        isMorphing: isCreating
    };
}
