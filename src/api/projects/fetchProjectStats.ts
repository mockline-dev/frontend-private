'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { apiServices } from '../services';

export interface ProjectStats {
    total: number;
    byStatus: Record<string, number>;
    thisWeek: number;
}

export const fetchProjectStats = async (userId: string): Promise<ProjectStats> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.projects).stats({}, { query: { userId } });
        return JSON.parse(JSON.stringify(result)) as ProjectStats;
    } catch (err: unknown) {
        console.error('Failed to fetch project stats:', err);
        return { total: 0, byStatus: {}, thisWeek: 0 };
    }
};
