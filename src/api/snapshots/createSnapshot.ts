'use server';

import { createFeathersServerClient } from '@/services/feathersServer';
import { Snapshot } from '@/types/feathers';
import { apiServices } from '../services';

export const createSnapshot = async (data: Partial<Snapshot>): Promise<Snapshot> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.snapshots).create(data);
        return result;
    } catch (error) {
        console.error('Failed to create snapshot:', error);
        throw new Error('Failed to create snapshot: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};
