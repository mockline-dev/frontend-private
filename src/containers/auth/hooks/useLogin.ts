import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { FormEvent, useCallback, useState } from 'react'
import { toast } from 'sonner'

import { auth, googleProvider } from '@/containers/auth/services/firebase'
import { signIn } from '@/containers/auth/services/signIn'
import feathersClient from '@/services/featherClient'

import { LoginData } from '../types'

type CustomError = { message?: string; code?: string }

export const useLogin = (): {
  errors?: CustomError
  data: LoginData
  updateData: (value: Partial<LoginData>) => void
  login: (e: FormEvent) => Promise<void>
  loginWithGoogle: () => Promise<void>
  loading: boolean
} => {
  const [errors, setErrors] = useState<CustomError | undefined>()
  const [data, setData] = useState<LoginData>({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState<boolean>(false)

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

      if (loading) return

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

      try {
        const userCredential = await signInWithEmailAndPassword(auth, data.email || '', data.password || '')
        const idToken = await userCredential.user.getIdToken()
        const fres = await feathersClient.authenticate({
          strategy: 'firebase',
          accessToken: idToken
        })

        await signIn({
          feathersId: fres.user._id,
          jwt: fres.accessToken,
          userMeta: userCredential.user.providerData
        })
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'An unknown error occurred')
      } finally {
        setLoading(false)
      }
    },
    [data, loading]
  )

  const loginWithGoogle = useCallback(async () => {
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
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred')
    }
  }, [])

  return {
    data,
    updateData,
    login,
    loginWithGoogle,
    loading,
    errors
  }
}
