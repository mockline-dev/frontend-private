'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface UpdateProjectParams {
    id: string;
    data: Record<string, unknown>;
}

export type UpdateProjectResponse = { success: true; data: any } | { success: false; error: string };

export const updateProject = async (params: UpdateProjectParams): Promise<UpdateProjectResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).patch(params.id, params.data);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to update project:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to update project'
        };
    }
};
