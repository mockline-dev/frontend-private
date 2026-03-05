'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { UserData } from '@/types/auth';

export type GetCurrentUserResponse = { success: true; user: UserData | null } | { success: false; error: string };

export const getCurrentUser = async (): Promise<GetCurrentUserResponse> => {
    try {
        const server = await createFeathersServerClient();
        const auth = await server.get('authentication');
        const user = auth?.user || null;
        
        return { success: true, user: JSON.parse(JSON.stringify(user)) };
    } catch (err: unknown) {
        console.error('Failed to get current user:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to get current user'
        };
    }
};
