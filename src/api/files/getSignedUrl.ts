'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface GetSignedUrlParams {
    key: string;
}

export type GetSignedUrlResponse = { success: true; url: string } | { success: false; error: string };

export const getSignedUrl = async (params: GetSignedUrlParams): Promise<GetSignedUrlResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.fileStream).get(params.key);
        
        if (!result || !result.url) {
            return { success: false, error: 'Failed to get signed URL' };
        }
        
        return { success: true, url: result.url };
    } catch (err: unknown) {
        console.error('Failed to get signed URL:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to get signed URL'
        };
    }
};
