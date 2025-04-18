'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type RegistrationStep = 'select-ticket' | 'registration-form' | 'review' | 'confirmation';

interface RegistrationContextType {
  registrationId: string | null;
  eventId: string | null;
  ticketId: string | null;
  currentStep: RegistrationStep;
  formResponses: Record<string, any>;
  totalSteps: number;
  
  setRegistrationId: (id: string) => void;
  setEventId: (id: string) => void;
  setTicketId: (id: string) => void;
  setFormResponses: (responses: Record<string, any>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: RegistrationStep) => void;
  reset: () => void;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

const steps: RegistrationStep[] = ['select-ticket', 'registration-form', 'review', 'confirmation'];

export const RegistrationProvider = ({ children }: { children: ReactNode }) => {
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('select-ticket');
  const [formResponses, setFormResponses] = useState<Record<string, any>>({});
  
  const totalSteps = steps.length;

  const nextStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const goToStep = (step: RegistrationStep) => {
    if (steps.includes(step)) {
      setCurrentStep(step);
    }
  };

  const reset = () => {
    setRegistrationId(null);
    setEventId(null);
    setTicketId(null);
    setCurrentStep('select-ticket');
    setFormResponses({});
  };

  return (
    <RegistrationContext.Provider
      value={{
        registrationId,
        eventId,
        ticketId,
        currentStep,
        formResponses,
        totalSteps,
        setRegistrationId,
        setEventId,
        setTicketId,
        setFormResponses,
        nextStep,
        prevStep,
        goToStep,
        reset,
      }}
    >
      {children}
    </RegistrationContext.Provider>
  );
};

export const useRegistration = (): RegistrationContextType => {
  const context = useContext(RegistrationContext);
  if (context === undefined) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}; 