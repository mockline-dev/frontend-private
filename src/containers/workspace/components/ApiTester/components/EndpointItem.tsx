'use client';

import { cn } from '@/lib/utils';
import { MethodBadge } from './MethodBadge';
import type { EndpointDefinition } from '../types';

interface EndpointItemProps {
    endpoint: EndpointDefinition;
    isSelected: boolean;
    onClick: () => void;
}

export function EndpointItem({ endpoint, isSelected, onClick }: EndpointItemProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-zinc-100 transition-colors',
                isSelected && 'bg-zinc-100'
            )}
        >
            <MethodBadge method={endpoint.method} className="shrink-0 w-14 justify-center" />
            <span className="text-xs font-mono text-zinc-700 truncate flex-1">{endpoint.path}</span>
        </button>
    );
}
