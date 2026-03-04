import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Dashboard } from '@/containers/dashboard/Dashboard'
import type { Project } from '@/services/api/projects'
import { createFeathersServerClient } from '@/services/feathersServer'

export const revalidate = 30 // ISR: revalidate every 30 seconds

export default async function DashboardPage() {
  let initialProjects: Project[] = []

  try {
    const feathers = await createFeathersServerClient()
    const result = await feathers.service('projects').find({
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
