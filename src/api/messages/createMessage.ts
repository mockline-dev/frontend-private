'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface CreateMessageParams {
    conversationId?: string;
    projectId?: string;
    content: string;
    role?: string;
    [key: string]: unknown;
}

export type CreateMessageResponse = { success: true; data: any } | { success: false; error: string };

export const createMessage = async (params: CreateMessageParams): Promise<CreateMessageResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).create(params);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to create message:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create message'
        };
    }
};
