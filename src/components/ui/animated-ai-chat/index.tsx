'use client';

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useState } from 'react';

import Image from 'next/image';
import { Button } from '../button';
import { Spinner } from '../spinner';
import { BackgroundOrbs } from './background-orbs';
import { ChatTextarea } from './chat-textarea';
import { CommandPalette } from './command-palette';
import { COMMAND_SUGGESTIONS } from './constants';
import { HeroSection } from './hero-section';
import { useAutoResizeTextarea } from './hooks/useAutoResizeTextarea';
import { MouseFollower } from './mouse-follower';
import { SendButton } from './send-button';
import { SuggestionChips } from './suggestion-chips';
import { TypingIndicator } from './typing-indicator';

if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
@keyframes ripple {
  0% { transform: scale(0.5); opacity: 0.6; }
  100% { transform: scale(2); opacity: 0; }
}`;
    document.head.appendChild(style);
}

export function AnimatedAIChat({
    enhancedPrompt,
    value,
    setValue,
    onSendClick,
    onEnhanceClick,
    enhanceLoading,
    sending = false,
    isMorphing = false,
    onMorphComplete
}: {
    enhancedPrompt: string;
    value: string;
    setValue: (value: string) => void;
    onSendClick: (value: string) => Promise<void> | void;
    onEnhanceClick: (value: string) => void;
    enhanceLoading: boolean;
    sending?: boolean;
    isMorphing?: boolean;
    onMorphComplete?: () => void;
}) {
    const isTyping = sending;
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [inputFocused, setInputFocused] = useState(false);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 });
    const showCommandPalette = value.startsWith('/') && !value.includes(' ');
    const statusLabel = enhanceLoading ? 'Enhancing prompt' : isTyping ? 'Generating response' : 'Processing';

    const typingPhases = useMemo(() => ['Analyzing prompt...', 'Analyzing requirements...', 'Planning architecture...'], []);

    useEffect(() => {
        if (enhancedPrompt && !enhanceLoading) {
            setValue(enhancedPrompt);
        }
    }, [enhancedPrompt, setValue, enhanceLoading]);

    useEffect(() => {
        adjustHeight(!value);
    }, [value, adjustHeight]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => setMousePosition({ x: e.clientX, y: e.clientY });
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleSendMessage = async () => {
        const normalized = value.trim();
        if (!normalized || isTyping || enhanceLoading) return;

        const savedValue = value;
        setValue('');
        adjustHeight(true);

        try {
            await onSendClick(normalized);
        } catch {
            setValue(savedValue);
            adjustHeight(false);
        }
    };

    const selectCommandSuggestion = (index: number) => {
        const suggestion = COMMAND_SUGGESTIONS[index];
        if (!suggestion) return;
        setValue(suggestion.prefix + ' ');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion((prev) => (prev < COMMAND_SUGGESTIONS.length - 1 ? prev + 1 : 0));
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : COMMAND_SUGGESTIONS.length - 1));
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                if (activeSuggestion >= 0) selectCommandSuggestion(activeSuggestion);
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setValue('');
            }
        } else if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (value.trim()) handleSendMessage();
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] flex flex-col w-full items-center justify-center bg-transparent text-black p-4 sm:p-6 relative overflow-hidden">
            <BackgroundOrbs />
            <div className="w-full max-w-3xl mx-auto relative">
                <motion.div
                    className="relative z-10 space-y-12"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                >
                    <HeroSection />

                    <motion.div
                        className="relative backdrop-blur-2xl bg-black/2 rounded-2xl border border-black/5 shadow-2xl"
                        initial={{ scale: 0.98 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <AnimatePresence>
                            {showCommandPalette && (
                                <CommandPalette
                                    suggestions={COMMAND_SUGGESTIONS}
                                    activeSuggestion={activeSuggestion}
                                    onSelect={selectCommandSuggestion}
                                    onClose={() => setValue('')}
                                />
                            )}
                        </AnimatePresence>

                        <div className="p-4 sm:p-5">
                            <ChatTextarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    if (e.target.value.startsWith('/') && !e.target.value.includes(' ')) {
                                        const matchingIndex = COMMAND_SUGGESTIONS.findIndex((cmd) => cmd.prefix.startsWith(e.target.value));
                                        setActiveSuggestion(matchingIndex >= 0 ? matchingIndex : -1);
                                    }
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => setInputFocused(true)}
                                onBlur={() => setInputFocused(false)}
                                placeholder="Ask mocky a question..."
                                containerClassName="w-full"
                                className={cn(
                                    'w-full px-4 py-3',
                                    'resize-none',
                                    'bg-transparent',
                                    'border-none',
                                    'text-black/90 text-sm sm:text-base',
                                    'focus:outline-none',
                                    'placeholder:text-black/20',
                                    'min-h-15 pr-8 leading-relaxed'
                                )}
                                style={{ overflow: 'hidden' }}
                                showRing={false}
                            />
                        </div>

                        <div className="p-4 sm:p-5 border-black/5 flex items-center justify-end gap-3 sm:gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEnhanceClick(value)}
                                disabled={!value.trim() || isTyping}
                                className={`${!value.trim() && 'hidden'} text-sm font-medium transition-colors hover:bg-black/5 data-[state=open]:bg-black/5 absolute right-4 top-4 h-10 px-3 rounded-lg`}
                            >
                                {enhanceLoading ? <Spinner /> : <Image src="/stick.png" alt="Enhance" width={20} height={20} className="w-5 h-5 text-black/50" />}
                            </Button>
                            <SendButton isTyping={isTyping} onClick={handleSendMessage} disabled={enhanceLoading || isTyping || !value.trim()} />
                        </div>
                    </motion.div>

                    <SuggestionChips suggestions={COMMAND_SUGGESTIONS} onSelect={selectCommandSuggestion} />
                </motion.div>
            </div>

            <TypingIndicator
                key={`${isTyping}-${enhanceLoading}-${statusLabel}`}
                isTyping={isTyping || enhanceLoading}
                label={statusLabel}
                phases={isTyping ? typingPhases : []}
                phaseDuration={2000}
                isMorphing={isMorphing}
                {...(onMorphComplete ? { onMorphComplete } : {})}
            />
            <MouseFollower position={mousePosition} visible={inputFocused} />
        </div>
    );
}
