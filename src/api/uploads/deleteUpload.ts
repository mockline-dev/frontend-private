'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface DeleteUploadParams {
    id: string;
}

export type DeleteUploadResponse = { success: true; data: any } | { success: false; error: string };

export const deleteUpload = async (params: DeleteUploadParams): Promise<DeleteUploadResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.uploads).remove(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to delete upload:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete upload'
        };
    }
};
