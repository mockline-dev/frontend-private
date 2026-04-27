'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchUsersParams {
    query?: Record<string, unknown>;
}

export type FetchUsersResponse = { success: true; data: unknown } | { success: false; error: string };

export const fetchUsers = async (params?: FetchUsersParams): Promise<FetchUsersResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.users).find(params?.query || {});
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch users:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch users'
        };
    }
};
