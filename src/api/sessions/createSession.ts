'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { CreateSessionData, Session } from '@/types/feathers';
import { apiServices } from '../services';

export const createSession = async (params: CreateSessionData): Promise<Session> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.sessions).create(params);
        return JSON.parse(JSON.stringify(result)) as Session;
    } catch (err: unknown) {
        console.error('Failed to create session:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to create session');
    }
};
