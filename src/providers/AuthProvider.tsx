'use client'

import { getCurrentUserClient } from '@/services/getCurrentUserClient'
import { UserData } from '@/types/auth'
import { clearSavedPrompt, getSavedPrompt } from '@/utils/promptStorage'
import { useRouter } from 'next/navigation'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: UserData | null
  loading: boolean
  isAuthenticated: boolean
  login: (userData: UserData) => void
  logout: () => void
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = async () => {
    try {
      setLoading(true)
      const currentUser = await getCurrentUserClient()
      setUser(currentUser || null)
    } catch (error) {
      console.error('Auth check failed:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = (userData: UserData) => {
    setUser(userData)
    // Check for saved prompt in sessionStorage and navigate to workspace
    const pendingPrompt = getSavedPrompt()
    if (pendingPrompt) {
      router.push(`/workspace?prompt=${encodeURIComponent(pendingPrompt)}`)
      clearSavedPrompt()
    } else {
      router.push('/dashboard')
    }
  }

  const logout = async () => {
    try {
      // Call the signOut service
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      // Clear session storage using utility function
      clearSavedPrompt()
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if the API call fails, clear local state
      setUser(null)
      clearSavedPrompt()
      router.push('/')
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    checkAuth
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}