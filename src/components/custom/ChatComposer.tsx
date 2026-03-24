'use client';

import { Button } from '@/components/ui/button';
import { useAutoResizeTextarea } from '@/components/ui/animated-ai-chat/hooks/useAutoResizeTextarea';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Send, Square } from 'lucide-react';

interface ChatComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
    isStreaming: boolean;
    onStopGenerating?: () => void;
    placeholder?: string;
    disabled?: boolean;
}

export function ChatComposer({
    value,
    onChange,
    onSubmit,
    isLoading,
    isStreaming,
    onStopGenerating,
    placeholder = 'Ask Mocky...',
    disabled
}: ChatComposerProps) {
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 44, maxHeight: 160 });

    const handleKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            await onSubmit(e as unknown as React.FormEvent);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange(e.target.value);
        adjustHeight();
    };

    const isBusy = isLoading || isStreaming;

    return (
        <form onSubmit={onSubmit} className="border-t border-zinc-200 p-3 bg-white">
            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    rows={1}
                    className="flex-1 bg-white border border-zinc-300 rounded-xl px-3 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                    disabled={disabled || isBusy}
                    style={{ minHeight: 44 }}
                    aria-label="Message Mocky"
                />

                <AnimatePresence mode="wait" initial={false}>
                    {isBusy && onStopGenerating ? (
                        <motion.div
                            key="stop"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                        >
                            <Button
                                type="button"
                                onClick={onStopGenerating}
                                size="icon"
                                className="bg-zinc-900 hover:bg-zinc-700 text-white h-11 w-11 rounded-xl"
                                aria-label="Stop generating"
                            >
                                <Square className="w-4 h-4 fill-current" />
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="send"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.1 }}
                        >
                            <Button
                                type="submit"
                                disabled={!value.trim() || isBusy || disabled}
                                size="icon"
                                className="bg-black hover:bg-zinc-800 text-white h-11 w-11 rounded-xl"
                                aria-label={isBusy ? 'Sending message' : 'Send message'}
                            >
                                {isBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </form>
    );
}
