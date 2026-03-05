'use server';

import type { File } from '@/services/api/files';
import { createFeathersServerClient } from '@/services/feathersServer';
import { exec } from 'child_process';
import { existsSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import { fetchFileContent } from '../files/fetchFileContent';

const execAsync = promisify(exec);

export interface RunBackendParams {
    projectId: string;
}

export interface BackendRunResult {
    success: boolean;
    message: string;
    project?: {
        name: string;
        description: string;
    };
    files?: {
        total: number;
        mainFile: string;
        hasRequirements: boolean;
        filesList: string[];
    };
    server?: {
        pid: number;
        port: number;
        url: string;
        docsUrl: string;
        redocUrl: string;
        openapiUrl: string;
    };
    validation?: {
        filesValid: boolean;
        mainFileValid: boolean;
        requirementsValid: boolean;
        errors: string[];
    };
    details?: string;
}

export type RunBackendResponse = { success: true; data: BackendRunResult } | { success: false; error: string; data?: BackendRunResult };

export const runBackend = async ({ projectId }: RunBackendParams): Promise<RunBackendResponse> => {
    const tempDir = join(process.cwd(), '.temp-backend');
    
    try {
        const server = await createFeathersServerClient();

        // Get project details
        const project = await server.service('projects').get(projectId);

        if (!project) {
            return { success: false, error: 'Project not found' };
        }

        // Get project files
        const filesResult = await server.service('files').find({
            query: { projectId }
        });

        const files = filesResult.data || [];

        if (files.length === 0) {
            return { success: false, error: 'No files found for this project' };
        }

        // Find main.py or server.py file
        const mainFile = files.find((f: File) =>
            f.name === 'main.py' ||
            f.name === 'server.py' ||
            f.name.endsWith('/main.py') ||
            f.name.endsWith('/server.py')
        );

        if (!mainFile) {
            return { success: false, error: 'No main.py or server.py file found' };
        }

        // Check if requirements.txt exists
        const requirementsFile = files.find((f: File) =>
            f.name === 'requirements.txt' ||
            f.name.endsWith('/requirements.txt')
        );

        // Validate LLM-generated files
        const validation = await validateGeneratedFiles(files, mainFile, requirementsFile);

        if (!validation.filesValid) {
            return {
                success: false,
                error: 'Generated files validation failed',
                data: {
                    success: false,
                    message: 'Validation failed',
                    project: {
                        name: project.name,
                        description: project.description,
                    },
                    validation
                }
            };
        }

        // Create temporary directory for backend
        await mkdir(tempDir, { recursive: true });

        // Download and write all files to temp directory
        const filesList: string[] = [];
        for (const file of files) {
            try {
                // Use the new fetchFileContent function
                const result = await fetchFileContent({ fileId: file._id });
                
                if (!result.success) {
                    throw new Error(result.error);
                }
                
                const content = result.content;
                
                // Write file to temp directory
                const filePath = join(tempDir, file.name);
                await writeFile(filePath, content, 'utf-8');
                filesList.push(file.name);
                
                console.log(`Downloaded and wrote file: ${file.name}`);
            } catch (error) {
                console.error(`Failed to download file ${file.name}:`, error);
                validation.errors.push(`Failed to download ${file.name}: ${error}`);
            }
        }

        // Install Python dependencies
        console.log('Installing Python dependencies...');
        try {
            if (existsSync(join(tempDir, 'requirements.txt'))) {
                // Clean up requirements.txt - remove invalid entries and version constraints
                const requirementsPath = join(tempDir, 'requirements.txt');
                let requirementsContent = await readFile(requirementsPath, 'utf-8');
                
                // Remove version constraints and invalid entries
                requirementsContent = requirementsContent
                    .split('\n')
                    .map((line: string) => {
                        const trimmedLine = line.trim();
                        // Skip empty lines and comments
                        if (!trimmedLine || trimmedLine.startsWith('#')) {
                            return line;
                        }
                        // Remove python version specifications entirely
                        if (trimmedLine.toLowerCase().startsWith('python==')) {
                            return null;
                        }
                        // Remove version constraints (==, >=, <=, ~=, >, <, !=) from packages
                        return trimmedLine.split(/[=<>!~]+/)[0]?.trim() || trimmedLine;
                    })
                    .filter((line: string | null): line is string => line !== null && line.length > 0)
                    .join('\n');
                
                // Write cleaned requirements back
                await writeFile(requirementsPath, requirementsContent, 'utf-8');
                console.log('Cleaned requirements.txt - removed version constraints');
                
                await execAsync('pip install -r requirements.txt', { cwd: tempDir });
                console.log('Dependencies installed successfully');
            } else {
                await execAsync('pip install fastapi uvicorn[standard] python-multipart', { cwd: tempDir });
                console.log('Basic dependencies installed');
            }
        } catch (error) {
            console.error('Failed to install dependencies:', error);
            await cleanupTempDir(tempDir);
            return {
                success: false,
                error: 'Failed to install Python dependencies',
                data: {
                    success: false,
                    message: 'Failed to install dependencies',
                    details: error instanceof Error ? error.message : 'Unknown error',
                    validation
                }
            };
        }

        // Run the FastAPI server
        const port = 8000;
        const moduleName = mainFile.name.replace('.py', '');
        console.log(`Starting FastAPI server on port ${port}...`);
        
        const serverProcess = exec(
            `uvicorn ${moduleName}:app --host 0.0.0.0 --port ${port}`,
            { cwd: tempDir }
        );

        // Wait a bit for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check if server is running
        let serverRunning = false;
        try {
            const healthCheck = await fetch(`http://localhost:${port}/docs`, {
                signal: AbortSignal.timeout(5000)
            });
            serverRunning = healthCheck.ok;
        } catch (error) {
            console.error('Server health check failed:', error);
        }

        if (!serverRunning) {
            serverProcess.kill();
            await cleanupTempDir(tempDir);
            return {
                success: false,
                error: 'Failed to start FastAPI server',
                data: {
                    success: false,
                    message: 'Failed to start server',
                    validation,
                    files: {
                        total: files.length,
                        mainFile: mainFile.name,
                        hasRequirements: !!requirementsFile,
                        filesList
                    }
                }
            };
        }

        const result: BackendRunResult = {
            success: true,
            message: 'Backend server started successfully',
            project: {
                name: project.name,
                description: project.description,
            },
            files: {
                total: files.length,
                mainFile: mainFile.name,
                hasRequirements: !!requirementsFile,
                filesList
            },
            server: {
                pid: serverProcess.pid || 0,
                port,
                url: `http://localhost:${port}`,
                docsUrl: `http://localhost:${port}/docs`,
                redocUrl: `http://localhost:${port}/redoc`,
                openapiUrl: `http://localhost:${port}/openapi.json`
            },
            validation
        };

        console.log('Backend server started successfully:', result);
        return { success: true, data: result };

    } catch (err: unknown) {
        console.error('Failed to run backend:', err);
        await cleanupTempDir(tempDir);
        const error = err as { response?: { data?: { message?: string } }; message?: string };
        return {
            success: false,
            error: error.response?.data?.message || error.message || 'Failed to run backend'
        };
    }
};

async function validateGeneratedFiles(
    files: File[],
    mainFile: File,
    requirementsFile: File | undefined
): Promise<{
    filesValid: boolean;
    mainFileValid: boolean;
    requirementsValid: boolean;
    errors: string[];
}> {
    const errors: string[] = [];
    let mainFileValid = false;
    let requirementsValid = false;

    // Check if main file exists
    if (mainFile) {
        mainFileValid = true;
    } else {
        errors.push('No main.py or server.py file found');
    }

    // Check if requirements.txt exists (optional but recommended)
    if (requirementsFile) {
        requirementsValid = true;
    } else {
        errors.push('No requirements.txt file found (will install basic dependencies)');
    }

    // Check for essential FastAPI files
    const essentialFiles = ['main.py', 'server.py'];
    const hasEssentialFile = files.some(f => essentialFiles.includes(f.name));
    
    if (!hasEssentialFile) {
        errors.push('Missing essential FastAPI files');
    }

    // Check file sizes (LLM might generate empty or very small files)
    for (const file of files) {
        if (file.size === 0) {
            errors.push(`File ${file.name} is empty`);
        } else if (file.size < 50 && file.name.endsWith('.py')) {
            errors.push(`File ${file.name} is too small (${file.size} bytes), might be incomplete`);
        }
    }

    const filesValid = mainFileValid && errors.filter(e => !e.includes('requirements.txt')).length === 0;

    return {
        filesValid,
        mainFileValid,
        requirementsValid,
        errors
    };
}

async function cleanupTempDir(tempDir: string) {
    try {
        if (existsSync(tempDir)) {
            await rm(tempDir, { recursive: true, force: true });
            console.log('Cleaned up temporary directory');
        }
    } catch (error) {
        console.error('Failed to cleanup temp directory:', error);
    }
}
