'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { appPaths } from '@/config/appRoutes'
import { UserData } from '../types'

interface SignInRes {
  error?: string
}

export async function signIn(data: UserData): Promise<SignInRes> {
  const { feathersId, firstName, lastName, jwt, userMeta } = data

  ;(await cookies()).set('jwt', jwt || '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/'
  })
  ;(await cookies()).set(
    'currentUser',
    JSON.stringify({
      feathersId,
      firstName,
      lastName,
      userMeta
    }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    }
  )

  redirect(appPaths.categories)
}
