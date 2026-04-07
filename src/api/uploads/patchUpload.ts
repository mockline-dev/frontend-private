'use server';

import { createFeathersServerClient } from '@/services/feathersServer';

import { apiServices } from '../services';

import { UploadUpdateData, UploadPartResponse } from './types';

export const patchUpload = async (id: string, data: UploadUpdateData): Promise<UploadPartResponse> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.uploads).patch(id, data);
        return result;
    } catch (error) {
        console.error('Failed to patch upload:', error);
        throw new Error('Failed to patch upload: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};
