'use client';

import { fetchFileContent } from '@/api/files/fetchFileContent';
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { File, filesService } from '@/services/api/files';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

// Backward compatibility - keep old type name as alias
export type AIFile = File;

export interface FileNode {
    name: string;
    type: 'file' | 'folder';
    children?: FileNode[];
    path: string;
    fileId?: string;
    key?: string;
}

export interface UseProjectFilesReturn {
    files: File[];
    fileTree: FileNode[];
    loading: boolean;
    selectedFileContent: string | null;
    loadingContent: boolean;
    loadFileContent: (file: File) => Promise<void>;
    refreshFiles: () => Promise<void>;
}

export function useProjectFiles(projectId?: string, initialFiles: File[] = []): UseProjectFilesReturn {
    const [files, setFiles] = useState<File[]>(initialFiles);
    const [fileTree, setFileTree] = useState<FileNode[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedFileContent, setSelectedFileContent] = useState<string | null>(null);
    const [loadingContent, setLoadingContent] = useState(false);

    const loadFiles = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const result = await filesService.find({ projectId });
            setFiles(result.data || []);
        } catch {
            toast.error('Failed to load project files');
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    // Load files when projectId changes (skip if initialFiles already provided for this project)
    useEffect(() => {
        if (!projectId) {
            setFiles([]);
            setFileTree([]);
            setSelectedFileContent(null);
            return;
        }
        if (initialFiles.length > 0) {
            setFiles(initialFiles);
        } else {
            loadFiles();
        }
    }, [projectId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Rebuild tree whenever files change
    useEffect(() => {
        setFileTree(files.length > 0 ? buildFileTree(files) : []);
    }, [files]);

    // Real-time file events filtered by projectId
    const handleFileCreated = useCallback((file: File) => {
        setFiles((prev) => (prev.find((f) => f._id === file._id) ? prev : [...prev, file]));
    }, []);

    const handleFilePatched = useCallback((file: File) => {
        setFiles((prev) => prev.map((f) => (f._id === file._id ? file : f)));
    }, []);

    const handleFileRemoved = useCallback((file: File) => {
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
    }, []);

    const projectFilter = useCallback((f: File) => f.projectId === projectId, [projectId]);

    useRealtimeUpdates<File>('files', 'created', handleFileCreated, projectFilter);
    useRealtimeUpdates<File>('files', 'patched', handleFilePatched, projectFilter);
    useRealtimeUpdates<File>('files', 'removed', handleFileRemoved, projectFilter);

    const loadFileContent = useCallback(async (file: File) => {
        try {
            setLoadingContent(true);
            setSelectedFileContent(null);
            const result = await fetchFileContent({ fileId: file._id });
            if (!result.success) throw new Error(result.error);
            setSelectedFileContent(result.content);
        } catch {
            toast.error('Failed to load file content');
            setSelectedFileContent('// Error loading file content');
        } finally {
            setLoadingContent(false);
        }
    }, []);

    const refreshFiles = useCallback(() => loadFiles(), [loadFiles]);

    return {
        files,
        fileTree,
        loading,
        selectedFileContent,
        loadingContent,
        loadFileContent,
        refreshFiles
    };
}

function buildFileTree(files: File[]): FileNode[] {
    const tree: FileNode[] = [];
    const pathMap = new Map<string, FileNode>();
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name));

    for (const file of sorted) {
        const parts = file.name.split('/');
        let currentPath = '';

        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            const isLast = i === parts.length - 1;
            currentPath = currentPath ? `${currentPath}/${part}` : part;

            if (!pathMap.has(currentPath)) {
                const node: FileNode = isLast
                    ? { name: part, type: 'file', path: currentPath, fileId: file._id, key: file.key }
                    : { name: part, type: 'folder', path: currentPath, children: [] };

                pathMap.set(currentPath, node);

                if (i === 0) {
                    tree.push(node);
                } else {
                    const parentPath = parts.slice(0, i).join('/');
                    pathMap.get(parentPath)?.children?.push(node);
                }
            }
        }
    }

    return tree;
}

export function findFileByPath(files: File[], path: string): File | undefined {
    return files.find((f) => f.name === path);
}
