'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { StreamAIRequest, StreamAIResponse } from '@/types/feathers';
import { apiServices } from '../services';

export const createAIStream = async (request: StreamAIRequest): Promise<StreamAIResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.aiStream).create(request);
        return JSON.parse(JSON.stringify(result)) as StreamAIResponse;
    } catch (err: unknown) {
        console.error('Failed to create AI stream:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to create AI stream');
    }
};
