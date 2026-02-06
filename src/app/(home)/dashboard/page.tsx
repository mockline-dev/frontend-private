import { Dashboard } from '@/containers/dashboard/Dashboard'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { createFeathersServerClient } from '@/services/feathersServer'
import type { AIProject } from '@/services/api/aiProjects'

export default async function DashboardPage() {
  let initialProjects: AIProject[] = []

  try {
    const feathers = await createFeathersServerClient()
    const result = await feathers.service('ai-projects').find({
      query: {
        $sort: { createdAt: -1 },
        $limit: 10
      }
    })
    initialProjects = result?.data || []
  } catch (error) {
    console.error('Failed to load initial dashboard data:', error)
  }

  return (
    <ProtectedRoute>
      <Dashboard initialProjects={initialProjects} />
    </ProtectedRoute>
  )
}
