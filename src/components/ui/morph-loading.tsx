'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface UniqueLoadingProps {
    variant?: 'morph';
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function UniqueLoading({ variant = 'morph', size = 'md', className }: UniqueLoadingProps) {
    const containerSizes = {
        sm: 'w-16 h-16',
        md: 'w-24 h-24',
        lg: 'w-32 h-32'
    };

    if (variant === 'morph') {
        const blobs = [
            { x: [0, 20, 40, 20, 0], y: [0, -20, 0, 20, 0], scale: [1, 1.2, 0.8, 1.1, 1], rotate: [0, 0, 0, 0, 0] },
            { x: [0, -20, -40, -20, 0], y: [0, -20, 0, 20, 0], scale: [1, 1.3, 0.7, 1.2, 1], rotate: [0, 90, 180, 270, 360] },
            { x: [0, -20, 0, 20, 0], y: [0, 20, 40, 20, 0], scale: [1, 0.9, 1.4, 0.8, 1], rotate: [0, 0, 0, 0, 0] },
            { x: [0, 20, 0, -20, 0], y: [0, 20, -40, -20, 0], scale: [1, 1.1, 1.3, 0.9, 1], rotate: [0, -90, -180, -270, -360] }
        ];

        return (
            <div className={cn('relative', containerSizes[size], className)}>
                <div className="absolute inset-0 flex items-center justify-center">
                    {blobs.map((blob, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-4 h-4 bg-black dark:bg-white"
                            animate={{
                                x: blob.x,
                                y: blob.y,
                                scale: blob.scale,
                                rotate: blob.rotate,
                                borderRadius: ['0%', '50%', '25%', '75%', '0%']
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: i * 0.2
                            }}
                        />
                    ))}
                </div>
            </div>
        );
    }

    return null;
}
