'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { MainNav } from './main-nav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export function SiteHeader() {
  const { user, profile, loading, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show a simplified header during SSR and initial client render
  if (!mounted) {
    return (
      <header className="bg-background sticky top-0 z-40 w-full border-b">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="font-bold text-lg">
            Marathon Registration
          </Link>
          <div className="w-[120px]"></div> {/* Placeholder for layout stability */}
        </div>
      </header>
    );
  }

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Marathon Registration
        </Link>

        {!loading && (
          <div className="flex items-center gap-4">
            {user ? (
              <>
                <MainNav />
                <div className="ml-auto flex items-center space-x-4">
                  {profile && (
                    <span className="text-sm text-muted-foreground">
                      Welcome, {profile.first_name}
                    </span>
                  )}
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  href="/events" 
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === '/events' ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  Browse Events
                </Link>
                <div className="ml-auto flex items-center space-x-4">
                  <Link href="/auth/login">
                    <Button variant="ghost">Login</Button>
                  </Link>
                  <Link href="/auth/login?mode=register">
                    <Button>Sign Up</Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
} 