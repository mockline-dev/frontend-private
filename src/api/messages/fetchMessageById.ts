'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Message } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchMessageByIdParams {
    id: string;
}

export const fetchMessageById = async (params: FetchMessageByIdParams): Promise<Message> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).get(params.id);
        return JSON.parse(JSON.stringify(result)) as Message;
    } catch (err: unknown) {
        console.error('Failed to fetch message by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch message by ID');
    }
};
