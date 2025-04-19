'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import NProgress from 'nprogress';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // When the route changes, show progress
    NProgress.start();
    
    // Complete the progress after a short delay
    const timer = setTimeout(() => {
      NProgress.done();
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return null;
} 