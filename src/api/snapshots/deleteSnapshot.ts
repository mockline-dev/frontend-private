'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Snapshot } from '@/types/feathers';
import { apiServices } from '../services';

export interface DeleteSnapshotParams {
    id: string;
}

export const deleteSnapshot = async (params: DeleteSnapshotParams): Promise<Snapshot> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.snapshots).remove(params.id);
        return JSON.parse(JSON.stringify(result)) as Snapshot;
    } catch (err: unknown) {
        console.error('Failed to delete snapshot:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to delete snapshot');
    }
};
