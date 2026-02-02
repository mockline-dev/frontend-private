'use server'

import { redirect } from 'next/navigation'
import { FC } from 'react'

import { appRoutes } from '@/config/appRoutes'
import { getCurrentUser } from '@/services/getCurrentUser'

export const CheckUser: FC = async () => {
  const user = await getCurrentUser()
  if (user) {
    redirect(appRoutes.categories)
  } else {
    redirect(appRoutes.signOut)
  }
}
