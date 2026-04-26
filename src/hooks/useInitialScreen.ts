'use client';

import { createMessage } from '@/api/messages/createMessage';
import { appRoutes } from '@/config/appRoutes';
import { backendUrl } from '@/config/environment';
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
    const [enhanceLoading, setEnhanceLoading] = useState(false);
    const [projectName, setProjectName] = useState('');

    const {
        state: creationState,
        createProject,
        isCreating,
        resetState
    } = useProjectCreation({
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
                const resolvedName = projectName.trim() || deriveProjectName(normalizedPrompt);
                const project = await createProject({
                    userId: options?.currentUser?.feathersId ?? '',
                    name: resolvedName,
                    description: normalizedPrompt,
                    framework: 'fast-api',
                    language: 'python',
                    status: 'initializing'
                });

                if (!project) return;

                router.push(`/workspace?projectId=${project._id}`);

                createMessage({
                    projectId: project._id,
                    role: 'user',
                    content: normalizedPrompt
                }).catch((err) => {
                    console.error('[useInitialScreen] Failed to create message:', err instanceof Error ? err.message : String(err));
                });
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Failed to create project';
                toast.error(message);
            }
        },
        [createProject, isCreating, options?.currentUser, projectName, router]
    );

    const handleEnhancePrompt = useCallback(
        async (prompt: string) => {
            const normalized = prompt.trim();
            if (!normalized || enhanceLoading) return;

            setEnhanceLoading(true);
            try {
                const res = await fetch(`${backendUrl}/enhance-prompt`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(options?.currentUser?.jwt ? { Authorization: `Bearer ${options.currentUser.jwt}` } : {})
                    },
                    body: JSON.stringify({ prompt: normalized, framework: 'fast-api', language: 'python' })
                });
                if (!res.ok) throw new Error('Enhancement failed');
                const data = await res.json() as { enhanced?: string; prompt?: string };
                const enhanced = data.enhanced ?? data.prompt ?? normalized;
                setPromptValue(enhanced);
            } catch {
                toast.error('Failed to enhance prompt');
            } finally {
                setEnhanceLoading(false);
            }
        },
        [enhanceLoading, options?.currentUser?.jwt]
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

    useEffect(() => {
        fetch(`${backendUrl}/generate-name`)
            .then((r) => r.json() as Promise<{ name?: string }>)
            .then((d) => { if (d.name) setProjectName(d.name); })
            .catch(() => {});
    }, []);

    return {
        promptValue,
        setPromptValue,
        projectName,
        setProjectName,
        enhancedPrompt: creationState.enhancedPrompt ?? '',
        enhanceLoading,
        handleEnhancePrompt,
        handleSendPrompt,
        isCreating,
        isPreprocessing: false
    };
}
