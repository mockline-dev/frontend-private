'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { LoaderIcon, SendIcon } from 'lucide-react';

interface SendButtonProps {
    isTyping: boolean;
    onClick: () => void;
    disabled?: boolean;
}

export function SendButton({ isTyping, onClick, disabled }: SendButtonProps) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={disabled}
            className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'flex items-center gap-2',
                !disabled
                    ? 'bg-none text-[#0A0A0B] border border-black/[0.1] hover:bg-black/[0.05] hover:cursor-pointer'
                    : 'bg-black/[0.05] text-black/40 cursor-not-allowed'
            )}
        >
            {isTyping ? <LoaderIcon className="w-4 h-4 animate-[spin_2s_linear_infinite]" /> : <SendIcon className="w-4 h-4" />}
            <span>Send</span>
        </motion.button>
    );
}
