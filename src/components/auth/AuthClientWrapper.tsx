'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AuthForm } from './AuthForm';

export function AuthClientWrapper() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isRegister = pathname === '/auth/register';
  return <AuthForm type={isRegister ? 'register' : 'login'} />;
} 