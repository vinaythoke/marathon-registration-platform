import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';
import { AuthClientWrapper } from '@/components/auth/AuthClientWrapper';

export const metadata: Metadata = {
  title: 'Authentication - Marathon Registration',
  description: 'Sign in or create an account to manage marathon events.',
};

export default async function AuthPage() {
  const supabase = createClient();
  
  // Check if user is already authenticated
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome to Marathon Registration
          </h1>
          <p className="text-sm text-muted-foreground">
            Sign in to your account or create a new one
          </p>
        </div>

        <div className="grid gap-6">
          <AuthClientWrapper />
        </div>
      </div>
    </div>
  );
} 