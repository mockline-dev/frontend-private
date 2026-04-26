'use client';

import { motion } from 'framer-motion';
import { Code2 } from 'lucide-react';

interface EmptyEditorProps {
    onOpenQuickOpen?: () => void;
}

export function EmptyEditor({ onOpenQuickOpen }: EmptyEditorProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center justify-center h-full bg-white"
        >
            <div className="text-center select-none">
                <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className="mx-auto mb-4 w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center"
                >
                    <Code2 className="w-6 h-6 text-zinc-400" />
                </motion.div>
                <p className="text-sm text-zinc-500">Select a file to start editing</p>
                {onOpenQuickOpen && (
                    <p className="text-xs text-zinc-400 mt-2">
                        Press{' '}
                        <kbd
                            onClick={onOpenQuickOpen}
                            className="inline-flex items-center px-1.5 py-0.5 rounded border border-zinc-200 bg-zinc-50 text-zinc-600 text-[11px] font-mono cursor-pointer hover:bg-zinc-100 transition-colors"
                        >
                            ⌘P
                        </kbd>{' '}
                        to open a file
                    </p>
                )}
            </div>
        </motion.div>
    );
}
