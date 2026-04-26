'use client';

import type { MessageMetadata } from '@/types/feathers';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

type FileDiffData = NonNullable<MessageMetadata['fileDiffs']>[number];

function diffStats(diff: FileDiffData): { added: number; removed: number } {
    let added = 0, removed = 0;
    for (const hunk of diff.hunks) {
        for (const line of hunk.lines) {
            if (line.type === 'add') added++;
            else if (line.type === 'remove') removed++;
        }
    }
    return { added, removed };
}

interface FileDiffProps {
    diff: FileDiffData;
}

export function FileDiff({ diff }: FileDiffProps) {
    const [expanded, setExpanded] = useState(false);
    const parts = diff.path.split('/');
    const basename = parts[parts.length - 1] ?? diff.path;
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';
    const { added, removed } = diffStats(diff);

    return (
        <div className="border border-gray-100 rounded-lg overflow-hidden text-[11px]">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center gap-2 px-2 py-1.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
            >
                <span className="font-mono flex-1 truncate">
                    <span className="text-muted-foreground/60">{dir}</span>
                    <span className="font-semibold text-gray-800">{basename}</span>
                </span>
                {(added > 0 || removed > 0) && (
                    <span className="flex items-center gap-1 shrink-0">
                        {added > 0 && <span className="text-green-600 font-medium">+{added}</span>}
                        {removed > 0 && <span className="text-red-500 font-medium">-{removed}</span>}
                    </span>
                )}
                {expanded ? <ChevronUp className="w-3 h-3 text-gray-400 shrink-0" /> : <ChevronDown className="w-3 h-3 text-gray-400 shrink-0" />}
            </button>

            {expanded && diff.hunks.length > 0 && (
                <div className="max-h-48 overflow-y-auto font-mono text-[11px] divide-y divide-gray-100">
                    {diff.hunks.map((hunk, hi) => (
                        <div key={hi}>
                            {hunk.lines.map((line, li) => (
                                <div
                                    key={li}
                                    className={
                                        line.type === 'add'
                                            ? 'bg-green-50 text-green-800 px-2 py-px'
                                            : line.type === 'remove'
                                            ? 'bg-red-50 text-red-800 px-2 py-px'
                                            : 'text-gray-400 px-2 py-px'
                                    }
                                >
                                    <span className="select-none mr-1.5 opacity-60">
                                        {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                                    </span>
                                    {line.text}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
