import { AuthClientWrapper } from '@/components/auth/AuthClientWrapper';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-indicator';

export const metadata: Metadata = {
  title: 'Login | Marathon Registration',
  description: 'Login to your account',
};

function AuthLoadingSkeleton() {
  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex flex-col space-y-2 text-center">
        <div className="h-7 w-32 bg-muted rounded mx-auto animate-pulse"></div>
        <div className="h-4 w-64 bg-muted rounded mx-auto animate-pulse"></div>
      </div>
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
          <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        </div>
        <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
        <div className="h-10 w-full bg-muted rounded animate-pulse"></div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email to sign in to your account
          </p>
        </div>
        <Suspense fallback={<AuthLoadingSkeleton />}>
          <AuthClientWrapper />
        </Suspense>
      </div>
    </div>
  );
} 