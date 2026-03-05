'use server';

import { createFeathersServerClient } from '@/services/feathersServer';

export interface ResetPasswordParams {
    email: string;
    [key: string]: unknown;
}

export type ResetPasswordResponse = { success: true; data: any } | { success: false; error: string };

export const resetPassword = async (params: ResetPasswordParams): Promise<ResetPasswordResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service('users').create({ action: 'resetPassword', ...params });
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to reset password:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to reset password'
        };
    }
};
