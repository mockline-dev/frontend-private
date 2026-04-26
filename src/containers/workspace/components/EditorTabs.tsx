'use client';

import { getFileIcon } from '@/utils/fileIcons';
import type { EditorTab } from '@/types/workspace';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useRef } from 'react';

interface EditorTabsProps {
    tabs: EditorTab[];
    activeTabId: string | null;
    onSelectTab: (tabId: string) => void;
    onCloseTab: (tabId: string) => void;
}

export function EditorTabs({ tabs, activeTabId, onSelectTab, onCloseTab }: EditorTabsProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    if (tabs.length === 0) return null;

    return (
        <div className="relative h-9 bg-zinc-100 border-b border-zinc-200 flex items-end overflow-hidden">
            {/* Horizontal scroll container */}
            <div ref={scrollRef} className="flex items-end h-full overflow-x-auto overflow-y-hidden scrollbar-none">
                <AnimatePresence initial={false}>
                    {tabs.map((tab) => {
                        const isActive = tab.id === activeTabId;
                        const Icon = getFileIcon(tab.fileName);
                        const fileName = tab.fileName.split('/').pop() ?? tab.fileName;

                        return (
                            <motion.div
                                key={tab.id}
                                initial={{ width: 0, opacity: 0 }}
                                animate={{ width: 'auto', opacity: 1 }}
                                exit={{ width: 0, opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="flex-shrink-0"
                            >
                                <button
                                    onClick={() => onSelectTab(tab.id)}
                                    title={tab.filePath}
                                    className={`group relative flex items-center gap-1.5 h-8 px-3 text-xs font-medium transition-colors border-r border-zinc-200 whitespace-nowrap ${
                                        isActive
                                            ? 'bg-white text-zinc-900 border-t-2 border-t-violet-500 shadow-sm'
                                            : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800'
                                    }`}
                                >
                                    <Icon className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                                    <span className="max-w-[120px] truncate">{fileName}</span>

                                    {/* Close / dirty indicator */}
                                    {tab.isDirty ? (
                                        <span
                                            className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"
                                            title="Unsaved changes"
                                        />
                                    ) : (
                                        <span
                                            role="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onCloseTab(tab.id);
                                            }}
                                            className="w-3.5 h-3.5 rounded flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-zinc-200 transition-opacity shrink-0"
                                            aria-label={`Close ${fileName}`}
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </span>
                                    )}
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            {/* Right-edge fade for overflow */}
            <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-linear-to-l from-zinc-100 to-transparent" />
        </div>
    );
}
