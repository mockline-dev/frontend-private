'use client';

import { motion } from 'framer-motion';

import { Hero } from '../animated-hero';

export function HeroSection() {
    return (
        <div className="text-center space-y-3">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-block">
                <Hero />
                <motion.div
                    className="h-px bg-gradient-to-r from-transparent via-black/20 to-transparent"
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                />
            </motion.div>
            <motion.p className="text-sm text-black/40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                Start with your journey with just few words.
            </motion.p>
        </div>
    );
}
