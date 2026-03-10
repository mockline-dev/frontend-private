'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1 h-1 bg-black/90 rounded-full mx-0.5"
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: [0.3, 0.9, 0.3], scale: [0.85, 1.1, 0.85] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.15, ease: 'easeInOut' }}
                    style={{ boxShadow: '0 0 4px rgba(255, 255, 255, 0.3)' }}
                />
            ))}
        </div>
    );
}

export function TypingIndicator({ isTyping }: { isTyping: boolean }) {
    return (
        <AnimatePresence>
            {isTyping && (
                <motion.div
                    className="fixed bottom-8 mx-auto transform backdrop-blur-2xl bg-black/[0.02] rounded-full px-4 py-2 shadow-lg border border-black/[0.05]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                >
                    <div className="flex items-center gap-1">
                        <Image src="/logo.png" alt="Mocky Avatar" width={24} height={24} className="rounded-full" />
                        <div className="flex items-center gap-1 text-sm text-black/70">
                            <span>Processing</span>
                            <TypingDots />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
