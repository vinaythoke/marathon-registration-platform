"use client";

import { useRegistration } from '@/components/registration/RegistrationContext';
import { RegistrationStep } from '@/types/registration';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

interface RegistrationProgressProps {
  currentStep: RegistrationStep;
}

const steps: { id: RegistrationStep; label: string }[] = [
  { id: 'select-ticket', label: 'Select Ticket' },
  { id: 'registration-form', label: 'Registration Form' },
  { id: 'review', label: 'Review' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' }
];

export function RegistrationProgress({ currentStep }: RegistrationProgressProps) {
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);
  
  // Calculate progress percentage
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                index <= currentStepIndex
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </div>
            <div
              className={cn(
                "ml-2 text-sm font-medium",
                index <= currentStepIndex
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {step.label}
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "w-16 h-0.5 mx-2",
                  index < currentStepIndex
                    ? "bg-primary"
                    : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Progress bar */}
      <div className="w-full h-2 bg-muted rounded-full mt-4">
        <div 
          className="h-2 bg-primary rounded-full transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
} 