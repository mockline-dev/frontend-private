'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { CreateMessageData, Message } from '@/types/feathers';
import { apiServices } from '../services';

export const createMessage = async (params: CreateMessageData): Promise<Message> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).create(params);
        return JSON.parse(JSON.stringify(result)) as Message;
    } catch (err: unknown) {
        console.error('Failed to create message:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to create message');
    }
};
