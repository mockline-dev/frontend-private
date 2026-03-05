'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface UpdateFolderParams {
    id: string;
    data: Record<string, unknown>;
}

export type UpdateFolderResponse = { success: true; data: any } | { success: false; error: string };

export const updateFolder = async (params: UpdateFolderParams): Promise<UpdateFolderResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).patch(params.id, params.data);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to update folder:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update folder'
        };
    }
};
