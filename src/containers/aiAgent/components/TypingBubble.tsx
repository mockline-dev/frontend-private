'use client';

import Image from 'next/image';

interface TypingBubbleProps {
    pipelineStage: string | null;
    pipelineProgress: number;
}

export function TypingBubble({ pipelineStage, pipelineProgress }: TypingBubbleProps) {
    return (
        <div className="flex gap-2 items-start px-1" role="status" aria-live="polite" aria-label="Assistant is composing a response">
            <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center shrink-0 mt-0.5 border border-zinc-200">
                <Image src="/logo.png" alt="Mockline" width={12} height={12} className="rounded-sm" />
            </div>
            <div className="flex flex-col gap-1.5 pt-1">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.1s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
                    </div>
                    {pipelineStage && (
                        <span className="text-[11px] text-zinc-400">{pipelineStage}</span>
                    )}
                </div>
                {pipelineProgress > 0 && (
                    <div className="w-32 bg-zinc-200 rounded-full h-0.5 overflow-hidden">
                        <div
                            className="bg-zinc-500 h-0.5 rounded-full transition-all duration-500 ease-out"
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
