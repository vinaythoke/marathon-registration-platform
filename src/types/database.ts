import { Database as SupabaseDatabase, Json } from '@/database.types';

// Re-export types from the main database types for easier access
export type Event = SupabaseDatabase['public']['Tables']['events']['Row'];
export type Registration = SupabaseDatabase['public']['Tables']['registrations']['Row'];
export type RunnerProfile = SupabaseDatabase['public']['Tables']['runner_profiles']['Row'];
export type User = SupabaseDatabase['public']['Tables']['profiles']['Row'];
export type TicketBase = SupabaseDatabase['public']['Tables']['tickets']['Row'];

// Export the Ticket type with additional fields needed for the UI
export interface Ticket {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  max_per_user: number;
  status: 'active' | 'inactive';
  created_at: string;
  available_quantity?: number; // Computed number of available tickets
  features?: string[]; // Array of ticket features/benefits
}

// Extend ticket status type
export type TicketStatus = 'active' | 'inactive' | 'sold_out';

// Extend registration status type
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in';

// Payment status type
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Define a TicketWithEvent type to include event information with a ticket
export interface TicketWithEvent extends Ticket {
  event: Event;
}

// Define a RegistrationWithDetails type to include related information
export interface RegistrationWithDetails extends Registration {
  event: Event;
  ticket: Ticket;
  runner_profile?: RunnerProfile;
}

// Base Profile type from the profiles table
export interface Profile {
  id: string;
  name: string;
  email: string;
  role: 'runner' | 'organizer' | 'volunteer';
  created_at: string;
}

// Event type from the events table
export interface Event {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'published' | 'cancelled';
  organizer_id: string;
  created_at: string;
}

// Registration type from the registrations table
export interface Registration {
  id: string;
  user_id: string | null;
  event_id: string | null;
  ticket_id: string | null;
  payment_status: string;
  payment_id: string | null;
  amount_paid: number;
  status: string;
  metadata: Json;
  created_at: string;
  updated_at: string;
}

// RunnerProfile type from the runner_profiles table
export interface RunnerProfile {
  id: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  phone?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'non-binary' | 'prefer_not_to_say';
  
  medical_conditions?: string;
  allergies?: string;
  medications?: string;
  blood_type?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
  
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  years_running?: number;
  previous_marathons?: number;
  average_pace?: string;
  
  preferred_distance?: string[];
  running_goals?: string;
  t_shirt_size?: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  
  profile_image_url?: string;
  bio?: string;
  
  created_at: string;
  updated_at: string;
} 