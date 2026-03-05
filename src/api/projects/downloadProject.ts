'use server';

import { filesService } from '@/services/api/files';
import { projectsService } from '@/services/api/projects';
import { createFeathersServerClient } from '@/services/feathersServer';
import JSZip from 'jszip';
import { fetchFileContent } from '../files/fetchFileContent';

export interface DownloadProjectParams {
    projectId: string;
}

export interface DownloadProjectData {
    zipBase64: string;
    filename: string;
}

export type DownloadProjectResponse = { success: true; data: DownloadProjectData } | { success: false; error: string };

export const downloadProject = async ({ projectId }: DownloadProjectParams): Promise<DownloadProjectResponse> => {
    try {
        const server = await createFeathersServerClient();
        
        // Get authenticated user from Feathers
        const auth = await server.get('authentication');
        const userId = auth?.user?._id;
        
        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        // Fetch project metadata
        const project = await projectsService.get(projectId);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        // Verify ownership
        if (project.userId !== userId) {
            return { success: false, error: 'You do not have permission to access this project' };
        }

        // Fetch all files for project
        const filesResult = await filesService.find({ projectId });
        const files = filesResult.data || [];

        if (files.length === 0) {
            return { success: false, error: 'No files found for this project' };
        }

        // Create zip file
        const zip = new JSZip();
        const failedFiles: string[] = [];

        for (const file of files) {
            try {
                const result = await fetchFileContent({ fileId: file._id });
                if (result.success) {
                    zip.file(file.name, result.content);
                } else {
                    console.error(`Failed to fetch content for file: ${file.name}`, result.error);
                    failedFiles.push(file.name);
                }
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                failedFiles.push(file.name);
            }
        }

        if (failedFiles.length > 0) {
            console.warn(
                `WARNING: ${failedFiles.length} file(s) failed to download for project ${projectId}: ${failedFiles.join(', ')}`
            );
        }

        // Generate zip file
        const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });
        const zipBase64 = Buffer.from(zipBuffer).toString('base64');
        const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`;

        return { success: true, data: { zipBase64, filename } };
    } catch (err: unknown) {
        console.error('Failed to download project:', err);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to download project'
        };
    }
};
