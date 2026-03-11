'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Project } from '@/types/feathers';
import { apiServices } from '../services';

export interface DeleteProjectParams {
    id: string;
}

export const deleteProject = async (params: DeleteProjectParams): Promise<Project> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).remove(params.id);
        return JSON.parse(JSON.stringify(result)) as Project;
    } catch (err: unknown) {
        console.error('Failed to delete project:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to delete project');
    }
};
