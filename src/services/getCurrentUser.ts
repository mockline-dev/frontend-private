import { cookies } from 'next/headers'

import { appRoutes } from '@/config/appRoutes'

import { UserData } from '@/containers/auth/types'
import { redirect } from 'next/navigation'

export const getCurrentUser = async (): Promise<UserData | undefined> => {
  const currentUser = (await cookies()).get('currentUser')?.value

  if (!currentUser) return undefined
  try {
    return JSON.parse(currentUser) as UserData
  } catch {
    return undefined
  }
}


export async function clearAuthAndRedirect(): Promise<never> {
    (await cookies()).delete('currentUser');
    (await cookies()).delete('companyData');
    (await cookies()).delete('jwt');

    redirect(appRoutes.auth.login);
}
  