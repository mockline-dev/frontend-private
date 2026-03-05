'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchAIResponseParams {
    query?: Record<string, unknown>;
}

export type FetchAIResponseResponse = { success: true; data: any } | { success: false; error: string };

export const fetchAIResponse = async (params?: FetchAIResponseParams): Promise<FetchAIResponseResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.aiService).find(params?.query || {});
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch AI response:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch AI response'
        };
    }
};
