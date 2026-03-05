'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface CreateAIModelParams {
    name: string;
    provider?: string;
    model?: string;
    apiKey?: string;
    [key: string]: unknown;
}

export type CreateAIModelResponse = { success: true; data: any } | { success: false; error: string };

export const createAIModel = async (params: CreateAIModelParams): Promise<CreateAIModelResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.aiModels).create(params);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to create AI model:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create AI model'
        };
    }
};
