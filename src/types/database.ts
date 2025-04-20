import { Database as SupabaseDatabase, Json } from '@/database.types';

// Base types from Supabase tables
export type EventBase = SupabaseDatabase['public']['Tables']['events']['Row'];
export type RegistrationBase = SupabaseDatabase['public']['Tables']['registrations']['Row'];
export type RunnerProfileBase = SupabaseDatabase['public']['Tables']['runner_profiles']['Row'];
export type TicketBase = SupabaseDatabase['public']['Tables']['tickets']['Row'];

// Export the Ticket type with additional fields needed for the UI
export interface Ticket {
  id: string;
  ticket_type_id: string;
  registration_id: string;
  order_id: string;
  price_paid: number;
  status: 'valid' | 'used' | 'cancelled' | 'refunded';
  check_in_time?: string;
  transfer_history?: {
    from_user_id: string;
    to_user_id: string;
    timestamp: string;
    notes?: string;
  }[];
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

// Export the TicketType interface for ticket type management
export interface TicketType {
  id: string;
  event_id: string;
  name: string;
  description?: string;
  type: 'regular' | 'early_bird' | 'vip' | 'group' | 'student';
  base_price: number;
  pricing_rules?: {
    start_date?: string;
    end_date?: string;
    price: number;
    quantity?: number;
    min_purchase?: number;
    max_purchase?: number;
  }[];
  quantity_total: number;
  quantity_sold: number;
  quantity_reserved: number;
  status: 'active' | 'sold_out' | 'draft' | 'archived';
  visibility_rules?: {
    start_date?: string;
    end_date?: string;
    access_codes?: string[];
    restricted_to?: string[];
  };
  features?: string[];
  metadata?: Json;
  created_at: string;
  updated_at: string;
}

// Extend ticket status type
export type TicketStatus = 'active' | 'sold_out' | 'draft' | 'archived';

// Extend registration status type
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'checked_in';

// Payment status type
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

// Export extended types that include computed fields and relationships
export interface Event extends EventBase {
  tickets?: TicketType[];
  registrations?: Registration[];
}

export interface Registration extends RegistrationBase {
  runner?: RunnerProfile;
  event?: Event;
  tickets?: Ticket[];
}

// RunnerProfile extends the base type with optional relationships
export interface RunnerProfile extends RunnerProfileBase {
  registrations?: Registration[];
}

// Re-export types from the main database types for easier access
export type User = SupabaseDatabase['public']['Tables']['profiles']['Row'];

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

// Ticket related types
export interface TicketOrder {
  id: string;
  user_id: string;
  event_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  tickets?: Ticket[];
  event?: Event;
} 