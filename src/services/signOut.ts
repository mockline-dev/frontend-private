'use server'

import { appRoutes } from '@/config/appRoutes'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const signOut = async () => {
  ;(await cookies()).delete('currentUser')
  ;(await cookies()).delete('jwt')

  redirect(appRoutes.auth.login)
}
