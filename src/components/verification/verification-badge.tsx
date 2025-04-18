'use client';

import { CheckCircle, AlertCircle, AlertTriangle, Clock, HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface VerificationBadgeProps {
  status: 'verified' | 'pending' | 'failed' | 'not_verified' | null;
  type?: 'aadhaar' | 'email' | 'phone';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function VerificationBadge({
  status,
  type = 'aadhaar',
  size = 'md',
  showLabel = false,
  className,
}: VerificationBadgeProps) {
  // Set icon size based on the size prop
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }[size];
  
  // Set text size based on the size prop
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];
  
  // Set badge size based on the size prop
  const badgeSize = {
    sm: 'h-5 px-1.5',
    md: 'h-6 px-2',
    lg: 'h-7 px-2.5',
  }[size];
  
  // Get display text based on verification type
  const getTypeText = () => {
    switch (type) {
      case 'aadhaar':
        return 'Aadhaar';
      case 'email':
        return 'Email';
      case 'phone':
        return 'Phone';
      default:
        return 'ID';
    }
  };
  
  // Get tooltip text based on status and type
  const getTooltipText = () => {
    switch (status) {
      case 'verified':
        return `Your ${getTypeText()} has been successfully verified`;
      case 'pending':
        return `Your ${getTypeText()} verification is pending`;
      case 'failed':
        return `Your ${getTypeText()} verification failed`;
      case 'not_verified':
      default:
        return `Your ${getTypeText()} is not verified`;
    }
  };
  
  // Determine badge content based on status
  const getBadgeContent = () => {
    switch (status) {
      case 'verified':
        return {
          icon: <CheckCircle className={iconSize} />,
          text: 'Verified',
          className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
        };
      case 'pending':
        return {
          icon: <Clock className={iconSize} />,
          text: 'Pending',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
        };
      case 'failed':
        return {
          icon: <AlertCircle className={iconSize} />,
          text: 'Failed',
          className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
        };
      case 'not_verified':
      default:
        return {
          icon: <AlertTriangle className={iconSize} />,
          text: 'Not Verified',
          className: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
        };
    }
  };
  
  const { icon, text, className: badgeClassName } = getBadgeContent();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={cn(
              'inline-flex items-center gap-1 rounded-full',
              badgeSize,
              badgeClassName,
              className
            )}
          >
            {icon}
            {showLabel && <span className={textSize}>{text}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Display multiple verification badges together
export function VerificationBadges({
  verifications,
  size = 'sm',
  showLabels = false,
  className,
}: {
  verifications: { type: 'aadhaar' | 'email' | 'phone'; status: 'verified' | 'pending' | 'failed' | 'not_verified' | null }[];
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  className?: string;
}) {
  if (!verifications || verifications.length === 0) {
    return null;
  }
  
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {verifications.map((verification) => (
        <VerificationBadge
          key={verification.type}
          status={verification.status}
          type={verification.type}
          size={size}
          showLabel={showLabels}
        />
      ))}
    </div>
  );
} 