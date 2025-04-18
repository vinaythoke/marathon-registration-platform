"use client";

import { useRegistration } from '@/components/registration/RegistrationContext';
import { RegistrationStep } from '@/types/registration';
import { cn } from '@/lib/utils';
import { Check, ChevronRight } from 'lucide-react';

// Define step interface
interface StepDefinition {
  key: RegistrationStep;
  label: string;
}

// Define registration steps
const steps: StepDefinition[] = [
  { key: 'select-ticket', label: 'Select Ticket' },
  { key: 'registration-form', label: 'Registration Form' },
  { key: 'review', label: 'Review' },
  { key: 'confirmation', label: 'Confirmation' },
];

export default function RegistrationProgress() {
  const { currentStep } = useRegistration();
  
  // Find the index of the current step
  const currentStepIndex = steps.findIndex((step) => step.key === currentStep);
  
  // Calculate progress percentage
  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;
  
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index < currentStepIndex;
          
          return (
            <div key={step.key} className="flex items-center">
              {/* Step circle */}
              <div 
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-colors",
                  isCompleted ? "bg-primary text-primary-foreground" : 
                  isActive ? "bg-primary text-primary-foreground" : 
                  "bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step label */}
              <span 
                className={cn(
                  "ml-2 text-sm font-medium hidden sm:inline-block",
                  isActive ? "text-primary" : 
                  isCompleted ? "text-primary" : 
                  "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
              
              {/* Connector line between steps */}
              {index < steps.length - 1 && (
                <div className="flex items-center mx-2 sm:mx-4">
                  <ChevronRight className={cn(
                    "h-4 w-4", 
                    isCompleted ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
              )}
            </div>
          );
        })}
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