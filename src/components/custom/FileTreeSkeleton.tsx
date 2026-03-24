import { Skeleton } from '@/components/ui/skeleton';

const SKELETON_ROWS = [
    { indent: 0, width: 'w-24' },
    { indent: 1, width: 'w-20' },
    { indent: 2, width: 'w-16' },
    { indent: 2, width: 'w-20' },
    { indent: 1, width: 'w-18' },
    { indent: 0, width: 'w-28' },
    { indent: 1, width: 'w-16' },
    { indent: 1, width: 'w-22' }
];

export function FileTreeSkeleton() {
    return (
        <div className="py-1 space-y-1 px-2">
            {SKELETON_ROWS.map((row, i) => (
                <div key={i} className="flex items-center gap-1.5 py-0.5" style={{ paddingLeft: `${row.indent * 12 + 8}px` }}>
                    <Skeleton className="w-3.5 h-3.5 rounded" />
                    <Skeleton className={`h-3 rounded ${row.width}`} />
                </div>
            ))}
        </div>
    );
}
