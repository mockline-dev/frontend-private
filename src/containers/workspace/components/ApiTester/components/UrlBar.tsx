'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Send } from 'lucide-react';
import { HTTP_METHODS } from '../constants';
import type { HttpMethod, RequestStatus } from '../types';

interface UrlBarProps {
    method: HttpMethod;
    url: string;
    status: RequestStatus;
    onMethodChange: (m: HttpMethod) => void;
    onUrlChange: (url: string) => void;
    onSend: () => void;
    onCancel: () => void;
}

export function UrlBar({ method, url, status, onMethodChange, onUrlChange, onSend, onCancel }: UrlBarProps) {
    const isSending = status === 'loading';

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            isSending ? onCancel() : onSend();
        }
    };

    return (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 bg-white">
            <Select value={method} onValueChange={(v) => onMethodChange(v as HttpMethod)}>
                <SelectTrigger className="h-8 w-28 text-xs font-mono font-semibold border-zinc-200 shrink-0">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {HTTP_METHODS.map((m) => (
                        <SelectItem key={m} value={m} className="text-xs font-mono">
                            {m}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Input
                value={url}
                onChange={(e) => onUrlChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://..."
                className="h-8 text-xs font-mono flex-1 border-zinc-200"
            />

            <Button
                size="sm"
                className="h-8 px-4 text-xs bg-zinc-900 hover:bg-zinc-700 text-white shrink-0"
                onClick={isSending ? onCancel : onSend}
                title={isSending ? 'Cancel (⌘+Enter)' : 'Send (⌘+Enter)'}
            >
                {isSending ? (
                    <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Cancel</>
                ) : (
                    <><Send className="w-3.5 h-3.5 mr-1.5" />Send</>
                )}
            </Button>
        </div>
    );
}
