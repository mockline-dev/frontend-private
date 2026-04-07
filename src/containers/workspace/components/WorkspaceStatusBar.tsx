'use client';

import type { CursorPosition } from '@/types/workspace';
import type { Project } from '@/types/feathers';

interface WorkspaceStatusBarProps {
    currentProject: Project | null;
    filesCount: number;
    selectedFile: string | null;
    cursorPosition?: CursorPosition;
    language?: string;
}

export function WorkspaceStatusBar({
    currentProject,
    filesCount,
    selectedFile,
    cursorPosition,
    language
}: WorkspaceStatusBarProps) {
    const modelLabel = currentProject?.model ?? 'no model';

    return (
        <div className="h-6 bg-zinc-100 border-t border-zinc-200 flex items-center justify-between px-3 text-[11px] text-zinc-500 select-none">
            <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                    <span
                        className={`w-2 h-2 rounded-full ${
                            currentProject?.status === 'ready'
                                ? 'bg-green-500'
                                : currentProject?.status === 'generating'
                                  ? 'bg-blue-500 animate-pulse'
                                  : currentProject?.status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-zinc-400'
                        }`}
                    />
                    {currentProject?.status ?? 'no project'}
                </span>
            </div>
            <div className="flex items-center gap-3">
                {selectedFile && cursorPosition && (
                    <>
                        <span>Ln {cursorPosition.line}, Col {cursorPosition.col}</span>
                        <span className="text-zinc-300">·</span>
                        <span>Spaces: 2</span>
                        <span className="text-zinc-300">·</span>
                        <span>UTF-8</span>
                        <span className="text-zinc-300">·</span>
                    </>
                )}
                {language && <span>{language}</span>}
                {language && <span className="text-zinc-300">·</span>}
                <span>Model: {modelLabel}</span>
                <span className="text-zinc-300">·</span>
                <span>{filesCount} files</span>
            </div>
        </div>
    );
}
