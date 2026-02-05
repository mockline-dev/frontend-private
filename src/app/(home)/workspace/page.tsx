import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Workspace } from '@/containers/workspace/Workspace'

export default function WorkspacePage() {
  return (
    <ProtectedRoute>
      <Workspace />
    </ProtectedRoute>
  )
}