'use client';

import { useRouter } from 'next/navigation';
import { ProfileForm } from '@/components/profile/profile-form';
import { getRunnerProfile } from '@/lib/actions/profile';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const [runnerProfile, setRunnerProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Handle hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initializeProfile = async () => {
      try {
        // If not loading and no user, redirect to login
        if (!authLoading && !user) {
          router.push('/auth/login');
          return;
        }

        // Wait for loading to complete and user/profile to be available
        if (authLoading || !user || !profile) {
          return;
        }

        // Only fetch runner profile if user is a runner
        if (profile.role === 'runner') {
          const data = await getRunnerProfile();
          if (isMounted) {
            setRunnerProfile(data);
          }
        }
        
        // Clear loading state regardless of user role
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load profile');
          setIsLoading(false);
        }
      }
    };

    if (mounted) {
      initializeProfile();
    }

    return () => {
      isMounted = false;
    };
  }, [user, profile, authLoading, router, mounted]);

  // Don't render anything until after hydration
  if (!mounted) {
    return null;
  }

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-2">Loading your profile...</span>
        </div>
      </div>
    );
  }

  // If no user or profile, show error
  if (!user || !profile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                {error || 'Please log in to access your profile.'}
              </p>
              <button
                onClick={() => router.push('/auth/login')}
                className="mt-2 text-sm text-yellow-700 underline hover:text-yellow-800"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show any errors that occurred during profile loading
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Profile</h1>
        <Button
          variant="outline"
          onClick={signOut}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Sign Out
        </Button>
      </div>
      
      {profile.role === 'runner' ? (
        <div>
          <ProfileForm profile={runnerProfile} />
          {!runnerProfile && (
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <p className="text-yellow-700">
                Please complete your runner profile to register for events.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p className="text-lg">
            Welcome {profile.first_name}! Your profile is managed through the organization settings.
          </p>
          {profile.role === 'organizer' && (
            <p className="mt-4">
              <a 
                href="/dashboard/organizer" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Organizer Dashboard
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
} 