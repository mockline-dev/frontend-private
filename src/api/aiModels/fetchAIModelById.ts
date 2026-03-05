'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchAIModelByIdParams {
    id: string;
}

export type FetchAIModelByIdResponse = { success: true; data: any } | { success: false; error: string };

export const fetchAIModelById = async (params: FetchAIModelByIdParams): Promise<FetchAIModelByIdResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.aiModels).get(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch AI model by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch AI model by ID'
        };
    }
};
