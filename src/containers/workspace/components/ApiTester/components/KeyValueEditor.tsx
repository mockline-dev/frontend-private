'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Plus, Trash2 } from 'lucide-react';
import type { KeyValuePair } from '../types';

interface KeyValueEditorProps {
    pairs: KeyValuePair[];
    onChange: (pairs: KeyValuePair[]) => void;
    readOnly?: boolean;
    addLabel?: string;
    className?: string;
}

function generateId(): string {
    return Math.random().toString(36).slice(2, 9);
}

export function KeyValueEditor({ pairs, onChange, readOnly = false, addLabel = 'Add row', className }: KeyValueEditorProps) {
    const addRow = () => {
        onChange([...pairs, { id: generateId(), key: '', value: '', enabled: true }]);
    };

    const removeRow = (id: string) => {
        onChange(pairs.filter((p) => p.id !== id));
    };

    const updateRow = (id: string, field: 'key' | 'value' | 'enabled', val: string | boolean) => {
        onChange(pairs.map((p) => (p.id === id ? { ...p, [field]: val } : p)));
    };

    return (
        <div className={cn('flex flex-col gap-1.5', className)}>
            {pairs.map((pair) => (
                <div key={pair.id} className="flex items-center gap-1.5">
                    {!readOnly && (
                        <input
                            type="checkbox"
                            checked={pair.enabled}
                            onChange={(e) => updateRow(pair.id, 'enabled', e.target.checked)}
                            className="w-3.5 h-3.5 rounded border-zinc-300 text-zinc-900 shrink-0"
                        />
                    )}
                    <Input
                        value={pair.key}
                        onChange={(e) => updateRow(pair.id, 'key', e.target.value)}
                        placeholder="Key"
                        readOnly={readOnly}
                        className="h-7 text-xs font-mono flex-1 bg-white border-zinc-200"
                    />
                    <Input
                        value={pair.value}
                        onChange={(e) => updateRow(pair.id, 'value', e.target.value)}
                        placeholder="Value"
                        readOnly={readOnly}
                        className="h-7 text-xs font-mono flex-1 bg-white border-zinc-200"
                    />
                    {!readOnly && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-zinc-400 hover:text-red-500" onClick={() => removeRow(pair.id)}>
                            <Trash2 className="w-3 h-3" />
                        </Button>
                    )}
                </div>
            ))}
            {!readOnly && (
                <Button variant="ghost" size="sm" className="h-7 text-xs text-zinc-500 hover:text-zinc-900 justify-start pl-1" onClick={addRow}>
                    <Plus className="w-3 h-3 mr-1" />
                    {addLabel}
                </Button>
            )}
        </div>
    );
}
