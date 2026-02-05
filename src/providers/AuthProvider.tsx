'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUserClient } from '@/services/getCurrentUserClient'
import { UserData } from '@/types/auth'

interface AuthContextType {
  user: UserData | null
  loading: boolean
  isAuthenticated: boolean
  savedPrompt: string | null
  setSavedPrompt: (prompt: string | null) => void
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
  const [savedPrompt, setSavedPrompt] = useState<string | null>(null)
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
    // If there's a saved prompt, navigate to workspace with it
    if (savedPrompt) {
      router.push(`/workspace?prompt=${encodeURIComponent(savedPrompt)}`)
      setSavedPrompt(null)
    } else {
      router.push('/dashboard')
    }
  }

  const logout = async () => {
    try {
      // Call the signOut service
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      setSavedPrompt(null)
      // Clear session storage
      sessionStorage.removeItem('savedPrompt')
      router.push('/')
    } catch (error) {
      console.error('Logout failed:', error)
      // Even if the API call fails, clear local state
      setUser(null)
      setSavedPrompt(null)
      sessionStorage.removeItem('savedPrompt')
      router.push('/')
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  // Load saved prompt from sessionStorage on mount (more secure than localStorage)
  useEffect(() => {
    const saved = sessionStorage.getItem('savedPrompt')
    if (saved) {
      setSavedPrompt(saved)
    }
  }, [])

  // Save prompt to sessionStorage whenever it changes (clears on browser close)
  useEffect(() => {
    if (savedPrompt) {
      sessionStorage.setItem('savedPrompt', savedPrompt)
    } else {
      sessionStorage.removeItem('savedPrompt')
    }
  }, [savedPrompt])

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    savedPrompt,
    setSavedPrompt,
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