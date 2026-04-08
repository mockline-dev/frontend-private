'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function LoadingState() {
    return (
        <div className="h-full flex overflow-hidden">
            {/* Sidebar skeleton */}
            <div className="w-60 border-r border-zinc-200 p-3 flex flex-col gap-2 shrink-0">
                <Skeleton className="h-7 w-full rounded" />
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-6 w-full rounded" />
                ))}
            </div>
            {/* Main area skeleton */}
            <div className="flex-1 flex flex-col gap-3 p-3">
                <Skeleton className="h-9 w-full rounded" />
                <Skeleton className="h-6 w-48 rounded" />
                <div className="flex-1 flex flex-col gap-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="h-5 w-full rounded" />
                    ))}
                </div>
            </div>
        </div>
    );
}
