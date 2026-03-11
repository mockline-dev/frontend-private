import { createFile } from '@/api/files/createFile';
import { deleteFile } from '@/api/files/deleteFile';
import { fetchFileById } from '@/api/files/fetchFileById';
import { fetchFileContent } from '@/api/files/fetchFileContent';
import { fetchFiles } from '@/api/files/fetchFiles';
import { updateFile } from '@/api/files/updateFile';
import feathersClient from '../featherClient';

export interface File {
    _id: string;
    projectId: string;
    messageId?: string;
    name: string; // The filename/key in R2 (changed from 'path')
    key: string; // The R2 key (changed from 'r2Key')
    fileType: string; // Content type (changed from 'language')
    size: number;
    currentVersion: number;
    createdAt: number;
    updatedAt: number;
}

export interface FileQuery extends Record<string, unknown> {
    $sort?: {
        createdAt?: 1 | -1;
    };
    $limit?: number;
    $skip?: number;
    projectId?: string;
    messageId?: string;
}

// Backward compatibility - keep old interface name as alias
export type AIFile = File;
export type AIFileQuery = FileQuery;

export interface R2File {
    _id: string;
    key: string;
    size: number;
    contentType: string;
    createdAt: number;
    updatedAt: number;
}

export interface FileContent {
    content: string;
    metadata?: {
        contentType: string;
        size: number;
        lastModified: string;
    };
}

export const filesService = {
    async find(query?: FileQuery): Promise<{ data: File[]; total: number; limit: number; skip: number }> {
        const result = await fetchFiles({ ...(query !== undefined && { query }) });
        if (Array.isArray(result)) {
            return {
                data: result,
                total: result.length,
                limit: result.length,
                skip: 0
            };
        }

        return {
            data: result.data,
            total: result.total || result.data.length,
            limit: result.limit || result.data.length,
            skip: result.skip || 0
        };
    },

    async get(id: string): Promise<File> {
        return await fetchFileById({ id });
    },

    async create(data: { projectId: string; messageId?: string; name: string; key: string; fileType: string; size: number; currentVersion?: number }): Promise<File> {
        return await createFile(data);
    },

    async getByProjectId(projectId: string): Promise<File[]> {
        const result = await fetchFiles({ query: { projectId } });
        return Array.isArray(result) ? result : result.data;
    },

    async patch(id: string, data: Partial<Pick<File, 'size' | 'currentVersion'>>): Promise<File> {
        return await updateFile({ id, data });
    },

    async remove(id: string): Promise<File> {
        return await deleteFile({ id });
    },

    async getFileUrl(fileId: string): Promise<string> {
        const result = await fetchFileContent({ fileId });
        if (!result.success) {
            throw new Error(result.error);
        }
        return result.content;
    },

    // Real-time event listeners - Note: These should use feathersClient for real-time updates
    onCreated(callback: (file: File) => void) {
        feathersClient.service('files').on('created', callback);
        return () => feathersClient.service('files').off('created', callback);
    },

    onPatched(callback: (file: File) => void) {
        feathersClient.service('files').on('patched', callback);
        return () => feathersClient.service('files').off('patched', callback);
    },

    onUpdated(callback: (file: File) => void) {
        feathersClient.service('files').on('updated', callback);
        return () => feathersClient.service('files').off('updated', callback);
    }
};

// Backward compatibility - keep old service name as alias
export const aiFilesService = filesService;

// Note: Real-time event listeners should be moved to useRealtimeUpdates.ts
