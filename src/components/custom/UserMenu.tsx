'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { UserData } from '@/containers/auth/types';
import { signOut } from '@/services/signOut';

import { LayoutDashboard, LogOut } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

interface UserMenuProps {
  currentUser: UserData | undefined;
  currentPage: 'dashboard' | 'workspace' | 'initial';
  onNavigate: (page: 'dashboard' | 'workspace' | 'initial') => void;
}

export function UserMenu({currentUser, currentPage, onNavigate }: UserMenuProps) {
  const [open, setOpen] = useState(false);

  const displayName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}`.trim() : 'User';
  const initials = currentUser 
    ? `${currentUser.firstName?.[0] || ''}${currentUser.lastName?.[0] || ''}`.toUpperCase()
    : 'U';
  const email = currentUser?.userMeta?.[0]?.email || 'user@example.com';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium hover:shadow-lg transition-shadow">
        {currentUser?.userMeta?.[0]?.photoURL ? <Image src={currentUser.userMeta[0].photoURL} alt={displayName} width={23} height={23} className="w-full h-full object-cover rounded-full" /> : <span>{initials}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-3 border-b border-border">
          <p className="font-medium text-foreground text-sm">{displayName}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="p-1">
          {currentPage !== 'dashboard' && (
            <button
              onClick={() => {
                onNavigate('dashboard');
                setOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-md transition-colors"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>
          )}
          
          <button
            onClick={() => {
              signOut();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
