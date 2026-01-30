import { cookies } from 'next/headers'

import { UserData } from '../containers/auth/types'

export const getCurrentUser = async (): Promise<UserData | undefined> => {
  const currentUser = (await cookies()).get('currentUser')?.value

  return currentUser ? (JSON.parse(currentUser) as UserData) : undefined
}
