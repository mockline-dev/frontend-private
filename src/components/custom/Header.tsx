import { UserData } from '@/containers/auth/types'
import Image from 'next/image'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '../ui/button'
import { UserMenu } from './UserMenu'

interface HeaderProps {
  currentUser: UserData | null
  onNavigateClick: (page: 'dashboard' | 'workspace' | 'initial') => void
  currentPage: 'dashboard' | 'workspace' | 'initial'
}

export default function Header({ currentUser, onNavigateClick, currentPage }: HeaderProps) {
  return (
    <div className="animate-element animate-delay-100 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/logo.png"
          alt="Mockline Logo"
          width={26}
          height={26}
          className="text-primary-foreground"
        />
        <span className="font-semibold text-foreground text-lg">mockline.dev</span>
      </Link>

      <div className="flex items-center gap-4">
        {currentUser ? (
          <>
            <Button
              onClick={() => onNavigateClick(currentPage)}
              variant="outline"
              size="sm"
              className={`${currentPage === 'dashboard' ? 'hidden' : ''}`}
            >
              {currentPage === 'initial' ? 'Dashboard' : ''}
            </Button>
            <UserMenu currentUser={currentUser} currentPage={currentPage} onNavigate={onNavigateClick} />
          </>
        ) : (
          <Button
            onClick={() => redirect('/auth/login')}
            variant="outline"
            size="sm"
            className="bg-card/80 backdrop-blur-sm border-border hover:bg-card/90"
          >
            Sign In
          </Button>
        )}
      </div>
    </div>
  )
}
