'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { ProjectFile } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchFilesParams {
    query?: Record<string, unknown>;
}

export interface PaginatedFiles {
    total?: number;
    limit?: number;
    skip?: number;
    data: ProjectFile[];
}

export const fetchFiles = async (params?: FetchFilesParams): Promise<ProjectFile[] | PaginatedFiles> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).find({ query: params?.query || {} });
        return JSON.parse(JSON.stringify(result)) as ProjectFile[] | PaginatedFiles;
    } catch (err: unknown) {
        console.error('Failed to fetch files:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch files');
    }
};
