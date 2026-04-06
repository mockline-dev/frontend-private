'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Session } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchSessionsParams {
    query?: Record<string, unknown>;
}

export interface PaginatedSessions {
    total?: number;
    limit?: number;
    skip?: number;
    data: Session[];
}

export const fetchSessions = async (params?: FetchSessionsParams): Promise<Session[] | PaginatedSessions> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.sessions).find({ query: params?.query || {} });
        return JSON.parse(JSON.stringify(result)) as Session[] | PaginatedSessions;
    } catch (err: unknown) {
        console.error('Failed to fetch sessions:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch sessions');
    }
};
