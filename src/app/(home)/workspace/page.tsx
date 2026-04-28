import { Workspace } from '@/containers/workspace/Workspace';

import type { AIFile } from '@/services/api/files';
import { createFeathersServerClient } from '@/services/feathersServer';
import { clearAuthAndRedirect, getCurrentUser } from '@/services/getCurrentUser';

interface WorkspacePageProps {
    searchParams?: {
        projectId?: string;
    };
}

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        await clearAuthAndRedirect();
        return null;
    }

    const projectId = (await searchParams)?.projectId;
    let initialProject = null;
    let initialFiles: AIFile[] = [];

    if (projectId) {
        try {
            const feathers = await createFeathersServerClient();
            initialProject = await feathers.service('projects').get(projectId);
            const filesResult = await feathers.service('files').find({
                query: { projectId }
            });
            initialFiles = filesResult?.data || [];
        } catch (error) {
            console.error('Failed to load initial workspace data:', error);
        }
    }

    return <Workspace currentUser={currentUser} initialProjectId={projectId} initialProject={initialProject} initialFiles={initialFiles} />;
}
