'use client';

import { cn } from '@/lib/utils';
import { METHOD_COLORS } from '../constants';
import type { HttpMethod } from '../types';

interface MethodBadgeProps {
    method: HttpMethod;
    className?: string;
}

export function MethodBadge({ method, className }: MethodBadgeProps) {
    const colors = METHOD_COLORS[method];
    return (
        <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide font-mono uppercase', colors.bg, colors.text, className)}>
            {method}
        </span>
    );
}
