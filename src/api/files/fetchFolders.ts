'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchFoldersParams {
    query?: Record<string, unknown>;
}

export type FetchFoldersResponse = { success: true; data: any } | { success: false; error: string };

export const fetchFolders = async (params?: FetchFoldersParams): Promise<FetchFoldersResponse> => {
    try {
        const server = await createFeathersServerClient();
        const query = params?.query || {};
        const result = await server.service(apiServices.files).find({ query: { ...query, isFolder: true } });
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch folders:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch folders'
        };
    }
};
