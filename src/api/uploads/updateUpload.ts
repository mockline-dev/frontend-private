'use server';

import { createFeathersServerClient } from '@/services/feathersServer';

import { apiServices } from '../services';

import { Upload, UploadCompleteData } from './types';

export const updateUpload = async (id: string, data: UploadCompleteData): Promise<Upload> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.uploads).update(id, data);
        return result;
    } catch (error) {
        console.error('Failed to update upload:', error);
        throw new Error('Failed to update upload: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};
