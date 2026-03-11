'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { CreateFileData, ProjectFile } from '@/types/feathers';
import { apiServices } from '../services';

export const createFile = async (params: CreateFileData): Promise<ProjectFile> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).create(params);
        return JSON.parse(JSON.stringify(result)) as ProjectFile;
    } catch (err: unknown) {
        console.error('Failed to create file:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to create file');
    }
};
