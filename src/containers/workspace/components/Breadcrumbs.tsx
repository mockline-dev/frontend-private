'use client';

import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { getFileIcon } from '@/utils/fileIcons';

interface BreadcrumbsProps {
    filePath: string | null;
    onSegmentClick?: (partialPath: string) => void;
    className?: string | undefined;
}

export function Breadcrumbs({ filePath, onSegmentClick, className }: BreadcrumbsProps) {
    if (!filePath) return null;

    const segments = filePath.replace(/^\.\//, '').split('/').filter(Boolean);
    if (segments.length === 0) return null;

    const fileName = segments[segments.length - 1] ?? '';
    const FileIcon = getFileIcon(fileName);

    return (
        <div className={cn('flex items-center gap-0.5 text-xs text-zinc-500 min-w-0 overflow-hidden', className)}>
            {segments.map((segment, i) => {
                const isLast = i === segments.length - 1;
                const partialPath = segments.slice(0, i + 1).join('/');

                return (
                    <span key={partialPath} className="flex items-center gap-0.5 min-w-0">
                        {i > 0 && <ChevronRight className="w-3 h-3 shrink-0 text-zinc-300" />}
                        <button
                            onClick={() => onSegmentClick?.(partialPath)}
                            disabled={!onSegmentClick || isLast}
                            className={cn(
                                'flex items-center gap-1 px-1 py-0.5 rounded truncate transition-colors',
                                isLast
                                    ? 'text-zinc-800 font-medium cursor-default'
                                    : 'hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer'
                            )}
                        >
                            {isLast && <FileIcon className="w-3.5 h-3.5 shrink-0 text-zinc-400" />}
                            <span className="truncate">{segment}</span>
                        </button>
                    </span>
                );
            })}
        </div>
    );
}
