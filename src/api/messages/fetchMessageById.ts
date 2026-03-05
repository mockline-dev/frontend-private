'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchMessageByIdParams {
    id: string;
}

export type FetchMessageByIdResponse = { success: true; data: any } | { success: false; error: string };

export const fetchMessageById = async (params: FetchMessageByIdParams): Promise<FetchMessageByIdResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).get(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch message by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch message by ID'
        };
    }
};
