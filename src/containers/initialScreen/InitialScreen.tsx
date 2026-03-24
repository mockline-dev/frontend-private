'use client';

import Header from '@/components/custom/Header';
import ProjectPreparationOverlay from '@/components/custom/ProjectPreparationOverlay';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { useInitialScreen } from '@/hooks/useInitialScreen';
import { useRouter } from 'next/navigation';
import { UserData } from '../auth/types';

interface InitialScreenProps {
    currentUser: UserData | undefined;
}

export function InitialScreen({ currentUser }: InitialScreenProps) {
    const router = useRouter();
    const {
        promptValue,
        setPromptValue,
        enhancedPrompt,
        enhanceLoading,
        handleEnhancePrompt,
        handleSendPrompt,
        creationState,
        isPreprocessing,
        showMorphLoading,
        isMorphing,
        resetState
    } = useInitialScreen({ currentUser });

    return (
        <div>
            <Header currentUser={currentUser ?? null} currentPage="initial" onNavigateClick={() => router.push('/dashboard')} />
            <AnimatedAIChat
                enhancedPrompt={enhancedPrompt}
                value={promptValue}
                setValue={setPromptValue}
                onSendClick={handleSendPrompt}
                onEnhanceClick={handleEnhancePrompt}
                enhanceLoading={enhanceLoading}
                sending={isPreprocessing}
                isMorphing={isMorphing}
            />
            <ProjectPreparationOverlay visible={showMorphLoading} state={creationState} onCancel={resetState} />
        </div>
    );
}
