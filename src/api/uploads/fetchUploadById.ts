'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchUploadByIdParams {
    id: string;
}

export type FetchUploadByIdResponse = { success: true; data: unknown } | { success: false; error: string };

export const fetchUploadById = async (params: FetchUploadByIdParams): Promise<FetchUploadByIdResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.uploads).get(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch upload by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch upload by ID'
        };
    }
};
