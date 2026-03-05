'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface GenerateAIResponseParams {
    prompt: string;
    conversationId?: string;
    projectId?: string;
    modelId?: string;
    [key: string]: unknown;
}

export type GenerateAIResponseResponse = { success: true; data: any } | { success: false; error: string };

export const generateAIResponse = async (params: GenerateAIResponseParams): Promise<GenerateAIResponseResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.aiService).create(params);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to generate AI response:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to generate AI response'
        };
    }
};
