import { createProject } from '@/api/projects/createProject';
import { deleteProject } from '@/api/projects/deleteProject';
import { fetchProjectById } from '@/api/projects/fetchProjectById';
import { fetchProjects } from '@/api/projects/fetchProjects';
import { updateProject } from '@/api/projects/updateProject';
import feathersClient from '@/services/featherClient';

export interface Project {
    _id: string;
    userId: string;
    name: string;
    description: string;
    framework: string;
    language: string;
    model: string;
    status: 'initializing' | 'generating' | 'ready' | 'error';
    errorMessage?: string;
    createdAt: number;
    updatedAt: number;
    // Progress tracking fields
    filesGenerated?: number;
    totalFiles?: number;
    generationProgress?: number;
    currentStage?: string;
}

export interface CreateProjectData {
    name: string;
    description: string;
    framework: string;
    language: string;
    model: string;
    [key: string]: unknown;
}

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
            total: result.total,
            limit: result.limit,
            skip: result.skip
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

    // Real-time event listeners - Note: These should use feathersClient for real-time updates
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
