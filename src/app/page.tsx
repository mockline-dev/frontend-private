import { InitialScreen } from '@/containers/initialScreen/InitialScreen'
import { clearAuthAndRedirect, getCurrentUser } from '@/services/getCurrentUser'

export default async function HomePage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    clearAuthAndRedirect()
    return null
  }

  return <InitialScreen currentUser={currentUser} />
}
