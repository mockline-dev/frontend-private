'use client';

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { Braces, Code2, FileCode2, FileText } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileIcon(path: string) {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
        case 'py':
            return { icon: Code2, color: 'text-sky-400' };
        case 'ts':
        case 'tsx':
            return { icon: Code2, color: 'text-blue-400' };
        case 'js':
        case 'jsx':
            return { icon: Code2, color: 'text-yellow-400' };
        case 'json':
            return { icon: Braces, color: 'text-amber-400' };
        case 'yaml':
        case 'yml':
            return { icon: FileCode2, color: 'text-orange-400' };
        case 'md':
            return { icon: FileText, color: 'text-zinc-400' };
        default:
            return { icon: FileText, color: 'text-zinc-500' };
    }
}

function highlightMatch(text: string, query: string): React.ReactNode {
    if (!query.trim()) return text;
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    const idx = lower.indexOf(q);
    if (idx === -1) return text;
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-transparent text-zinc-200 font-semibold">{text.slice(idx, idx + q.length)}</mark>
            {text.slice(idx + q.length)}
        </>
    );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface FileEntry {
    name: string;
    path: string;
}

interface CommandPaletteProps {
    files: FileEntry[];
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
}

export function CommandPalette({ files, isOpen, onClose, onSelect }: CommandPaletteProps) {
    const [query, setQuery] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    // Reset query when opened
    useEffect(() => {
        if (isOpen) setQuery('');
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Close on backdrop click
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSelect = (path: string) => {
        onSelect(path);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />

            {/* Palette */}
            <div
                ref={containerRef}
                className={cn(
                    'relative z-10 w-full max-w-[560px] mx-4',
                    'bg-zinc-900 border border-zinc-700/80 rounded-lg',
                    'shadow-2xl shadow-black/70',
                    'overflow-hidden'
                )}
                style={{ fontFamily: 'ui-monospace, "Cascadia Code", "JetBrains Mono", "Fira Code", monospace' }}
            >
                {/* Header label */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <span className="text-[10px] font-medium text-zinc-600 uppercase tracking-widest">Go to file</span>
                    <kbd className="text-[10px] text-zinc-600 border border-zinc-700 rounded px-1.5 py-0.5">esc</kbd>
                </div>

                <Command
                    className="bg-transparent"
                    shouldFilter={false}
                >
                    <div className="px-3 pb-2">
                        <CommandInput
                            value={query}
                            onValueChange={setQuery}
                            placeholder="Type a file name…"
                            className={cn(
                                'h-9 bg-zinc-800/60 border border-zinc-700 rounded-md',
                                'text-xs text-zinc-100 placeholder:text-zinc-600',
                                'focus:outline-none focus:ring-1 focus:ring-zinc-500',
                                'font-mono'
                            )}
                        />
                    </div>

                    <CommandList className="max-h-[340px] overflow-y-auto pb-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700">
                        <CommandEmpty className="py-6 text-center text-xs text-zinc-600 font-mono">
                            No files match &ldquo;{query}&rdquo;
                        </CommandEmpty>

                        <CommandGroup>
                            {files
                                .filter((f) =>
                                    !query.trim() ||
                                    f.path.toLowerCase().includes(query.toLowerCase()) ||
                                    f.name.toLowerCase().includes(query.toLowerCase())
                                )
                                .slice(0, 50)
                                .map((file) => {
                                    const { icon: Icon, color } = getFileIcon(file.path);
                                    return (
                                        <CommandItem
                                            key={file.path}
                                            value={file.path}
                                            onSelect={() => handleSelect(file.path)}
                                            className={cn(
                                                'flex items-center gap-3 px-4 py-2 mx-1 rounded-md cursor-pointer',
                                                'text-zinc-400 hover:text-zinc-100',
                                                'data-[selected=true]:bg-zinc-800 data-[selected=true]:text-zinc-100',
                                                'transition-colors duration-75'
                                            )}
                                        >
                                            <Icon className={cn('w-3.5 h-3.5 shrink-0', color)} />
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-xs text-zinc-200">
                                                    {highlightMatch(file.name, query)}
                                                </span>
                                                <span className="text-[10px] text-zinc-600 truncate">
                                                    {highlightMatch(file.path, query)}
                                                </span>
                                            </div>
                                        </CommandItem>
                                    );
                                })}
                        </CommandGroup>
                    </CommandList>
                </Command>

                {/* Footer hint */}
                <div className="flex items-center gap-3 px-4 py-2 border-t border-zinc-800 bg-zinc-950/50">
                    {[
                        { key: '↑↓', label: 'navigate' },
                        { key: '↵', label: 'open' },
                        { key: 'esc', label: 'close' }
                    ].map(({ key, label }) => (
                        <span key={key} className="flex items-center gap-1 text-[10px] text-zinc-600">
                            <kbd className="border border-zinc-700 rounded px-1 py-0.5 text-zinc-500">{key}</kbd>
                            {label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
