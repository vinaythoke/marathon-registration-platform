'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase/client';
import { AuthForm } from './AuthForm';

export function AuthClientWrapper() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode');
  const roleParam = searchParams.get('role');
  const [authMode, setAuthMode] = useState<'login' | 'register'>(
    modeParam === 'register' ? 'register' : 'login'
  );
  
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const handleSubmit = async (data: { email: string; password: string }) => {
    const { email, password } = data;
    
    if (authMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Success',
        description: 'Successfully signed in!',
      });

      router.replace('/dashboard');
    } else {
      const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: roleParam || 'runner', // Default to runner role if none specified
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      try {
        if (signUpData.user) {
          await supabase
            .from('users')
            .insert({
              id: signUpData.user.id,
              auth_id: signUpData.user.id,
              email: signUpData.user.email as string,
              first_name: 'New',
              last_name: 'User',
              role: roleParam || 'runner',
            });
        }
      } catch (profileError) {
        console.error('Error creating user profile:', profileError);
      }

      toast({
        title: 'Registration Successful',
        description: 'Please check your email to verify your account.',
      });

      setAuthMode('login');
    }
  };

  const toggleMode = () => {
    setAuthMode(current => current === 'login' ? 'register' : 'login');
  };

  return (
    <AuthForm
      type={authMode}
      onSubmit={handleSubmit}
      onToggleMode={toggleMode}
    />
  );
} 