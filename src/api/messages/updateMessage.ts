'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface UpdateMessageParams {
    id: string;
    data: Record<string, unknown>;
}

export type UpdateMessageResponse = { success: true; data: any } | { success: false; error: string };

export const updateMessage = async (params: UpdateMessageParams): Promise<UpdateMessageResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).patch(params.id, params.data);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to update message:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update message'
        };
    }
};
