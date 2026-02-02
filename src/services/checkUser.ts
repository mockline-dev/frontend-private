'use server'

import { redirect } from 'next/navigation'

import { appRoutes } from '@/config/appRoutes'
import { getCurrentUser } from '@/services/getCurrentUser'

export const CheckUser = async () => {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect(appRoutes.auth.login)
  }

  redirect(appRoutes.home.dashboard)
}
