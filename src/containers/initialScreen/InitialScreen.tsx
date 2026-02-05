'use client'

import { UserMenu } from '@/components/custom/UserMenu';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const quickPrompts = [
  { icon: '✈️', label: 'Travel/Planner App' },
  { icon: '📚', label: 'Learning App' },
  { icon: '💰', label: 'Finance App' },
  { icon: '🛍️', label: 'Shopping App' }
];

export function InitialScreen() {
  const { isAuthenticated, loading, setSavedPrompt, logout } = useAuth();
  const router = useRouter();
  const [promptValue, setPromptValue] = useState('');

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, loading, router]);

  const handlePromptClick = (label: string) => {
    const prompt = `Build a ${label}`;
    handleStart(prompt);
  };

  const handleCustomPrompt = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const prompt = formData.get('prompt') as string;
    if (prompt.trim()) {
      handleStart(prompt);
    }
  };

  const handleStart = (prompt: string) => {
    if (isAuthenticated) {
      // User is authenticated, go directly to workspace
      router.push(`/workspace?prompt=${encodeURIComponent(prompt)}`);
    } else {
      // User is not authenticated, save prompt and redirect to login
      setSavedPrompt(prompt);
      router.push('/auth/login');
    }
  };

  const handleNavigate = (page: 'dashboard' | 'workspace') => {
    router.push(page === 'dashboard' ? '/dashboard' : '/workspace');
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-amber-50 flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-gray-900 text-lg">Mockline</span>
        </div>
{isAuthenticated && (
          <UserMenu 
            currentPage="workspace" 
            onNavigate={handleNavigate}
            onLogout={logout}
          />
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-2xl">
          {/* Headline */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-900 mb-3">
              Turn your ideas into
            </h1>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-violet-600 bg-clip-text text-transparent mb-4">
              Beautiful APIs
            </h1>
            <p className="text-gray-600 text-base">
              Describe your backend idea and let AI generate production-ready code in seconds.
            </p>
          </div>

          {/* Main Input */}
          <form onSubmit={handleCustomPrompt} className="mb-6">
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 p-6">
              <textarea
                name="prompt"
                placeholder="Describe your app idea..."
                className="w-full bg-transparent border-none text-gray-900 placeholder-gray-400 focus:outline-none resize-none text-base mb-4"
                rows={3}
                value={promptValue}
                onChange={(e) => setPromptValue(e.target.value)}
              />
              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Generate
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </div>
            </div>
          </form>

          {/* Quick Prompts */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {quickPrompts.map((item, index) => (
              <button
                key={index}
                onClick={() => handlePromptClick(item.label)}
                className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm hover:bg-white/90 border border-white/50 rounded-full px-4 py-2 text-sm text-gray-700 transition-all shadow-sm hover:shadow"
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
