'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface EnhancePromptParams {
    userPrompt: string;
}

export type EnhancePromptResponse = { enhancedPrompt: string };

export const enhancePrompt = async (params: EnhancePromptParams): Promise<EnhancePromptResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.enhancePrompt).create(params);
        return { enhancedPrompt: result.enhancedPrompt };
    } catch (err: unknown) {
        console.error('Failed to enhance prompt:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to enhance prompt');
    }
};
