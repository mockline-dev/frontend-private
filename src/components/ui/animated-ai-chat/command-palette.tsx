'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import type { CommandSuggestion } from './types';

interface CommandPaletteProps {
    suggestions: CommandSuggestion[];
    activeSuggestion: number;
    onSelect: (index: number) => void;
    onClose: () => void;
}

export function CommandPalette({ suggestions, activeSuggestion, onSelect, onClose }: CommandPaletteProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            if (ref.current && !ref.current.contains(target) && !commandButton?.contains(target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <motion.div
            ref={ref}
            className="absolute left-4 right-4 bottom-full mb-2 backdrop-blur-xl bg-black/90 rounded-lg z-50 shadow-lg border border-black/10 overflow-hidden"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.15 }}
        >
            <div className="py-1 bg-black/95">
                {suggestions.map((suggestion, index) => (
                    <motion.div
                        key={suggestion.prefix}
                        className={cn(
                            'flex items-center gap-2 px-3 py-2 text-xs transition-colors cursor-pointer',
                            activeSuggestion === index ? 'bg-black/10 text-black' : 'text-black/70 hover:bg-black/5'
                        )}
                        onClick={() => onSelect(index)}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.03 }}
                    >
                        <div className="w-5 h-5 flex items-center justify-center text-black/60">{suggestion.icon}</div>
                        <div className="font-medium">{suggestion.label}</div>
                        <div className="text-black/40 text-xs ml-1">{suggestion.prefix}</div>
                    </motion.div>
                ))}
            </div>
        </motion.div>
    );
}
