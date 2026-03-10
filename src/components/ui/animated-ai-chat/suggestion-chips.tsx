'use client';

import { motion } from 'framer-motion';

import type { CommandSuggestion } from './types';

interface SuggestionChipsProps {
    suggestions: CommandSuggestion[];
    onSelect: (index: number) => void;
}

export function SuggestionChips({ suggestions, onSelect }: SuggestionChipsProps) {
    return (
        <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map((suggestion, index) => (
                <motion.button
                    key={suggestion.prefix}
                    onClick={() => onSelect(index)}
                    className="flex items-center gap-2 px-3 py-2 bg-black/[0.02] hover:bg-black/[0.05] rounded-lg text-sm text-black/60 hover:text-black/90 transition-all relative group cursor-pointer"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    {suggestion.icon}
                    <span>{suggestion.label}</span>
                    <motion.div
                        className="absolute inset-0 border border-black/[0.05] rounded-lg"
                        initial={false}
                        animate={{ opacity: [0, 1], scale: [0.98, 1] }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                    />
                </motion.button>
            ))}
        </div>
    );
}
