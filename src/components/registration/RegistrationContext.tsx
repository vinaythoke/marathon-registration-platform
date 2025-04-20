"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { FormSchema, FormField, FieldType } from "@/types/form-builder";
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
  features?: string[];
  role_restrictions?: string[];
  access_code_required?: boolean;
  min_quantity?: number;
  max_quantity?: number;
}

export interface TicketWithAvailability extends Ticket {
  available_quantity: number;
  sold_percentage: number;
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
  registration_form_schema?: FormSchema;
}

export interface EventWithTickets extends Event {
  tickets: TicketWithAvailability[];
  registration_form_schema?: FormSchema;
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
  selectedQuantity: number;
  isSubmitting: boolean;
  submitError: string | null;
  stepValidationErrors: Record<RegistrationStep, string[]>;
  
  // Form schema for the current event
  formSchema: FormSchema | null;
  
  // Derived values
  totalPrice: number;
  isFreeRegistration: boolean;
  registrationStatus: 'draft' | 'pending_payment' | 'completed' | 'cancelled';
  
  // Methods
  setRegistrationId: (id: string | null) => void;
  setEventId: (id: string | null) => void;
  setTicketId: (id: string | null) => void;
  setUserId: (id: string | null) => void;
  setEvent: (event: EventWithTickets | null) => void;
  setSelectedTicket: (ticket: TicketWithAvailability | null) => void;
  setSelectedQuantity: (quantity: number) => void;
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
  const [selectedQuantity, setSelectedQuantity] = useState<number>(1);
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

  // Derived values
  const totalPrice = useMemo(() => {
    if (!selectedTicket) return 0;
    return selectedTicket.price * selectedQuantity;
  }, [selectedTicket, selectedQuantity]);

  const isFreeRegistration = useMemo(() => {
    return totalPrice === 0;
  }, [totalPrice]);

  const registrationStatus = useMemo(() => {
    if (!registrationId) return 'draft';
    if (isFreeRegistration) return 'completed';
    // Check payment status from registration record
    // This would need to be fetched from the API
    return 'pending_payment';
  }, [registrationId, isFreeRegistration]);

  // Set form schema when event changes
  useEffect(() => {
    if (event) {
      setFormSchema(event.registration_form_schema || null);
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
    setSelectedQuantity(1);
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

  // Enhanced validation
  const validateCurrentStep = useCallback(async (): Promise<boolean> => {
    clearStepErrors(currentStep);

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
        // Validate quantity
        if (selectedQuantity < 1) {
          addStepError(currentStep, 'Please select at least 1 ticket');
          return false;
        }
        if (selectedTicket.max_per_user && selectedQuantity > selectedTicket.max_per_user) {
          addStepError(currentStep, `Maximum ${selectedTicket.max_per_user} tickets allowed per user`);
          return false;
        }
        if (selectedTicket.available_quantity && selectedQuantity > selectedTicket.available_quantity) {
          addStepError(currentStep, `Only ${selectedTicket.available_quantity} tickets available`);
          return false;
        }
        return true;
        
      case 'registration-form':
        if (!formData || Object.keys(formData).length === 0) {
          addStepError(currentStep, 'Please complete the form to continue');
          return false;
        }
        
        // Validate form data against schema
        if (formSchema) {
          try {
            // Basic validation of required fields
            const requiredFields = formSchema.fields.filter(f => f.required);
            for (const field of requiredFields) {
              if (!formData[field.name]) {
                addStepError(currentStep, `${field.label} is required`);
                return false;
              }
              
              // Type validation
              switch (field.type) {
                case 'email':
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData[field.name])) {
                    addStepError(currentStep, `${field.label} must be a valid email`);
                    return false;
                  }
                  break;
                case 'phone':
                  if (!/^\+?[\d\s-]{10,}$/.test(formData[field.name])) {
                    addStepError(currentStep, `${field.label} must be a valid phone number`);
                    return false;
                  }
                  break;
                // Add other type validations as needed
              }
            }
          } catch (error) {
            console.error('Form validation error:', error);
            addStepError(currentStep, 'Invalid form data');
            return false;
          }
        }
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
        if (!isFreeRegistration && !registrationId) {
          addStepError(currentStep, 'Registration ID is missing');
          return false;
        }
        return true;
        
      case 'confirmation':
        return true;
        
      default:
        return true;
    }
  }, [currentStep, selectedTicket, registrationId, formData, formSchema, selectedQuantity, isFreeRegistration, addStepError, clearStepErrors]);

  // Enhanced submission
  const submitRegistration = useCallback(async (): Promise<boolean> => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      if (!registrationId || !selectedTicket || !formData) {
        throw new Error('Missing required registration data');
      }

      // Update registration record with final details
      const registrationData = {
        id: registrationId,
        event_id: eventId,
        ticket_id: selectedTicket.id,
        user_id: userId,
        quantity: selectedQuantity,
        total_price: totalPrice,
        status: isFreeRegistration ? 'completed' : 'pending_payment',
        form_data: formData,
      };

      // Call API to update registration
      const response = await fetch(`/api/registrations/${registrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        throw new Error('Failed to update registration');
      }

      // For free tickets, we're done
      if (isFreeRegistration) {
        return true;
      }
      
      // For paid tickets, create payment order
      const paymentResponse = await fetch(`/api/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId,
          amount: totalPrice,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to create payment order');
      }

      return true;
    } catch (error: any) {
      console.error('Registration submission error:', error);
      setSubmitError(error.message || 'Failed to submit registration');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [registrationId, selectedTicket, formData, eventId, userId, selectedQuantity, totalPrice, isFreeRegistration]);

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
    selectedQuantity,
    formSchema,
    isSubmitting,
    submitError,
    stepValidationErrors,
    
    // Derived values
    totalPrice,
    isFreeRegistration,
    registrationStatus,
    
    // Setters
    setRegistrationId,
    setEventId,
    setTicketId,
    setUserId,
    setEvent,
    setSelectedTicket,
    setSelectedQuantity,
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