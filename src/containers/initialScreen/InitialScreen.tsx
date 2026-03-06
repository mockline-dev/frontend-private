'use client'

import Header from '@/components/custom/Header';
import { AnimatedAIChat } from '@/components/ui/animated-ai-chat';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserData } from '../auth/types';

interface InitialScreenProps {
  currentUser: UserData | null;
}

export function InitialScreen({ currentUser }: InitialScreenProps) {
  const router = useRouter();
  const [promptValue, setPromptValue] = useState('');


  const handlePromptClick = (prompt: string) => {
    console.log('Prompt submitted:', prompt);
    // const prompt = `Build a ${label}`;
    // handleStart(prompt);
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
      router.push(`/workspace?prompt=${encodeURIComponent(prompt)}`);
      // savePrompt(prompt);
      // router.push('/auth/login');
  };

  return (
    <div>
        <Header currentUser={currentUser} currentPage="initial" onNavigateClick={() => router.push('/dashboard')} />
        <AnimatedAIChat value={promptValue} setValue={setPromptValue} onSendClick={handlePromptClick}/>
    </div>
  );
}
