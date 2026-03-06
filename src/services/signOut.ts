'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { appRoutes } from '@/config/appRoutes'

export const signOut = async () => {
  (await cookies()).delete('currentUser');
  (await cookies()).delete('jwt');

  redirect(appRoutes.signOut)
}
