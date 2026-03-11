'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { CreateProjectData, Project } from '@/types/feathers';
import { apiServices } from '../services';

export const createProject = async (params: CreateProjectData): Promise<Project> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).create(params);
        return JSON.parse(JSON.stringify(result)) as Project;
    } catch (err: unknown) {
        const error = err as {
            response?: { data?: { message?: string; errors?: Record<string, unknown> } };
            message?: string;
            data?: { errors?: Record<string, unknown> };
        };

        console.error('Failed to create project:', {
            message: error.message,
            responseData: error.response?.data,
            validationErrors: error.response?.data?.errors || error.data?.errors,
            fullError: err
        });

        throw new Error(error.response?.data?.message || error.message || 'Failed to create project');
    }
};
