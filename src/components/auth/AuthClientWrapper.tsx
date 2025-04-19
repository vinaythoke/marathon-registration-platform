'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { AuthForm } from './AuthForm';

export function AuthClientWrapper() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const [mounted, setMounted] = useState(false);
  
  // Fix hydration issues by only rendering after component mounts
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const authMode = modeParam === 'register' ? 'register' : 'login';

  // Don't render until client-side to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return <AuthForm type={authMode} />;
} 