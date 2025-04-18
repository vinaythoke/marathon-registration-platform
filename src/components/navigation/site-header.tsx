'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MainNav } from './main-nav';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    async function checkAuthStatus() {
      try {
        const { data } = await supabase.auth.getSession();
        setIsLoggedIn(!!data.session);
      } catch (error) {
        console.error('Error checking auth status:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkAuthStatus();
  }, [supabase.auth]);

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-lg">
          Marathon Registration
        </Link>

        {!isLoading && (
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <MainNav />
                <div className="ml-auto flex items-center space-x-4">
                  <Link href="/dashboard">
                    <Button variant="ghost">Dashboard</Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={async () => {
                      await supabase.auth.signOut();
                      setIsLoggedIn(false);
                      window.location.href = '/';
                    }}
                  >
                    Logout
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