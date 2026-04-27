'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface CreateUserParams {
    email: string;
    password: string;
    name?: string;
    [key: string]: unknown;
}

export type CreateUserResponse = { success: true; data: unknown } | { success: false; error: string };

export const createUser = async (params: CreateUserParams): Promise<CreateUserResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.users).create(params);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to create user:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create user'
        };
    }
};
