'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface InferProjectMetaParams {
    enhancedPrompt: string;
}

export interface InferProjectMetaResponse {
    name: string;
    description: string;
}

export const inferProjectMeta = async (params: InferProjectMetaParams): Promise<InferProjectMetaResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.inferProjectMeta).create(params);
        return JSON.parse(JSON.stringify(result)) as InferProjectMetaResponse;
    } catch (err: unknown) {
        console.error('Failed to infer project metadata:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to infer project metadata');
    }
};
