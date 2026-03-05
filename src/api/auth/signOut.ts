'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { cookies } from 'next/headers';

export type SignOutResponse = { success: true } | { success: false; error: string };

export const signOut = async (): Promise<SignOutResponse> => {
    try {
        // Call Feathers logout
        const server = await createFeathersServerClient();
        await server.logout();
        
        // Clear all authentication cookies
        const cookieStore = await cookies();
        cookieStore.delete('currentUser');
        cookieStore.delete('jwt');
        
        // Set expired cookies to ensure they're cleared on all browsers
        cookieStore.set('currentUser', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/'
        });
        
        cookieStore.set('jwt', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0,
            path: '/'
        });
        
        return { success: true };
    } catch (err: unknown) {
        console.error('Failed to sign out:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to sign out'
        };
    }
};
