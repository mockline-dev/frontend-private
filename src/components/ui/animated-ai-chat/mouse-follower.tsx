'use client';

import { motion } from 'framer-motion';

interface MouseFollowerProps {
    position: { x: number; y: number };
    visible: boolean;
}

export function MouseFollower({ position, visible }: MouseFollowerProps) {
    if (!visible) return null;
    return (
        <motion.div
            className="fixed w-[50rem] h-[50rem] rounded-full pointer-events-none z-0 opacity-[0.02] bg-gradient-to-r from-amber-500 via-amber-800 to-primary-foreground-500 blur-[96px]"
            animate={{ x: position.x - 400, y: position.y - 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150, mass: 0.5 }}
        />
    );
}
