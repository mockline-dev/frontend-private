'use client';

import type { Message } from '@/types/feathers';
import { CheckCheck, Wrench, XCircle } from 'lucide-react';

function FileChangeRow({ path, type }: { path: string; type: 'modified' | 'created' }) {
    const parts = path.split('/');
    const basename = parts[parts.length - 1] ?? path;
    const dir = parts.length > 1 ? parts.slice(0, -1).join('/') + '/' : '';

    return (
        <div className="flex items-center gap-2 py-1">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${type === 'created' ? 'bg-green-500' : 'bg-orange-400'}`} />
            <span className="font-mono text-[11px] flex-1 truncate">
                <span className="text-muted-foreground/60">{dir}</span>
                <span className="font-semibold">{basename}</span>
            </span>
            <span className={`text-[10px] font-medium shrink-0 ${type === 'created' ? 'text-green-600' : 'text-orange-500'}`}>{type}</span>
        </div>
    );
}

export function SystemMessageBanner({ message }: { message: Message }) {
    if (!message.content?.trim() && !message.metadata?.type) return null;

    const mtype = message.metadata?.type as string | undefined;
    const isRepairStart    = mtype === 'repair-start';
    const isRepairProgress = mtype === 'repair-progress';
    const isRepairSuccess  = mtype === 'repair-success';
    const isRepairError    = mtype === 'repair-error';
    const isRepair = isRepairStart || isRepairProgress || isRepairSuccess || isRepairError;

    if (isRepair) {
        const attempt = message.metadata?.repairAttempt as number | undefined;
        const maxAttempts = message.metadata?.repairMaxAttempts as number | undefined;
        const attemptLabel = attempt && maxAttempts ? ` ${attempt}/${maxAttempts}` : attempt ? ` ${attempt}` : '';
        const changedFiles = (message.metadata?.changedFiles ?? []) as string[];
        const newFiles = (message.metadata?.newFiles ?? []) as string[];
        const modifiedFiles = (message.metadata?.modifiedFiles ?? []) as string[];
        const durationSec = message.metadata?.durationSec as string | undefined;
        const hasFileDetails = changedFiles.length > 0;

        const cfg = isRepairSuccess
            ? { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: <CheckCheck className="w-3.5 h-3.5 shrink-0" /> }
            : isRepairError
            ? { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <XCircle className="w-3.5 h-3.5 shrink-0" /> }
            : { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <Wrench className="w-3.5 h-3.5 shrink-0 animate-pulse" /> };

        return (
            <div className={`mx-2 rounded-lg border ${cfg.bg} ${cfg.text} overflow-hidden`}>
                <div className="flex items-center gap-2 px-3 py-2 text-[11px] font-medium">
                    {cfg.icon}
                    <span className="flex-1">
                        {isRepairStart && `Auto-repair started${attemptLabel}`}
                        {isRepairProgress && `Repairing${attemptLabel}…`}
                        {isRepairSuccess && `Repaired successfully${durationSec ? ` in ${durationSec}s` : ''}${attemptLabel}`}
                        {isRepairError && `Auto-repair failed${attemptLabel}`}
                    </span>
                </div>

                {hasFileDetails && (isRepairSuccess || isRepairProgress) && (
                    <div className="px-3 pb-2.5 border-t border-current border-opacity-10 pt-1.5 divide-y divide-current divide-opacity-5">
                        {modifiedFiles.map((f) => (
                            <FileChangeRow key={f} path={f} type="modified" />
                        ))}
                        {newFiles.map((f) => (
                            <FileChangeRow key={f} path={f} type="created" />
                        ))}
                    </div>
                )}

                {isRepairError && message.content?.trim() && (
                    <div className="px-3 pb-2 text-[10px] opacity-75 border-t border-current border-opacity-10 pt-1.5">
                        {message.content}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="text-center text-[10px] text-gray-400 italic py-1 px-4">
            {message.content}
        </div>
    );
}
