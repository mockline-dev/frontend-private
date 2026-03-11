'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { ProjectFile, UpdateFileData } from '@/types/feathers';
import { apiServices } from '../services';

export interface UpdateFileParams {
    id: string;
    data: UpdateFileData;
}

export const updateFile = async (params: UpdateFileParams): Promise<ProjectFile> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).patch(params.id, params.data);
        return JSON.parse(JSON.stringify(result)) as ProjectFile;
    } catch (err: unknown) {
        console.error('Failed to update file:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to update file');
    }
};
