'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { ProjectFile } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchFileByIdParams {
    id: string;
}

export const fetchFileById = async (params: FetchFileByIdParams): Promise<ProjectFile> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).get(params.id);
        return JSON.parse(JSON.stringify(result)) as ProjectFile;
    } catch (err: unknown) {
        console.error('Failed to fetch file by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch file by ID');
    }
};
