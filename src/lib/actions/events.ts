'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/database.types';
import { EventWithTickets, TicketWithAvailability } from '@/types/registration';
import { FormSchema } from '@/types/form-builder';

// Create a Supabase client for server components
const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

/**
 * Fetch an event with its tickets and form schema
 */
export async function fetchEventWithTickets(eventId: string): Promise<EventWithTickets | null> {
  const supabase = createServerSupabaseClient();
  
  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Get event details
  const { data: event, error: eventError } = await supabase
    .from('events')
    .select(`
      id,
      title,
      description,
      date,
      location,
      status,
      banner_url,
      organizer_id,
      registration_deadline
    `)
    .eq('id', eventId)
    .eq('status', 'published')
    .single();
    
  if (eventError || !event) {
    return null;
  }
  
  // Get tickets with availability info
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active');
  
  if (ticketsError) {
    console.error('Error fetching tickets:', ticketsError);
    return null;
  }
  
  // Get registration count for each ticket
  const ticketsWithAvailability: TicketWithAvailability[] = await Promise.all(
    tickets.map(async (ticket) => {
      const { count, error: countError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('ticket_id', ticket.id)
        .not('status', 'eq', 'cancelled');
      
      if (countError) {
        console.error('Error counting registrations:', countError);
        return {
          ...ticket,
          available_quantity: ticket.quantity,
          sold_percentage: 0
        };
      }
      
      const soldCount = count || 0;
      const availableQuantity = ticket.quantity - soldCount;
      const soldPercentage = (soldCount / ticket.quantity) * 100;
      
      return {
        ...ticket,
        available_quantity: availableQuantity,
        sold_percentage: soldPercentage
      };
    })
  );
  
  // Get form schema if available
  const { data: formData } = await supabase
    .from('event_forms')
    .select('schema')
    .eq('event_id', eventId)
    .single();
  
  // Get total registration count
  const { count: registrationCount, error: regCountError } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('status', 'eq', 'cancelled');
  
  if (regCountError) {
    console.error('Error counting registrations:', regCountError);
  }
  
  // Return the event with tickets and form schema
  return {
    ...event,
    tickets: ticketsWithAvailability,
    registration_count: registrationCount || 0,
    formSchema: formData?.schema as FormSchema | null
  };
} 