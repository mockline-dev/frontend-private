import { cookies } from 'next/headers'

import { UserData } from '@/types/auth'

export const getCurrentUser = async (): Promise<UserData | undefined> => {
  const currentUser = (await cookies()).get('currentUser')?.value

  return currentUser ? (JSON.parse(currentUser) as UserData) : undefined
}
