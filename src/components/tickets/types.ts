import { Database } from '@/database.types';

export type TicketMetadata = {
  bib_number?: string;
  qr_code_data: string;
  race_distance?: string;
  start_time?: string;
  runner_category?: string;
};

export type DigitalTicket = {
  id: string;
  event_id: string;
  user_id: string;
  ticket_id: string;
  event_name: string;
  ticket_name: string;
  event_date: string;
  event_location: string;
  runner_name: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  metadata: TicketMetadata;
  created_at: string;
};

export type RegistrationWithTicket = Database['public']['Tables']['registrations']['Row'] & {
  metadata: TicketMetadata;
  event: Database['public']['Tables']['events']['Row'];
  ticket: Database['public']['Tables']['tickets']['Row'];
  user: Database['public']['Tables']['profiles']['Row'];
}; 