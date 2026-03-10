'use server'

import { appRoutes } from '@/config/appRoutes'
import { UserData } from '@/containers/auth/types'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

interface SignInRes {
  error?: string
}

export async function signIn(data: UserData): Promise<SignInRes> {
  const { feathersId, firstName, lastName, jwt, userMeta } = data

  if (!feathersId || !jwt) {
    return { error: 'Invalid sign in data' }
  }

  const cookiesStore = await cookies()

  cookiesStore.set('jwt', jwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  })

  cookiesStore.set(
    'currentUser',
    JSON.stringify({
      feathersId,
      firstName,
      lastName,
      userMeta,
      jwt
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    }
  )

  redirect(appRoutes.home.dashboard)
}
