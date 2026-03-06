
import { Dashboard } from '@/containers/dashboard/Dashboard'
import type { Project } from '@/services/api/projects'
import { createFeathersServerClient } from '@/services/feathersServer'
import { clearAuthAndRedirect, getCurrentUser } from '@/services/getCurrentUser'

export const revalidate = 30 // ISR: revalidate every 30 seconds

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
          clearAuthAndRedirect();
          return null;
      }
      
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
      <Dashboard currentUser={currentUser} initialProjects={initialProjects} />
  )
}
