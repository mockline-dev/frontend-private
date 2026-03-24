'use client';

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command';
import { getFileIcon } from '@/utils/fileIcons';
import type { FileNode } from '@/types/workspace';

interface QuickOpenProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: FileNode[];
    recentFiles: string[];
    onSelect: (path: string) => void;
}

export function QuickOpen({ open, onOpenChange, files, recentFiles, onSelect }: QuickOpenProps) {
    const handleSelect = (path: string) => {
        onSelect(path);
        onOpenChange(false);
    };

    const recentFileNodes = recentFiles
        .map((path) => files.find((f) => f.path === path))
        .filter((f): f is FileNode => f !== undefined);

    const allFiles = files.filter((f) => f.type === 'file');

    return (
        <CommandDialog open={open} onOpenChange={onOpenChange}>
            <CommandInput placeholder="Open file…" />
            <CommandList>
                <CommandEmpty>No files found.</CommandEmpty>

                {recentFileNodes.length > 0 && (
                    <CommandGroup heading="Recent">
                        {recentFileNodes.map((file) => {
                            const Icon = getFileIcon(file.name);
                            return (
                                <CommandItem
                                    key={file.path}
                                    value={file.path}
                                    onSelect={() => handleSelect(file.path)}
                                    className="flex items-center gap-2"
                                >
                                    <Icon className="w-3.5 h-3.5 text-zinc-400" />
                                    <span className="font-medium">{file.name}</span>
                                    <span className="ml-auto text-xs text-zinc-400 truncate max-w-[140px]">{file.path}</span>
                                </CommandItem>
                            );
                        })}
                    </CommandGroup>
                )}

                <CommandGroup heading="All Files">
                    {allFiles.map((file) => {
                        const Icon = getFileIcon(file.name);
                        return (
                            <CommandItem
                                key={file.path}
                                value={file.path}
                                onSelect={() => handleSelect(file.path)}
                                className="flex items-center gap-2"
                            >
                                <Icon className="w-3.5 h-3.5 text-zinc-400" />
                                <span>{file.name}</span>
                                <span className="ml-auto text-xs text-zinc-400 truncate max-w-[140px]">{file.path}</span>
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    );
}
