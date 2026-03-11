'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Project } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchProjectsParams {
    query?: Record<string, unknown>;
}

export interface PaginatedProjects {
    total?: number;
    limit?: number;
    skip?: number;
    data: Project[];
}

export const fetchProjects = async (params?: FetchProjectsParams): Promise<Project[] | PaginatedProjects> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).find({ query: params?.query || {} });
        return JSON.parse(JSON.stringify(result)) as Project[] | PaginatedProjects;
    } catch (err: unknown) {
        console.error('Failed to fetch projects:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch projects');
    }
};
