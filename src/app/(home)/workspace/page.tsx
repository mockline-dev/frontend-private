import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Workspace } from '@/containers/workspace/Workspace'
import type { AIProject } from '@/services/api/aiProjects'
import type { AIFile } from '@/services/api/files'
import { createFeathersServerClient } from '@/services/feathersServer'

interface WorkspacePageProps {
  searchParams?: {
    projectId?: string
  }
}

export default async function WorkspacePage({ searchParams }: WorkspacePageProps) {
  const projectId = (await searchParams)?.projectId
  let initialProject: AIProject | null = null
  let initialFiles: AIFile[] = []

  if (projectId) {
    try {
      const feathers = await createFeathersServerClient()
      initialProject = await feathers.service('ai-projects').get(projectId)
      const filesResult = await feathers.service('ai-files').find({
        query: { projectId }
      })
      initialFiles = filesResult?.data || []
    } catch (error) {
      console.error('Failed to load initial workspace data:', error)
    }
  }

  return (
    <ProtectedRoute>
      <Workspace
        initialProjectId={projectId}
        initialProject={initialProject}
        initialFiles={initialFiles}
      />
    </ProtectedRoute>
  )
}