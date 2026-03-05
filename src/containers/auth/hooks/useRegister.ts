'use client'

import { createUserWithEmailAndPassword } from 'firebase/auth'
import { isRedirectError } from 'next/dist/client/components/redirect-error'
import { FormEvent, useCallback, useState } from 'react'

import feathersClient from '@/services/featherClient'

import { auth } from '@/services/auth/firebase'
import { signIn } from '@/services/auth/signIn'
import { toast } from 'sonner'
import { InitialData } from '../types'

export const useRegister = (): {
  data: InitialData
  updateData: (value: Partial<InitialData>) => void
  register: (e: FormEvent) => Promise<void>
  loading: boolean
  validatePassword: (password: string) => void
  validateConfirmPassword: (password: string, confirmPassword: string) => void
} => {
  const [data, setData] = useState<InitialData>({
    firstName: '',
    lastName: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState<boolean>(false)
  const updateData = useCallback((dataItem: Partial<InitialData>) => {
    setData((prevData) => ({ ...prevData, ...dataItem }))
  }, [])

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.')
    }
  }

  const validateConfirmPassword = (password: string, confirmPassword: string) => {
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
    }
  }

  const getFirebaseErrorMessage = (code: string): string => {
    switch (code) {
      case 'auth/invalid-email':
        return 'The email address is badly formatted.'
      case 'auth/email-already-in-use':
        return 'The email address is already in use.'
      case 'auth/too-many-requests':
        return 'Too many requests. Please try again later.'
      case 'auth/weak-password':
        return 'Password is too weak.'
      case 'auth/missing-password':
        return 'Password is required.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }

  const register = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setLoading(true)

      if (!data.email || !data.password || !data.firstName || !data.lastName) {
        toast.error('All fields are required.')
        setLoading(false)
        return
      }

      if (!validateEmail(data.email)) {
        toast.error('Invalid email format.')
        setLoading(false)
        return
      }

      if (data.password.length < 8) {
        toast.error('Password must be at least 8 characters long.')
        setLoading(false)
        return
      }

      try {
        const res = await createUserWithEmailAndPassword(auth, data.email, data.password)
        const firebaseIdToken = await res.user.getIdToken(true)

        const authResponse = await feathersClient.authenticate({
          accessToken: firebaseIdToken,
          userData: {
            firstName: data.firstName,
            lastName: data.lastName
          },
          strategy: 'firebase'
        })

        await signIn({
          firstName: data.firstName,
          lastName: data.lastName,
          jwt: authResponse.accessToken,
          feathersId: authResponse.user._id,
          userMeta: res.user.providerData
        })
      } catch (err) {
        if (isRedirectError(err)) {
          throw err
        }
        const error = err as { code?: string; message?: string; name?: string }

        if (error.code || error.name === 'FirebaseError') {
          const message = getFirebaseErrorMessage(error?.code || error?.name || '')
          toast.error(message)
        } else {
          toast.error('An unexpected error occurred. Please try again.')
        }
      } finally {
        setLoading(false)
      }
    },
    [data]
  )

  return {
    data,
    updateData,
    register,
    loading,
    validatePassword,
    validateConfirmPassword
  }
}
