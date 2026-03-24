'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { AIStreamPatchRequest } from '@/types/feathers';
import { apiServices } from '../services';

export const patchAIStream = async ({ projectId, action, updateId }: AIStreamPatchRequest): Promise<void> => {
    try {
        const server = await createFeathersServerClient();
        await server.service(apiServices.aiStream).patch(projectId, { action, updateId });
    } catch (err: unknown) {
        console.error('[patchAIStream] Failed:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to patch AI stream');
    }
};
