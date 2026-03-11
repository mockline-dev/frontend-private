'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Message } from '@/types/feathers';
import { apiServices } from '../services';

export interface DeleteMessageParams {
    id: string;
}

export const deleteMessage = async (params: DeleteMessageParams): Promise<Message> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).remove(params.id);
        return JSON.parse(JSON.stringify(result)) as Message;
    } catch (err: unknown) {
        console.error('Failed to delete message:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to delete message');
    }
};
