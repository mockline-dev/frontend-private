'use client';

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger
} from '@/components/ui/context-menu';
import type { FileNode } from '@/types/workspace';
import { Copy, FilePlus, FolderPlus, Pencil, Trash2 } from 'lucide-react';

interface FileTreeContextMenuProps {
    node: FileNode;
    children: React.ReactNode;
    onOpen?: ((path: string) => void) | undefined;
    onRename?: ((path: string) => void) | undefined;
    onDelete?: ((path: string) => void) | undefined;
    onCopyPath?: ((path: string) => void) | undefined;
    onNewFile?: ((dirPath: string) => void) | undefined;
    onNewFolder?: ((dirPath: string) => void) | undefined;
}

export function FileTreeContextMenu({
    node,
    children,
    onOpen,
    onRename,
    onDelete,
    onCopyPath,
    onNewFile,
    onNewFolder
}: FileTreeContextMenuProps) {
    const dirPath = node.type === 'folder' ? node.path : node.path.split('/').slice(0, -1).join('/');

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
            <ContextMenuContent className="w-48 text-xs">
                {node.type === 'file' && (
                    <ContextMenuItem onClick={() => onOpen?.(node.path)} className="gap-2 text-xs cursor-pointer">
                        Open
                    </ContextMenuItem>
                )}

                <ContextMenuItem onClick={() => onNewFile?.(dirPath)} className="gap-2 text-xs cursor-pointer">
                    <FilePlus className="w-3.5 h-3.5" />
                    New File
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onNewFolder?.(dirPath)} className="gap-2 text-xs cursor-pointer">
                    <FolderPlus className="w-3.5 h-3.5" />
                    New Folder
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem onClick={() => onRename?.(node.path)} className="gap-2 text-xs cursor-pointer">
                    <Pencil className="w-3.5 h-3.5" />
                    Rename
                    <span className="ml-auto text-zinc-400">F2</span>
                </ContextMenuItem>
                <ContextMenuItem onClick={() => onCopyPath?.(node.path)} className="gap-2 text-xs cursor-pointer">
                    <Copy className="w-3.5 h-3.5" />
                    Copy Path
                </ContextMenuItem>

                <ContextMenuSeparator />

                <ContextMenuItem
                    onClick={() => onDelete?.(node.path)}
                    className="gap-2 text-xs cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
