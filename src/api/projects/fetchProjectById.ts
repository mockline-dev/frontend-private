'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Project } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchProjectByIdParams {
    id: string;
}

export const fetchProjectById = async (params: FetchProjectByIdParams): Promise<Project> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).get(params.id);
        return JSON.parse(JSON.stringify(result)) as Project;
    } catch (err: unknown) {
        console.error('Failed to fetch project by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch project by ID');
    }
};
