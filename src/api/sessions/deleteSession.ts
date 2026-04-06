'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Session } from '@/types/feathers';
import { apiServices } from '../services';

export interface DeleteSessionParams {
    id: string;
}

export const deleteSession = async (params: DeleteSessionParams): Promise<Session> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.sessions).remove(params.id);
        return JSON.parse(JSON.stringify(result)) as Session;
    } catch (err: unknown) {
        console.error('Failed to delete session:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to delete session');
    }
};
