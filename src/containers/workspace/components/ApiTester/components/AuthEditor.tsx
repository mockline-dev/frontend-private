'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { AuthConfig, AuthType } from '../types';

interface AuthEditorProps {
    auth: AuthConfig;
    onChange: (auth: AuthConfig) => void;
}

export function AuthEditor({ auth, onChange }: AuthEditorProps) {
    const set = (partial: Partial<AuthConfig>) => onChange({ ...auth, ...partial });

    return (
        <div className="flex flex-col gap-3 p-3">
            <div className="flex items-center gap-2">
                <Label className="text-xs w-16 shrink-0">Type</Label>
                <Select value={auth.type} onValueChange={(v) => set({ type: v as AuthType })}>
                    <SelectTrigger className="h-7 text-xs w-44 border-zinc-200">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none" className="text-xs">No Auth</SelectItem>
                        <SelectItem value="bearer" className="text-xs">Bearer Token</SelectItem>
                        <SelectItem value="basic" className="text-xs">Basic Auth</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {auth.type === 'bearer' && (
                <div className="flex items-center gap-2">
                    <Label className="text-xs w-16 shrink-0">Token</Label>
                    <Input
                        value={auth.token}
                        onChange={(e) => set({ token: e.target.value })}
                        placeholder="Bearer token..."
                        className="h-7 text-xs font-mono border-zinc-200"
                    />
                </div>
            )}

            {auth.type === 'basic' && (
                <>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs w-16 shrink-0">Username</Label>
                        <Input value={auth.username} onChange={(e) => set({ username: e.target.value })} placeholder="Username" className="h-7 text-xs border-zinc-200" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Label className="text-xs w-16 shrink-0">Password</Label>
                        <Input type="password" value={auth.password} onChange={(e) => set({ password: e.target.value })} placeholder="Password" className="h-7 text-xs border-zinc-200" />
                    </div>
                </>
            )}

            {auth.type === 'none' && <p className="text-xs text-zinc-400">No authentication configured.</p>}
        </div>
    );
}
