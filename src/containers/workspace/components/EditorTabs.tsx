'use client';

import { cn } from '@/lib/utils';
import {
    Braces,
    ChevronDown,
    Code2,
    FileCode2,
    FileText,
    X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// ─── Language config ──────────────────────────────────────────────────────────

interface LangConfig {
    icon: React.ElementType;
    color: string;
    dot: string;
}

function getLangConfig(path: string): LangConfig {
    const ext = path.split('.').pop()?.toLowerCase() ?? '';
    switch (ext) {
        case 'py':
            return { icon: Code2, color: 'text-sky-400', dot: 'bg-sky-400' };
        case 'ts':
        case 'tsx':
            return { icon: Code2, color: 'text-blue-400', dot: 'bg-blue-400' };
        case 'js':
        case 'jsx':
            return { icon: Code2, color: 'text-yellow-400', dot: 'bg-yellow-400' };
        case 'json':
            return { icon: Braces, color: 'text-amber-400', dot: 'bg-amber-400' };
        case 'yaml':
        case 'yml':
            return { icon: FileCode2, color: 'text-orange-400', dot: 'bg-orange-400' };
        case 'md':
        case 'mdx':
            return { icon: FileText, color: 'text-zinc-400', dot: 'bg-zinc-400' };
        case 'toml':
        case 'ini':
        case 'cfg':
            return { icon: FileCode2, color: 'text-rose-400', dot: 'bg-rose-400' };
        case 'html':
        case 'htm':
            return { icon: FileCode2, color: 'text-orange-500', dot: 'bg-orange-500' };
        case 'css':
        case 'scss':
            return { icon: FileCode2, color: 'text-violet-400', dot: 'bg-violet-400' };
        default:
            return { icon: FileText, color: 'text-zinc-500', dot: 'bg-zinc-500' };
    }
}

function getFileName(path: string): string {
    return path.split('/').pop() ?? path;
}

// ─── Single Tab ───────────────────────────────────────────────────────────────

interface TabProps {
    path: string;
    isActive: boolean;
    onSelect: () => void;
    onClose: () => void;
}

function Tab({ path, isActive, onSelect, onClose }: TabProps) {
    const [hovered, setHovered] = useState(false);
    const { icon: Icon, color } = getLangConfig(path);
    const fileName = getFileName(path);

    return (
        <button
            onClick={onSelect}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={cn(
                'group relative flex items-center gap-1.5 h-full px-3.5 text-xs font-mono whitespace-nowrap select-none transition-colors duration-100',
                'border-b-2 focus:outline-none',
                isActive
                    ? 'border-zinc-300 text-zinc-100 bg-zinc-800/60'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30'
            )}
            title={path}
        >
            {/* Lang icon */}
            <Icon className={cn('w-3 h-3 shrink-0', isActive ? color : 'text-zinc-600 group-hover:' + color)} />

            {/* File name */}
            <span className="max-w-[140px] truncate">{fileName}</span>

            {/* Close / hover spacer */}
            <span className="w-3.5 shrink-0 flex items-center justify-center">
                {hovered || isActive ? (
                    <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => { e.stopPropagation(); onClose(); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onClose(); } }}
                        className="flex items-center justify-center w-3.5 h-3.5 rounded-sm text-zinc-500 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                        aria-label={`Close ${fileName}`}
                    >
                        <X className="w-2.5 h-2.5" />
                    </span>
                ) : null}
            </span>

            {/* Active glow */}
            {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-zinc-300/40 to-transparent" />
            )}
        </button>
    );
}

// ─── EditorTabs ───────────────────────────────────────────────────────────────

interface EditorTabsProps {
    openFiles: string[];
    activeFile: string | null;
    onSelect: (path: string) => void;
    onClose: (path: string) => void;
}

export function EditorTabs({ openFiles, activeFile, onSelect, onClose }: EditorTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [overflowCount, setOverflowCount] = useState(0);
    const [showOverflow, setShowOverflow] = useState(false);
    const overflowRef = useRef<HTMLDivElement>(null);

    // Compute overflow on resize / file changes
    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const compute = () => {
            const hidden = el.scrollWidth - el.clientWidth;
            setOverflowCount(hidden > 10 ? Math.ceil(hidden / 100) : 0);
        };
        const ro = new ResizeObserver(compute);
        ro.observe(el);
        compute();
        return () => ro.disconnect();
    }, [openFiles]);

    // Close overflow menu on outside click
    useEffect(() => {
        if (!showOverflow) return;
        const handler = (e: MouseEvent) => {
            if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
                setShowOverflow(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [showOverflow]);

    if (openFiles.length === 0) return null;

    return (
        <div className="relative flex items-stretch h-9 bg-zinc-900 border-b border-zinc-800 overflow-hidden">
            {/* Scrollable tab strip */}
            <div
                ref={scrollRef}
                className="flex items-stretch overflow-x-auto scrollbar-none flex-1"
                style={{ scrollbarWidth: 'none' }}
            >
                {openFiles.map((path) => (
                    <Tab
                        key={path}
                        path={path}
                        isActive={path === activeFile}
                        onSelect={() => onSelect(path)}
                        onClose={() => onClose(path)}
                    />
                ))}
            </div>

            {/* Overflow badge */}
            {overflowCount > 0 && (
                <div ref={overflowRef} className="relative flex items-center shrink-0 border-l border-zinc-800">
                    <button
                        onClick={() => setShowOverflow((v) => !v)}
                        className="flex items-center gap-1 px-2 h-full text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 font-mono transition-colors"
                    >
                        <span>+{overflowCount}</span>
                        <ChevronDown className="w-3 h-3" />
                    </button>

                    {showOverflow && (
                        <div className="absolute top-full right-0 mt-0.5 z-50 bg-zinc-900 border border-zinc-700 rounded-md shadow-xl shadow-black/50 py-0.5 min-w-[220px]">
                            {openFiles.map((path) => {
                                const { icon: Icon, color } = getLangConfig(path);
                                return (
                                    <button
                                        key={path}
                                        onClick={() => { onSelect(path); setShowOverflow(false); }}
                                        className={cn(
                                            'flex items-center gap-2 w-full px-3 py-1.5 text-xs font-mono text-left hover:bg-zinc-800 transition-colors',
                                            path === activeFile ? 'text-zinc-100' : 'text-zinc-400'
                                        )}
                                    >
                                        <Icon className={cn('w-3 h-3 shrink-0', color)} />
                                        <span className="truncate">{path}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
