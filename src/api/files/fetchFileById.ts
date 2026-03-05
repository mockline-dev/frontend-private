'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchFileByIdParams {
    id: string;
}

export type FetchFileByIdResponse = { success: true; data: any } | { success: false; error: string };

export const fetchFileById = async (params: FetchFileByIdParams): Promise<FetchFileByIdResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).get(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch file by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch file by ID'
        };
    }
};
