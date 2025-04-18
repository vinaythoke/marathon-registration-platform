"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { FormSchema } from "@/types/form-builder";
import { EventWithTickets, TicketWithAvailability } from "@/types/registration";
import { RunnerProfile } from "@/types/database";

// Updated registration steps to include payment
export type RegistrationStep = 'select-ticket' | 'registration-form' | 'review' | 'payment' | 'confirmation';

// Ticket type interface
export interface Ticket {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  max_per_user: number;
  status: string;
  available_quantity?: number;
  features?: string[];
}

// Event interface
export interface Event {
  id: string;
  title: string;
  description?: string;
  date: string;
  location: string;
  status: string;
  banner_url?: string;
  organizer_id?: string;
}

// Registration context interface
interface RegistrationContextType {
  // State
  registrationId: string | null;
  eventId: string | null;
  ticketId: string | null;
  userId: string | null;
  currentStep: RegistrationStep;
  formData: Record<string, any>;
  event: EventWithTickets | null;
  selectedTicket: TicketWithAvailability | null;
  isSubmitting: boolean;
  submitError: string | null;
  stepValidationErrors: Record<RegistrationStep, string[]>;
  
  // Form schema for the current event
  formSchema: FormSchema | null;
  
  // Methods
  setRegistrationId: (id: string | null) => void;
  setEventId: (id: string | null) => void;
  setTicketId: (id: string | null) => void;
  setUserId: (id: string | null) => void;
  setEvent: (event: EventWithTickets | null) => void;
  setSelectedTicket: (ticket: TicketWithAvailability | null) => void;
  setFormData: (data: Record<string, any>) => void;
  setCurrentStep: (step: RegistrationStep) => void;
  
  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  resetRegistration: () => void;
  
  // Validation
  validateCurrentStep: () => Promise<boolean>;
  addStepError: (step: RegistrationStep, error: string) => void;
  clearStepErrors: (step: RegistrationStep) => void;
  
  // Submission
  submitRegistration: () => Promise<boolean>;
}

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

// Order of steps in registration flow
const STEPS: RegistrationStep[] = [
  'select-ticket', 
  'registration-form', 
  'review', 
  'payment',
  'confirmation'
];

// Registration provider props
interface RegistrationProviderProps {
  children: ReactNode;
  initialEvent?: EventWithTickets | null;
}

// Registration provider component
export const RegistrationProvider: React.FC<RegistrationProviderProps> = ({ 
  children, 
  initialEvent = null 
}) => {
  // Basic state
  const [registrationId, setRegistrationId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('select-ticket');
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  // Event and ticket data
  const [event, setEvent] = useState<EventWithTickets | null>(initialEvent);
  const [selectedTicket, setSelectedTicket] = useState<TicketWithAvailability | null>(null);
  const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
  
  // Status and errors
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [stepValidationErrors, setStepValidationErrors] = useState<Record<RegistrationStep, string[]>>({
    'select-ticket': [],
    'registration-form': [],
    'review': [],
    'payment': [],
    'confirmation': []
  });

  // Set form schema when event changes
  useEffect(() => {
    if (event) {
      setFormSchema(event.formSchema || null);
    }
  }, [event]);

  // Add an error for a specific step
  const addStepError = useCallback((step: RegistrationStep, error: string) => {
    setStepValidationErrors(prev => ({
      ...prev,
      [step]: [...prev[step], error]
    }));
  }, []);

  // Clear errors for a specific step
  const clearStepErrors = useCallback((step: RegistrationStep) => {
    setStepValidationErrors(prev => ({
      ...prev,
      [step]: []
    }));
  }, []);

  // Navigate to next step
  const goToNextStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  }, [currentStep]);

  // Navigate to previous step
  const goToPreviousStep = useCallback(() => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  }, [currentStep]);

  // Reset the registration process
  const resetRegistration = useCallback(() => {
    setRegistrationId(null);
    setEventId(null);
    setTicketId(null);
    setUserId(null);
    setCurrentStep('select-ticket');
    setFormData({});
    setEvent(null);
    setSelectedTicket(null);
    setFormSchema(null);
    setIsSubmitting(false);
    setSubmitError(null);
    setStepValidationErrors({
      'select-ticket': [],
      'registration-form': [],
      'review': [],
      'payment': [],
      'confirmation': []
    });
  }, []);

  // Validate the current step
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    clearStepErrors(currentStep);
    
    // Step-specific validation
    switch (currentStep) {
      case 'select-ticket':
        if (!selectedTicket) {
          addStepError(currentStep, 'Please select a ticket to continue');
          return false;
        }
        if (!registrationId) {
          addStepError(currentStep, 'Registration ID is missing. Please try again');
          return false;
        }
        return true;
        
      case 'registration-form':
        if (!formData || Object.keys(formData).length === 0) {
          addStepError(currentStep, 'Please complete the form to continue');
          return false;
        }
        
        // Form validation logic would go here
        // Could check required fields, etc.
        
        return true;
        
      case 'review':
        if (!formData || Object.keys(formData).length === 0) {
          addStepError(currentStep, 'Registration data is missing');
          return false;
        }
        if (!selectedTicket) {
          addStepError(currentStep, 'Ticket selection is missing');
          return false;
        }
        return true;
        
      case 'payment':
        // Payment validation would happen in the payment component
        // This is a basic check
        if (selectedTicket && selectedTicket.price > 0 && !registrationId) {
          addStepError(currentStep, 'Registration ID is missing');
          return false;
        }
        return true;
        
      case 'confirmation':
        // Confirmation is usually just display, no validation
        return true;
        
      default:
        return true;
    }
  }, [currentStep, selectedTicket, registrationId, formData, addStepError, clearStepErrors]);

  // Submit the registration 
  const submitRegistration = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // In a real implementation, this would call an API to submit the registration
      // For now, just simulate a successful submission
      
      // Check if this is a free ticket - if so, proceed directly
      if (selectedTicket && selectedTicket.price === 0) {
        // Complete registration for free tickets
        // In a real implementation, would call an API endpoint
        
        // Return success
        return true;
      }
      
      // For paid tickets, we need to show the payment screen
      // The actual payment processing happens in the payment component
      
      return true;
    } catch (error: any) {
      console.error('Registration submission error:', error);
      setSubmitError(error.message || 'Failed to submit registration');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedTicket]);

  const contextValue: RegistrationContextType = {
    // State
    registrationId,
    eventId,
    ticketId,
    userId,
    currentStep,
    formData,
    event,
    selectedTicket,
    formSchema,
    isSubmitting,
    submitError,
    stepValidationErrors,
    
    // Setters
    setRegistrationId,
    setEventId,
    setTicketId,
    setUserId,
    setEvent,
    setSelectedTicket,
    setFormData,
    setCurrentStep,
    
    // Navigation
    goToNextStep,
    goToPreviousStep,
    resetRegistration,
    
    // Validation
    validateCurrentStep,
    addStepError,
    clearStepErrors,
    
    // Submission
    submitRegistration,
  };

  return (
    <RegistrationContext.Provider value={contextValue}>
      {children}
    </RegistrationContext.Provider>
  );
};

// Custom hook for using the registration context
export const useRegistration = () => {
  const context = useContext(RegistrationContext);
  
  if (context === undefined) {
    throw new Error("useRegistration must be used within a RegistrationProvider");
  }
  
  return context;
};

export default RegistrationContext; 