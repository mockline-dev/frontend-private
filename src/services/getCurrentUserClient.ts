'use client'

import { UserData } from '@/types/auth'

export const getCurrentUserClient = async (): Promise<UserData | undefined> => {
  try {
    const response = await fetch('/api/auth/user', {
      method: 'GET',
      credentials: 'include'
    })
    
    if (!response.ok) {
      return undefined
    }
    
    const data = await response.json()
    return data.user || undefined
  } catch (error) {
    console.error('Failed to get current user:', error)
    return undefined
  }
}