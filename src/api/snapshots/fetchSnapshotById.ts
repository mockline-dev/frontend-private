'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Snapshot } from '@/types/feathers';
import { apiServices } from '../services';

export interface FetchSnapshotByIdParams {
    id: string;
}

export const fetchSnapshotById = async (params: FetchSnapshotByIdParams): Promise<Snapshot> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.snapshots).get(params.id);
        return JSON.parse(JSON.stringify(result)) as Snapshot;
    } catch (err: unknown) {
        console.error('Failed to fetch snapshot by ID:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to fetch snapshot by ID');
    }
};
