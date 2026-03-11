'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { ProjectFile } from '@/types/feathers';
import { apiServices } from '../services';

export interface DeleteFileParams {
    id: string;
}

export const deleteFile = async (params: DeleteFileParams): Promise<ProjectFile> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).remove(params.id);
        return JSON.parse(JSON.stringify(result)) as ProjectFile;
    } catch (err: unknown) {
        console.error('Failed to delete file:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to delete file');
    }
};
