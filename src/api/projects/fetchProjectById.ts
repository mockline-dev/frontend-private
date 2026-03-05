'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchProjectByIdParams {
    id: string;
}

export type FetchProjectByIdResponse = { success: true; data: any } | { success: false; error: string };

export const fetchProjectById = async (params: FetchProjectByIdParams): Promise<FetchProjectByIdResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).get(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch project by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch project by ID'
        };
    }
};
