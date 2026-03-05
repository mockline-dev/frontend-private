'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface CreateFileParams {
    projectId: string;
    messageId?: string;
    name: string;
    key: string;
    fileType: string;
    size: number;
    currentVersion?: number;
    [key: string]: unknown;
}

export type CreateFileResponse = { success: true; data: any } | { success: false; error: string };

export const createFile = async (params: CreateFileParams): Promise<CreateFileResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).create(params);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to create file:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create file'
        };
    }
};
