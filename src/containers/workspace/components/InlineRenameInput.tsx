'use client';

import { useEffect, useRef } from 'react';

interface InlineRenameInputProps {
    initialValue: string;
    onConfirm: (newName: string) => void;
    onCancel: () => void;
    existingNames?: string[];
}

export function InlineRenameInput({ initialValue, onConfirm, onCancel, existingNames = [] }: InlineRenameInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const input = inputRef.current;
        if (!input) return;
        input.focus();
        // Select name without extension
        const dotIndex = initialValue.lastIndexOf('.');
        input.setSelectionRange(0, dotIndex > 0 ? dotIndex : initialValue.length);
    }, [initialValue]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            commit((e.target as HTMLInputElement).value);
        } else if (e.key === 'Escape') {
            e.preventDefault();
            onCancel();
        }
    };

    const commit = (value: string) => {
        const trimmed = value.trim();
        if (!trimmed || trimmed === initialValue) { onCancel(); return; }
        if (trimmed.includes('/') || trimmed.includes('\\')) { onCancel(); return; }
        if (existingNames.includes(trimmed)) { onCancel(); return; }
        onConfirm(trimmed);
    };

    return (
        <input
            ref={inputRef}
            defaultValue={initialValue}
            onKeyDown={handleKeyDown}
            onBlur={(e) => commit(e.target.value)}
            className="w-full text-xs px-1 py-0.5 bg-white border border-violet-400 rounded outline-none ring-1 ring-violet-300"
            aria-label="Rename file"
        />
    );
}
