'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface DeleteFolderParams {
    id: string;
}

export type DeleteFolderResponse = { success: true; data: any } | { success: false; error: string };

export const deleteFolder = async (params: DeleteFolderParams): Promise<DeleteFolderResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.files).remove(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to delete folder:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete folder'
        };
    }
};
