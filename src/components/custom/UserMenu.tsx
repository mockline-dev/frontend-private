'use client'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';

interface UserMenuProps {
  currentPage: 'dashboard' | 'workspace';
  onNavigate: (page: 'dashboard' | 'workspace') => void;
  onLogout: () => void;
}

export function UserMenu({ currentPage, onNavigate, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';
  const initials = user 
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()
    : 'U';
  const email = user?.userMeta?.[0]?.email || 'user@example.com';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium hover:shadow-lg transition-shadow">
          {initials}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="end">
        <div className="p-3 border-b border-gray-200">
          <p className="font-medium text-gray-900 text-sm">{displayName}</p>
          <p className="text-xs text-gray-500">{email}</p>
        </div>
        <div className="p-1">
          <button
            onClick={() => {
              onNavigate(currentPage === 'dashboard' ? 'workspace' : 'dashboard');
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
          >
            {currentPage === 'dashboard' ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Create Project</span>
              </>
            ) : (
              <>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              onLogout();
              setOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Log out</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
