'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchFilesParams {
    query?: Record<string, unknown>;
}

export type FetchFilesResponse = { success: true; data: any } | { success: false; error: string };

export const fetchFiles = async (params?: FetchFilesParams): Promise<FetchFilesResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).find(params?.query || {});
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch files:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch files'
        };
    }
};
