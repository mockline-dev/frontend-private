'use server';

import { projectsService } from '@/services/api/projects';
import { createFeathersServerClient } from '@/services/feathersServer';
import JSZip from 'jszip';
import { fetchFileContent } from '../files/fetchFileContent';
import { fetchFiles } from '../files/fetchFiles';

export interface DownloadProjectParams {
    projectId: string;
}

export interface DownloadProjectData {
    zipBase64: string;
    filename: string;
}

export type DownloadProjectResponse = { success: true; data: DownloadProjectData } | { success: false; error: string };

const MAX_FILE_FETCH_ATTEMPTS = 2;

const toProjectRelativePath = (file: { key: string; name: string }): string => {
    const key = file.key || '';
    const projectsPrefix = 'projects/';

    if (key.startsWith(projectsPrefix)) {
        const firstSlashAfterProjectId = key.indexOf('/', projectsPrefix.length);
        if (firstSlashAfterProjectId !== -1 && firstSlashAfterProjectId + 1 < key.length) {
            return key.slice(firstSlashAfterProjectId + 1);
        }
    }

    return file.name;
};

const getFileContentWithRetry = async (fileId: string, fileName: string): Promise<string> => {
    let lastError: string | null = null;

    for (let attempt = 1; attempt <= MAX_FILE_FETCH_ATTEMPTS; attempt++) {
        try {
            const result = await fetchFileContent({ fileId });
            if (result.success) {
                return result.content;
            }

            lastError = result.error;
        } catch (error) {
            lastError = error instanceof Error ? error.message : 'Unknown error';
        }

        console.warn(`[downloadProject] Retry ${attempt}/${MAX_FILE_FETCH_ATTEMPTS} failed for ${fileName}`);
    }

    throw new Error(lastError || `Failed to fetch content for ${fileName}`);
};

export const downloadProject = async ({ projectId }: DownloadProjectParams): Promise<DownloadProjectResponse> => {
    try {
        const server = await createFeathersServerClient();

        const auth = await server.get('authentication');
        const userId = auth?.user?._id;

        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const project = await projectsService.get(projectId);
        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        if (project.userId !== userId) {
            return { success: false, error: 'You do not have permission to access this project' };
        }

        const filesResult = await fetchFiles({ query: { projectId, $sort: { name: 1 }, $limit: 200 } });
        const files = Array.isArray(filesResult) ? filesResult : filesResult?.data || [];

        if (files.length === 0) {
            return { success: false, error: 'No files found for this project' };
        }

        const zip = new JSZip();
        const failedFiles: string[] = [];

        for (const file of files) {
            try {
                const fileContent = await getFileContentWithRetry(file._id, file.name);
                const relativePath = toProjectRelativePath(file);
                zip.file(relativePath, fileContent);
            } catch (error) {
                console.error(`Error processing file ${file.name}:`, error);
                failedFiles.push(file.name);
            }
        }

        if (failedFiles.length > 0) {
            return {
                success: false,
                error: `Failed to download ${failedFiles.length} file(s): ${failedFiles.join(', ')}`
            };
        }

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
