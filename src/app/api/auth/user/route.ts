import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { UserData } from '@/types/auth'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const currentUserCookie = cookieStore.get('currentUser')?.value
    
    if (!currentUserCookie) {
      return NextResponse.json({ user: null })
    }
    
    const user: UserData = JSON.parse(currentUserCookie)
    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ user: null })
  }
}