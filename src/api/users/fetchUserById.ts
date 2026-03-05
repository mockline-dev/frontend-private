'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchUserByIdParams {
    id: string;
}

export type FetchUserByIdResponse = { success: true; data: any } | { success: false; error: string };

export const fetchUserById = async (params: FetchUserByIdParams): Promise<FetchUserByIdResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.users).get(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch user by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch user by ID'
        };
    }
};
