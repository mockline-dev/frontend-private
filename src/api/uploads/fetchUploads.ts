'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchUploadsParams {
    query?: Record<string, unknown>;
}

export type FetchUploadsResponse = { success: true; data: unknown } | { success: false; error: string };

export const fetchUploads = async (params?: FetchUploadsParams): Promise<FetchUploadsResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.uploads).find(params?.query || {});
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch uploads:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch uploads'
        };
    }
};
