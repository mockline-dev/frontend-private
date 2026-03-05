'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface CreateFolderParams {
    projectId: string;
    name: string;
    path?: string;
    isFolder?: boolean;
    [key: string]: unknown;
}

export type CreateFolderResponse = { success: true; data: any } | { success: false; error: string };

export const createFolder = async (params: CreateFolderParams): Promise<CreateFolderResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).create({ ...params, isFolder: true });
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to create folder:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create folder'
        };
    }
};
