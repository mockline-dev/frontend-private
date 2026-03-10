'use client';

import feathersClient from '@/services/featherClient';
import { CreateFileData, FileQuery, ProjectFile, UpdateFileData } from '@/types/feathers';
import { useCallback, useState } from 'react';
import { useRealtimeUpdates } from './useRealtimeUpdates';

export interface UseFilesReturn {
    // State
    files: ProjectFile[];
    loading: boolean;
    error: string | null;
    currentFile: ProjectFile | null;

    // Methods
    loadFiles: (projectId: string, query?: FileQuery) => Promise<void>;
    loadFile: (fileId: string) => Promise<void>;
    createFile: (data: CreateFileData) => Promise<ProjectFile>;
    updateFile: (fileId: string, data: UpdateFileData) => Promise<ProjectFile>;
    deleteFile: (fileId: string) => Promise<void>;
    refresh: (projectId: string) => Promise<void>;
    setCurrentFile: (file: ProjectFile | null) => void;
}

export function useFiles(initialFiles: ProjectFile[] = []): UseFilesReturn {
    const [files, setFiles] = useState<ProjectFile[]>(initialFiles);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFile, setCurrentFile] = useState<ProjectFile | null>(null);

    // Check if we're in a browser environment
    const isBrowser = typeof window !== 'undefined';

    // Load files for a project
    const loadFiles = useCallback(
        async (projectId: string, query?: FileQuery) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const pageSize = 200;
                let skip = 0;
                let allFiles: ProjectFile[] = [];

                // Handle both paginated and non-paginated Feathers responses.
                while (true) {
                    const result = await feathersClient.service('files').find({
                        query: {
                            projectId,
                            ...query,
                            $sort: { name: 1 },
                            $limit: pageSize,
                            $skip: skip
                        }
                    });

                    if (Array.isArray(result)) {
                        allFiles = result;
                        break;
                    }

                    const chunk = (result.data || []) as ProjectFile[];
                    allFiles = allFiles.concat(chunk);

                    if (chunk.length < pageSize) {
                        break;
                    }

                    skip += pageSize;
                }

                setFiles(allFiles);
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load files';
                setError(message);
                console.error('[useFiles] Error loading files:', err);
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Load a single file
    const loadFile = useCallback(
        async (fileId: string) => {
            if (!isBrowser) return;

            setLoading(true);
            setError(null);

            try {
                const file = await feathersClient.service('files').get(fileId);
                setCurrentFile(file);
                return file;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to load file';
                setError(message);
                console.error('[useFiles] Error loading file:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Create a new file
    const createFile = useCallback(
        async (data: CreateFileData): Promise<ProjectFile> => {
            if (!isBrowser) {
                throw new Error('Cannot create file on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const file = await feathersClient.service('files').create(data);
                setFiles((prev) => [...prev, file]);
                return file;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to create file';
                setError(message);
                console.error('[useFiles] Error creating file:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Update a file
    const updateFile = useCallback(
        async (fileId: string, data: UpdateFileData): Promise<ProjectFile> => {
            if (!isBrowser) {
                throw new Error('Cannot update file on the server');
            }

            setLoading(true);
            setError(null);

            try {
                const updated = await feathersClient.service('files').patch(fileId, data);
                setFiles((prev) => prev.map((f) => (f._id === fileId ? updated : f)));
                setCurrentFile((prev) => (prev?._id === fileId ? updated : prev));
                return updated;
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to update file';
                setError(message);
                console.error('[useFiles] Error updating file:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Delete a file
    const deleteFile = useCallback(
        async (fileId: string): Promise<void> => {
            if (!isBrowser) {
                throw new Error('Cannot delete file on the server');
            }

            setLoading(true);
            setError(null);

            try {
                await feathersClient.service('files').remove(fileId);
                setFiles((prev) => prev.filter((f) => f._id !== fileId));
                setCurrentFile((prev) => (prev?._id === fileId ? null : prev));
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Failed to delete file';
                setError(message);
                console.error('[useFiles] Error deleting file:', err);
                throw err;
            } finally {
                setLoading(false);
            }
        },
        [isBrowser]
    );

    // Refresh files for a project
    const refresh = useCallback(
        async (projectId: string) => {
            await loadFiles(projectId);
        },
        [loadFiles]
    );

    useRealtimeUpdates<ProjectFile>('files', 'created', (file) => {
        setFiles((prev) => (prev.some((f) => f._id === file._id) ? prev : [...prev, file]));
    });

    useRealtimeUpdates<ProjectFile>('files', 'patched', (file) => {
        setFiles((prev) => prev.map((f) => (f._id === file._id ? file : f)));
        setCurrentFile((prev) => (prev?._id === file._id ? file : prev));
    });

    useRealtimeUpdates<ProjectFile>('files', 'removed', (file) => {
        setFiles((prev) => prev.filter((f) => f._id !== file._id));
        setCurrentFile((prev) => (prev?._id === file._id ? null : prev));
    });

    return {
        // State
        files,
        loading,
        error,
        currentFile,

        // Methods
        loadFiles,
        loadFile,
        createFile,
        updateFile,
        deleteFile,
        refresh,
        setCurrentFile
    };
}
