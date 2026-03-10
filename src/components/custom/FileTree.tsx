import {
    ChevronDown,
    ChevronRight,
    File,
    FileArchive,
    FileCode,
    FileCog,
    FileImage,
    FileJson,
    FileLock,
    FileSpreadsheet,
    FileTerminal,
    FileText,
    Folder,
    FolderOpen
} from 'lucide-react';
import { useState } from 'react';

interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    path: string;
}

interface FileTreeProps {
    data: FileNode[];
    onFileClick?: (path: string) => void;
    selectedFile?: string;
    updatingFiles?: Set<string>; // Files being updated by Mocky
}

function getFileIcon(fileName: string) {
    if (fileName.endsWith('.tsx') || fileName.endsWith('.ts') || fileName.endsWith('.jsx') || fileName.endsWith('.js') || fileName.endsWith('.py')) {
        return FileCode;
    }
    if (fileName.endsWith('.sh') || fileName.endsWith('.bash') || fileName.endsWith('.zsh')) {
        return FileTerminal;
    }
    if (fileName.endsWith('.json')) {
        return FileJson;
    }
    if (fileName.endsWith('.yaml') || fileName.endsWith('.yml') || fileName.endsWith('.toml') || fileName.endsWith('.ini') || fileName.endsWith('.env')) {
        return FileCog;
    }
    if (fileName.endsWith('.lock')) {
        return FileLock;
    }
    if (fileName.endsWith('.csv')) {
        return FileSpreadsheet;
    }
    if (fileName.endsWith('.png') || fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.svg') || fileName.endsWith('.gif')) {
        return FileImage;
    }
    if (fileName.endsWith('.zip') || fileName.endsWith('.tar') || fileName.endsWith('.gz')) {
        return FileArchive;
    }
    if (fileName.endsWith('.md') || fileName.endsWith('.txt')) {
        return FileText;
    }
    return File;
}

function sortNodes(nodes: FileNode[]): FileNode[] {
    return [...nodes]
        .sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        })
        .map((node) => ({
            ...node,
            children: node.children ? sortNodes(node.children) : undefined
        }));
}

function TreeNode({
    node,
    level = 0,
    onFileClick,
    selectedFile,
    updatingFiles
}: {
    node: FileNode;
    level?: number;
    onFileClick?: ((path: string) => void) | undefined;
    selectedFile?: string | undefined;
    updatingFiles?: Set<string> | undefined;
}) {
    const [isOpen, setIsOpen] = useState(level === 0);
    const Icon = node.type === 'folder' ? (isOpen ? FolderOpen : Folder) : getFileIcon(node.name);

    const handleClick = () => {
        if (node.type === 'folder') {
            setIsOpen(!isOpen);
        } else {
            onFileClick?.(node.path);
        }
    };

    const isSelected = selectedFile === node.path;

    return (
        <div>
            <button
                onClick={handleClick}
                className={`w-full flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors text-left ${isSelected ? 'bg-gray-100' : ''}`}
                style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
                {node.type === 'folder' && <span className="text-gray-400">{isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}</span>}
                <Icon className={`w-3.5 h-3.5 ${node.type === 'folder' ? 'text-gray-600' : 'text-gray-400'}`} />
                <span className="text-xs flex-1 truncate text-gray-700">{node.name}</span>
                {node.type === 'file' && updatingFiles?.has(node.path) && (
                    <span className="ml-auto flex h-2 w-2 relative">
                        <span className="animate-ping absolute h-2 w-2 rounded-full bg-violet-400 opacity-75" />
                        <span className="relative rounded-full h-2 w-2 bg-violet-500" />
                    </span>
                )}
            </button>
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FileTree({ data, onFileClick, selectedFile, updatingFiles }: FileTreeProps) {
    const sortedData = sortNodes(data);

    return (
        <div className="py-1">
            {sortedData.map((node, index) => (
                <TreeNode key={`${node.path}-${index}`} node={node} onFileClick={onFileClick} selectedFile={selectedFile} updatingFiles={updatingFiles} />
            ))}
        </div>
    );
}
