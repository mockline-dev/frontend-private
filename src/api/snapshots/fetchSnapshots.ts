'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Snapshot } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchSnapshotsParams {
    query?: Record<string, unknown>;
}

export interface PaginatedSnapshots {
    total?: number;
    limit?: number;
    skip?: number;
    data: Snapshot[];
}

export const fetchSnapshots = async (params?: FetchSnapshotsParams): Promise<Snapshot[] | PaginatedSnapshots> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.snapshots).find({ query: params?.query || {} });
        return JSON.parse(JSON.stringify(result)) as Snapshot[] | PaginatedSnapshots;
    } catch (err: unknown) {
        console.error('Failed to fetch Snapshots:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch snapshots');
    }
};
