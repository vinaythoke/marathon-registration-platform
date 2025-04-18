import { Event, Ticket, RunnerProfile } from "@/types/database";

// Registration steps in the registration flow
export type RegistrationStep = 'select-ticket' | 'registration-form' | 'review' | 'confirmation';

// Registration status
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in';

// Registration object returned from the server
export interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  status: RegistrationStatus;
  created_at: string;
  updated_at: string;
}

// Registration with related data
export interface RegistrationWithDetails extends Registration {
  event: Event;
  ticket: Ticket;
  profile: RunnerProfile;
  form_responses?: Record<string, any>;
}

// Response from form submission
export interface FormSubmissionResponse {
  success: boolean;
  registrationId: string;
  error?: string;
}

// Ticket with availability info
export interface TicketWithAvailability extends Ticket {
  available_quantity: number;
  sold_percentage: number;
}

// Event with ticket information
export interface EventWithTickets extends Event {
  tickets: TicketWithAvailability[];
  registration_count: number;
  registration_deadline?: string;
  formSchema?: any; // Dynamic form schema for registration
} 