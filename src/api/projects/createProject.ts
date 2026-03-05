'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface CreateProjectParams {
    name: string;
    description?: string;
    userId?: string;
    [key: string]: unknown;
}

export type CreateProjectResponse = { success: true; data: any } | { success: false; error: string };

export const createProject = async (params: CreateProjectParams): Promise<CreateProjectResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).create(params);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to create project:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to create project'
        };
    }
};
