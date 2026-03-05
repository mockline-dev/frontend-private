'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface DeleteUserParams {
    id: string;
}

export type DeleteUserResponse = { success: true; data: any } | { success: false; error: string };

export const deleteUser = async (params: DeleteUserParams): Promise<DeleteUserResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.users).remove(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to delete user:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete user'
        };
    }
};
