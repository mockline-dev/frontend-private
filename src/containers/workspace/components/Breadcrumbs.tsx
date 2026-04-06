'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
    path: string | null;
    onNavigate?: (segment: string, index: number) => void;
    className?: string;
}

export function Breadcrumbs({ path, onNavigate, className }: BreadcrumbsProps) {
    if (!path) return null;

    const segments = path.split('/').filter(Boolean);

    return (
        <div className={cn('flex items-center gap-0.5 px-3 py-1.5 bg-zinc-900/80 border-b border-zinc-800/60 font-mono text-xs overflow-x-auto scrollbar-none', className)}>
            {segments.map((segment, index) => {
                const isLast = index === segments.length - 1;
                const partialPath = segments.slice(0, index + 1).join('/');

                return (
                    <span key={partialPath} className="flex items-center gap-0.5 shrink-0">
                        {index > 0 && <ChevronRight className="w-3 h-3 text-zinc-600 shrink-0" />}
                        <button
                            onClick={() => onNavigate?.(partialPath, index)}
                            disabled={isLast}
                            className={cn(
                                'px-0.5 py-0 transition-colors rounded-sm focus:outline-none focus-visible:ring-1 focus-visible:ring-zinc-500',
                                isLast
                                    ? 'text-zinc-100 cursor-default'
                                    : 'text-zinc-500 hover:text-zinc-300 cursor-pointer'
                            )}
                        >
                            {segment}
                        </button>
                    </span>
                );
            })}
        </div>
    );
}
