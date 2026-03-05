'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchAIModelsParams {
    query?: Record<string, unknown>;
}

export type FetchAIModelsResponse = { success: true; data: any } | { success: false; error: string };

export const fetchAIModels = async (params?: FetchAIModelsParams): Promise<FetchAIModelsResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.aiModels).find(params?.query || {});
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch AI models:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch AI models'
        };
    }
};
