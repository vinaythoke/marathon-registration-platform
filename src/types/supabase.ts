export type UserRole = 'organizer' | 'runner' | 'volunteer';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  organizer_id: string;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'cancelled' | 'completed';
  banner_url: string | null;
}

export interface Ticket {
  id: string;
  event_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  max_per_user: number;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  status: 'active' | 'sold_out' | 'disabled';
}

export interface Registration {
  id: string;
  user_id: string;
  event_id: string;
  ticket_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  qr_code: string | null;
}

export interface Verification {
  id: string;
  user_id: string;
  type: 'aadhaar' | 'email' | 'phone';
  status: 'pending' | 'verified' | 'failed';
  verified_at: string | null;
  created_at: string;
  updated_at: string;
  metadata: Record<string, any> | null;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      events: {
        Row: Event;
        Insert: Omit<Event, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Event, 'id' | 'created_at' | 'updated_at'>>;
      };
      tickets: {
        Row: Ticket;
        Insert: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Ticket, 'id' | 'created_at' | 'updated_at'>>;
      };
      registrations: {
        Row: Registration;
        Insert: Omit<Registration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Registration, 'id' | 'created_at' | 'updated_at'>>;
      };
      verifications: {
        Row: Verification;
        Insert: Omit<Verification, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Verification, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      event_status: 'draft' | 'published' | 'cancelled' | 'completed';
      ticket_status: 'active' | 'sold_out' | 'disabled';
      registration_status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
      payment_status: 'pending' | 'completed' | 'failed' | 'refunded';
      verification_type: 'aadhaar' | 'email' | 'phone';
      verification_status: 'pending' | 'verified' | 'failed';
    };
  };
} 