'use client';

import { Zap } from 'lucide-react';

interface QuickActionsProps {
    prompts: string[];
    onSelect: (prompt: string) => void;
}

export function QuickActions({ prompts, onSelect }: QuickActionsProps) {
    return (
        <div className="px-3 pb-3 border-t pt-3 border-gray-200 bg-white">
            <p className="text-[10px] text-gray-500 mb-2 uppercase tracking-wide font-medium flex items-center gap-1">
                <Zap className="w-3 h-3" /> Quick actions
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {prompts.map((prompt, index) => (
                    <button
                        key={index}
                        onClick={() => onSelect(prompt)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg border border-gray-200 transition-colors text-left"
                        aria-label={`Use quick action: ${prompt}`}
                    >
                        {prompt}
                    </button>
                ))}
            </div>
        </div>
    );
}
