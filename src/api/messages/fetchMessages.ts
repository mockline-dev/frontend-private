'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Message } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchMessagesParams {
    query?: Record<string, unknown>;
}

export interface PaginatedMessages {
    total?: number;
    limit?: number;
    skip?: number;
    data: Message[];
}

export const fetchMessages = async (params?: FetchMessagesParams): Promise<Message[] | PaginatedMessages> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.messages).find({ query: params?.query || {} });
        return JSON.parse(JSON.stringify(result)) as Message[] | PaginatedMessages;
    } catch (err: unknown) {
        console.error('Failed to fetch messages:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch messages');
    }
};
