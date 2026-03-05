'use client'

import { getCurrentUser } from '@/api/auth/getCurrentUser';
import { UserData } from '@/types/auth';

export const getCurrentUserClient = async (): Promise<UserData | undefined> => {
  try {
    const result = await getCurrentUser();
    
    if (!result.success) {
      console.error('Failed to get current user:', result.error);
      return undefined;
    }
    
    return result.user || undefined;
  } catch (error) {
    console.error('Failed to get current user:', error)
    return undefined
  }
}