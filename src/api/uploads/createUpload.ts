'use server';

import { createFeathersServerClient } from '@/services/feathersServer';

import { apiServices } from '../services';

import { Upload, UploadCreateData } from './types';

export const createUpload = async (data: UploadCreateData): Promise<Upload> => {
    try {
        const server = await createFeathersServerClient();
        const result = await server.service(apiServices.uploads).create(data);
        return result;
    } catch (error) {
        console.error('Failed to create upload:', error);
        throw new Error('Failed to create upload: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
};
