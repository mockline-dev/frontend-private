import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { FormEvent, useCallback, useState } from 'react'
import { toast } from 'sonner'

import { LoginData } from '@/containers/auth/types'
import { auth, googleProvider } from '@/services/auth/firebase'
import { signIn } from '@/services/auth/signIn'
import feathersClient from '@/services/featherClient'
import { isRedirectError } from 'next/dist/client/components/redirect-error'

type CustomError = { message?: string; code?: string }

export const useLogin = (): {
  errors?: CustomError | undefined
  data: LoginData
  updateData: (value: Partial<LoginData>) => void
  login: (e: FormEvent) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loading: boolean
  googleLoading: boolean
} => {
  const [errors, setErrors] = useState<CustomError | undefined>()
  const [data, setData] = useState<LoginData>({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [googleLoading, setGoogleLoading] = useState<boolean>(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const updateData = useCallback((dataItem: Partial<LoginData>) => {
    setData((prevData) => ({ ...prevData, ...dataItem }))
  }, [])

  const login = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()

      if (loading || googleLoading) return

      setLoading(true)
      setErrors(undefined)

      if (!validateEmail(data.email || '')) {
        setErrors({
          message: 'Invalid email format',
          code: 'auth/invalid-email'
        })
        setLoading(false)
        return
      }

      if (!data.password) {
        setErrors({
          message: 'Password is required',
          code: 'auth/missing-password'
        })
        setLoading(false)
        return
      }

      try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
        const idToken = await userCredential.user.getIdToken()
        const authResponse = await feathersClient.authenticate({
          strategy: 'firebase',
          accessToken: idToken
        })

        await signIn({
          firstName: authResponse.user.firstName,
          lastName: authResponse.user.lastName,
          feathersId: authResponse.user._id,
          jwt: authResponse.accessToken,
          userMeta: userCredential.user.providerData
        })
      } catch (err: unknown) {
        if (isRedirectError(err)) {
          throw err
        }
        const error = err as { code?: string; message?: string }
        const message =
          error.code === 'auth/invalid-credential'
            ? 'Invalid email or password'
            : error.message || 'An unknown error occurred'
        toast.error(message)
        setErrors({ message, ...(error.code !== undefined && { code: error.code }) })
      } finally {
        setLoading(false)
      }
    },
    [data, loading, googleLoading]
  )

  const loginWithGoogle = useCallback(async () => {
    if (loading || googleLoading) return

    setGoogleLoading(true)
    setErrors(undefined)

    try {
      const userCredential = await signInWithPopup(auth, googleProvider)
      const idToken = await userCredential.user.getIdToken()
      const fres = await feathersClient.authenticate({
        strategy: 'firebase',
        accessToken: idToken,
        userData: {
          firstName: userCredential.user.displayName?.split(' ')[0] || '',
          lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || ''
        }
      })

      await signIn({
        feathersId: fres.user._id,
        firstName: userCredential.user.displayName?.split(' ')[0] || '',
        lastName: userCredential.user.displayName?.split(' ').slice(1).join(' ') || '',
        userMeta: userCredential.user.providerData,
        jwt: fres.accessToken
      })
    } catch (err: unknown) {
      if (isRedirectError(err)) {
        throw err
      }
      const error = err as { code?: string; message?: string }
      const message =
        error.code === 'auth/popup-closed-by-user'
          ? 'Google sign-in was cancelled'
          : error.message || 'An unknown error occurred'
      toast.error(message)
      setErrors({ message, ...(error.code !== undefined && { code: error.code }) })
    } finally {
      setGoogleLoading(false)
    }
  }, [loading, googleLoading])

  return {
    data,
    updateData,
    login,
    loginWithGoogle,
    loading,
    googleLoading,
    errors
  }
}
