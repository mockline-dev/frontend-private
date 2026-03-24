'use client';

import { FileTreeContextMenu } from '@/components/custom/FileTreeContextMenu';
import { InlineRenameInput } from '@/components/custom/InlineRenameInput';
import { getFileIcon } from '@/utils/fileIcons';
import type { FileNode } from '@/types/workspace';
import { createElement } from 'react';
import { ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';

function FileNodeIcon({ fileName, isFolder, isOpen, className }: { fileName: string; isFolder: boolean; isOpen?: boolean; className?: string }) {
    if (isFolder) {
        return createElement(isOpen ? FolderOpen : Folder, { className });
    }
    return createElement(getFileIcon(fileName), { className });
}
import { useState } from 'react';

interface FileTreeProps {
    data: FileNode[];
    onFileClick?: ((path: string) => void) | undefined;
    selectedFile?: string | undefined;
    updatingFiles?: Set<string> | undefined;
    renamingPath?: string | null | undefined;
    onRenameConfirm?: ((oldPath: string, newName: string) => void) | undefined;
    onRenameCancel?: (() => void) | undefined;
    onDelete?: ((path: string) => void) | undefined;
    onCopyPath?: ((path: string) => void) | undefined;
    onNewFile?: ((dirPath: string) => void) | undefined;
    onNewFolder?: ((dirPath: string) => void) | undefined;
    searchQuery?: string | undefined;
}

function matchesSearch(node: FileNode, query: string): boolean {
    if (!query) return true;
    const q = query.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    if (node.type === 'folder' && node.children) {
        return node.children.some((child) => matchesSearch(child, query));
    }
    return false;
}

function sortNodes(nodes: FileNode[]): FileNode[] {
    return [...nodes]
        .sort((a, b) => {
            if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
            return a.name.localeCompare(b.name);
        })
        .map((node) => ({
            ...node,
            ...(node.children ? { children: sortNodes(node.children) } : {})
        }));
}

function TreeNode({
    node,
    level = 0,
    onFileClick,
    selectedFile,
    updatingFiles,
    renamingPath,
    onRenameConfirm,
    onRenameCancel,
    onDelete,
    onCopyPath,
    onNewFile,
    onNewFolder,
    searchQuery,
    siblings
}: {
    node: FileNode;
    level?: number | undefined;
    onFileClick?: ((path: string) => void) | undefined;
    selectedFile?: string | undefined;
    updatingFiles?: Set<string> | undefined;
    renamingPath?: string | null | undefined;
    onRenameConfirm?: ((oldPath: string, newName: string) => void) | undefined;
    onRenameCancel?: (() => void) | undefined;
    onDelete?: ((path: string) => void) | undefined;
    onCopyPath?: ((path: string) => void) | undefined;
    onNewFile?: ((dirPath: string) => void) | undefined;
    onNewFolder?: ((dirPath: string) => void) | undefined;
    searchQuery?: string | undefined;
    siblings?: FileNode[] | undefined;
}) {
    const [isOpen, setIsOpen] = useState(level === 0);

    if (searchQuery && !matchesSearch(node, searchQuery)) return null;

    const isRenaming = renamingPath === node.path;
    const isSelected = selectedFile === node.path;

    const handleClick = () => {
        if (node.type === 'folder') setIsOpen(!isOpen);
        else onFileClick?.(node.path);
    };

    const siblingNames = (siblings ?? []).filter((s) => s.path !== node.path).map((s) => s.name);

    return (
        <div>
            <FileTreeContextMenu
                node={node}
                onOpen={onFileClick}
                onRename={() => {/* trigger from outside */}}
                onDelete={onDelete}
                onCopyPath={onCopyPath}
                onNewFile={onNewFile}
                onNewFolder={onNewFolder}
            >
                <div
                    className={`w-full flex items-center gap-1.5 px-2 py-0.5 rounded cursor-pointer transition-colors duration-100 ${
                        isSelected
                            ? 'bg-violet-50 text-violet-900 border-l-2 border-l-violet-500'
                            : 'hover:bg-zinc-100'
                    }`}
                    style={{ paddingLeft: `${level * 12 + 8}px` }}
                    onClick={handleClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleClick()}
                >
                    {node.type === 'folder' && (
                        <span className="text-zinc-400">
                            {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </span>
                    )}

                    <FileNodeIcon
                        fileName={node.name}
                        isFolder={node.type === 'folder'}
                        isOpen={isOpen}
                        className={`w-3.5 h-3.5 shrink-0 ${node.type === 'folder' ? 'text-zinc-600' : 'text-zinc-400'}`}
                    />

                    {isRenaming ? (
                        <InlineRenameInput
                            initialValue={node.name}
                            onConfirm={(newName) => onRenameConfirm?.(node.path, newName)}
                            onCancel={() => onRenameCancel?.()}
                            existingNames={siblingNames}
                        />
                    ) : (
                        <span className={`text-xs flex-1 truncate ${isSelected ? 'text-violet-900 font-medium' : 'text-zinc-700'}`}>
                            {node.name}
                        </span>
                    )}

                    {node.type === 'file' && updatingFiles?.has(node.path) && (
                        <span className="ml-auto flex h-2 w-2 relative">
                            <span className="animate-ping absolute h-2 w-2 rounded-full bg-violet-400 opacity-75" />
                            <span className="relative rounded-full h-2 w-2 bg-violet-500" />
                        </span>
                    )}
                </div>
            </FileTreeContextMenu>

            {node.type === 'folder' && isOpen && node.children && (
                <div>
                    {node.children.map((child, index) => (
                        <TreeNode
                            key={`${child.path}-${index}`}
                            node={child}
                            level={level + 1}
                            onFileClick={onFileClick}
                            selectedFile={selectedFile}
                            updatingFiles={updatingFiles}
                            renamingPath={renamingPath}
                            onRenameConfirm={onRenameConfirm}
                            onRenameCancel={onRenameCancel}
                            onDelete={onDelete}
                            onCopyPath={onCopyPath}
                            onNewFile={onNewFile}
                            onNewFolder={onNewFolder}
                            searchQuery={searchQuery}
                            siblings={node.children}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FileTree({
    data,
    onFileClick,
    selectedFile,
    updatingFiles,
    renamingPath,
    onRenameConfirm,
    onRenameCancel,
    onDelete,
    onCopyPath,
    onNewFile,
    onNewFolder,
    searchQuery
}: FileTreeProps) {
    const sortedData = sortNodes(data);

    return (
        <div className="py-1">
            {sortedData.map((node, index) => (
                <TreeNode
                    key={`${node.path}-${index}`}
                    node={node}
                    onFileClick={onFileClick}
                    selectedFile={selectedFile}
                    updatingFiles={updatingFiles}
                    renamingPath={renamingPath}
                    onRenameConfirm={onRenameConfirm}
                    onRenameCancel={onRenameCancel}
                    onDelete={onDelete}
                    onCopyPath={onCopyPath}
                    onNewFile={onNewFile}
                    onNewFolder={onNewFolder}
                    searchQuery={searchQuery}
                    siblings={sortedData}
                />
            ))}
        </div>
    );
}
