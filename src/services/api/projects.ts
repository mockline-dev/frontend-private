import { createProject } from '@/api/projects/createProject';
import { deleteProject } from '@/api/projects/deleteProject';
import { fetchProjectById } from '@/api/projects/fetchProjectById';
import { fetchProjects } from '@/api/projects/fetchProjects';
import { updateProject } from '@/api/projects/updateProject';
import feathersClient from '@/services/featherClient';
import type { CreateProjectData, Project } from '@/types/feathers';

export type { Project, CreateProjectData };

export interface ProjectQuery {
    $sort?: {
        createdAt?: number;
    };
    $limit?: number;
    $skip?: number;
}

export const projectsService = {
    async create(data: CreateProjectData): Promise<Project> {
        return await createProject(data);
    },

    async find(query?: ProjectQuery): Promise<{ data: Project[]; total?: number; limit?: number; skip?: number; $sort?: { createdAt?: number } }> {
        const result = await fetchProjects(query ? { query: query as Record<string, unknown> } : undefined);

        if (Array.isArray(result)) {
            return {
                data: result,
                total: result.length,
                limit: result.length,
                skip: 0
            };
        }

        return {
            data: result.data,
            ...(result.total !== undefined ? { total: result.total } : {}),
            ...(result.limit !== undefined ? { limit: result.limit } : {}),
            ...(result.skip !== undefined ? { skip: result.skip } : {})
        };
    },

    async get(id: string): Promise<Project> {
        return await fetchProjectById({ id });
    },

    async patch(id: string, data: Partial<Project>): Promise<Project> {
        return await updateProject({ id, data });
    },

    async remove(id: string): Promise<Project> {
        return await deleteProject({ id });
    },

    onCreated(callback: (project: Project) => void) {
        feathersClient.service('projects').on('created', callback);
        return () => feathersClient.service('projects').off('created', callback);
    },

    onPatched(callback: (project: Project) => void) {
        feathersClient.service('projects').on('patched', callback);
        return () => feathersClient.service('projects').off('patched', callback);
    },

    onUpdated(callback: (project: Project) => void) {
        feathersClient.service('projects').on('updated', callback);
        return () => feathersClient.service('projects').off('updated', callback);
    },

    onRemoved(callback: (project: Project) => void) {
        feathersClient.service('projects').on('removed', callback);
        return () => feathersClient.service('projects').off('removed', callback);
    }
};
