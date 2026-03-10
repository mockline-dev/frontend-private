'use client';

import { enhancePrompt } from '@/api/enhancePrompt/enhancePrompt';
import { defaultAiModel } from '@/config/environment';
import { useProjectCreation } from '@/hooks/useProjectCreation';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface UseInitialScreenOptions {
    onProjectCreated?: (projectId: string) => void;
}

export function useInitialScreen(options?: UseInitialScreenOptions) {
    const router = useRouter();
    const [promptValue, setPromptValue] = useState('');
    const [enhancedPrompt, setEnhancedPrompt] = useState('');
    const [enhanceLoading, setEnhanceLoading] = useState(false);

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

    const handleEnhancePrompt = useCallback(async (prompt: string) => {
        try {
            setEnhanceLoading(true);
            const response = await enhancePrompt({ userPrompt: prompt });
            setEnhancedPrompt(response.enhancedPrompt);
        } catch (error) {
            console.error('Error enhancing prompt:', error);
            toast.error('Failed to enhance prompt');
        } finally {
            setEnhanceLoading(false);
        }
    }, []);

    const handleSendPrompt = useCallback(
        async (prompt: string) => {
            const normalizedPrompt = prompt.trim();
            if (!normalizedPrompt || isCreating) {
                return;
            }

            await createProject({
                name: normalizedPrompt.length > 60 ? `${normalizedPrompt.slice(0, 57)}...` : normalizedPrompt,
                description: normalizedPrompt,
                framework: 'fast-api',
                language: 'python',
                model: defaultAiModel
            });
        },
        [createProject, isCreating]
    );

    useEffect(() => {
        if (enhancedPrompt) {
            setPromptValue(enhancedPrompt);
        }
    }, [enhancedPrompt]);

    return {
        promptValue,
        setPromptValue,
        enhancedPrompt,
        enhanceLoading,
        handleEnhancePrompt,
        handleSendPrompt,
        creationState,
        isCreating
    };
}
