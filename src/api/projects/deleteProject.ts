'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface DeleteProjectParams {
    id: string;
}

export type DeleteProjectResponse = { success: true; data: any } | { success: false; error: string };

export const deleteProject = async (params: DeleteProjectParams): Promise<DeleteProjectResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).remove(params.id);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to delete project:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to delete project'
        };
    }
};
