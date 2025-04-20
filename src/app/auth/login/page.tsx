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
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <AuthClientWrapper />
      </div>
    </div>
  );
} 