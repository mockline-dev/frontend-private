'use client';

import { Button } from '@/components/ui/button';
import { Loader2, Play, Zap } from 'lucide-react';

interface EmptyStateProps {
    onRunBackend: () => void;
    isRunning: boolean;
}

export function EmptyState({ onRunBackend, isRunning }: EmptyStateProps) {
    return (
        <div className="h-full flex items-center justify-center bg-white">
            <div className="text-center max-w-sm px-6">
                <div className="w-14 h-14 rounded-2xl bg-zinc-50 border border-zinc-200 flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-zinc-400" />
                </div>
                <p className="text-sm font-semibold text-zinc-900 mb-1">API Client ready</p>
                <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
                    Start the backend to auto-discover your API endpoints and send requests through the sandbox proxy.
                </p>
                <Button onClick={onRunBackend} disabled={isRunning} size="sm" className="bg-zinc-900 hover:bg-zinc-700 text-white h-9 px-5">
                    {isRunning ? (
                        <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Starting…</>
                    ) : (
                        <><Play className="w-3.5 h-3.5 mr-2" />Run Backend</>
                    )}
                </Button>
            </div>
        </div>
    );
}
