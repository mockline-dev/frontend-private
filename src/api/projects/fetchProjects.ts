'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface FetchProjectsParams {
    query?: Record<string, unknown>;
}

export type FetchProjectsResponse = { success: true; data: any } | { success: false; error: string };

export const fetchProjects = async (params?: FetchProjectsParams): Promise<FetchProjectsResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).find(params?.query || {});
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
    } catch (err: unknown) {
        console.error('Failed to fetch projects:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to fetch projects'
        };
    }
};
