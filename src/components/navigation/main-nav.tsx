"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { SyncStatus } from '@/components/ui/sync-status';

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();
  
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/dashboard"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname === '/dashboard' 
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Dashboard
      </Link>
      <Link
        href="/events"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname.startsWith('/events')
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Events
      </Link>
      <Link
        href="/dashboard/tickets"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname.startsWith('/dashboard/tickets')
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        My Tickets
      </Link>
      <Link
        href="/dashboard/profile"
        className={cn(
          "text-sm font-medium transition-colors hover:text-primary",
          pathname.startsWith('/dashboard/profile')
            ? "text-primary"
            : "text-muted-foreground"
        )}
      >
        Profile
      </Link>
      
      <div className="ml-auto flex items-center">
        <SyncStatus showForceSync={false} />
      </div>
    </nav>
  );
} 