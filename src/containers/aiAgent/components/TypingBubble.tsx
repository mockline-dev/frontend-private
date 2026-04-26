'use client';

import { Sparkles } from 'lucide-react';

interface TypingBubbleProps {
    pipelineStage: string | null;
    pipelineProgress: number;
}

export function TypingBubble({ pipelineStage, pipelineProgress }: TypingBubbleProps) {
    return (
        <div className="flex gap-2" role="status" aria-live="polite" aria-label="Assistant is composing a response">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2 shadow-xs min-w-[160px]">
                <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.1s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-500 animate-bounce" />
                    {pipelineStage && <span className="text-xs text-gray-600 ml-1">{pipelineStage}</span>}
                </div>
                {pipelineProgress > 0 && (
                    <div className="w-full bg-gray-100 rounded-full h-1 overflow-hidden">
                        <div
                            className="bg-primary h-1 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${pipelineProgress}%` }}
                            role="progressbar"
                            aria-valuenow={pipelineProgress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
