'use client';

import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LoadingIndicator() {
  const [isActive, setIsActive] = useState(false);
  
  // Simple mount effect to ensure client-side only rendering
  useEffect(() => {
    // Client-side only code
    setIsActive(false);
  }, []);
  
  // Don't render anything during server-side rendering or if not active
  if (!isActive) return null;
  
  return null;
}

// Alternative smaller version that can be embedded in components
export function LoadingSpinner({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
} 