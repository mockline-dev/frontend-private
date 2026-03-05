'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchMessagesParams {
    query?: Record<string, unknown>;
}

export type FetchMessagesResponse = { success: true; data: any } | { success: false; error: string };

export const fetchMessages = async (params?: FetchMessagesParams): Promise<FetchMessagesResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).find(params?.query || {});
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch messages:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch messages'
        };
    }
};
