'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { RollbackResult } from '@/types/feathers';
import { apiServices } from '../services';

export interface RollbackSnapshotParams {
    id: string;
}

export const rollbackSnapshot = async ({ id }: RollbackSnapshotParams): Promise<RollbackResult> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.snapshots).patch(id, { action: 'rollback' });
        return JSON.parse(JSON.stringify(result)) as RollbackResult;
    } catch (err: unknown) {
        console.error('Failed to rollback snapshot:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        throw new Error(error.response?.data?.message || error.message || 'Failed to rollback snapshot');
    }
};
