'use client';

import { Input } from '@/components/ui/input';
import { FilePlus, FolderPlus, Search } from 'lucide-react';

interface FileTreeHeaderProps {
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onNewFile: () => void;
    onNewFolder: () => void;
}

export function FileTreeHeader({ searchQuery, onSearchChange, onNewFile, onNewFolder }: FileTreeHeaderProps) {
    return (
        <div className="px-2 py-1.5 border-b border-zinc-200 flex items-center gap-1">
            <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
                <Input
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Filter files…"
                    className="h-7 pl-6 text-xs border-zinc-200 bg-white focus-visible:ring-1 focus-visible:ring-violet-400"
                    aria-label="Filter files"
                />
            </div>
            <button
                onClick={onNewFile}
                className="p-1 rounded hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-900"
                title="New File"
                aria-label="New file"
            >
                <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button
                onClick={onNewFolder}
                className="p-1 rounded hover:bg-zinc-100 transition-colors text-zinc-500 hover:text-zinc-900"
                title="New Folder"
                aria-label="New folder"
            >
                <FolderPlus className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
