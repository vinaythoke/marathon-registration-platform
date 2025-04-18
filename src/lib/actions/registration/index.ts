'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/database.types';
import { revalidatePath } from 'next/cache';
import { FormSchema } from '@/types/form-builder';

// Check if we're using local DB or Supabase
const isLocalDb = process.env.IS_LOCAL_DB === 'true';

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
 * Get event details and form schema
 */
export async function getEventWithFormSchema(eventId: string) {
  if (isLocalDb) {
    // Return mock data for local development
    return {
      event: {
        id: eventId,
        title: 'Mock Marathon Event',
        description: 'This is a mock event for local development',
        date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        location: 'Local Development City',
        status: 'published',
        banner_url: 'https://placehold.co/600x400?text=Mock+Event'
      },
      formSchema: {
        title: "Registration Information",
        description: "Please provide your details for event registration",
        fields: [
          {
            id: "full_name",
            label: "Full Name",
            type: "text",
            required: true,
            placeholder: "Enter your full name"
          },
          {
            id: "email",
            label: "Email Address",
            type: "email",
            required: true,
            placeholder: "Enter your email address"
          },
          {
            id: "phone",
            label: "Phone Number",
            type: "phone",
            required: true,
            placeholder: "Enter your phone number"
          },
          {
            id: "emergency_contact",
            label: "Emergency Contact Name",
            type: "text",
            required: true,
            placeholder: "Emergency contact name"
          },
          {
            id: "emergency_phone",
            label: "Emergency Contact Phone",
            type: "phone",
            required: true,
            placeholder: "Emergency contact phone"
          },
          {
            id: "medical_conditions",
            label: "Medical Conditions",
            type: "textarea",
            required: false,
            placeholder: "Enter any relevant medical conditions"
          },
          {
            id: "tshirt_size",
            label: "T-Shirt Size",
            type: "select",
            required: true,
            options: [
              { label: "X-Small", value: "XS" },
              { label: "Small", value: "S" },
              { label: "Medium", value: "M" },
              { label: "Large", value: "L" },
              { label: "X-Large", value: "XL" },
              { label: "XX-Large", value: "XXL" }
            ]
          }
        ]
      } as FormSchema,
      tickets: [
        {
          id: uuidv4(),
          event_id: eventId,
          name: 'Standard Entry',
          description: 'Regular marathon entry',
          price: 50,
          quantity: 100,
          max_per_user: 1,
          status: 'active'
        },
        {
          id: uuidv4(),
          event_id: eventId,
          name: 'VIP Entry',
          description: 'VIP marathon entry with extra benefits',
          price: 100,
          quantity: 20,
          max_per_user: 1,
          status: 'active'
        },
        {
          id: uuidv4(),
          event_id: eventId,
          name: 'Early Bird',
          description: 'Discounted early registration',
          price: 35,
          quantity: 50,
          max_per_user: 1,
          status: 'active'
        }
      ]
    };
  }
  
  const supabase = createServerSupabaseClient();
  
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
      banner_url
    `)
    .eq('id', eventId)
    .eq('status', 'published')
    .single();
    
  if (eventError || !event) {
    throw new Error(`Event not found or not available: ${eventError?.message}`);
  }
  
  // Get event form schema
  const { data: formData, error: formError } = await supabase
    .from('event_forms')
    .select('id, schema')
    .eq('event_id', eventId)
    .single();
    
  if (formError && formError.code !== 'PGRST116') {
    throw new Error(`Error fetching form schema: ${formError.message}`);
  }
  
  // Get available tickets
  const { data: tickets, error: ticketsError } = await supabase
    .from('tickets')
    .select('id, name, description, price, quantity, max_per_user, status')
    .eq('event_id', eventId)
    .eq('status', 'active');
    
  if (ticketsError) {
    throw new Error(`Error fetching tickets: ${ticketsError.message}`);
  }
  
  return {
    event,
    formSchema: formData?.schema as FormSchema | null,
    tickets: tickets || []
  };
}

/**
 * Get available tickets for an event
 */
export async function getEventTickets(eventId: string) {
  if (isLocalDb) {
    // Return mock tickets with availability
    return [
      {
        id: uuidv4(),
        event_id: eventId,
        name: 'Standard Entry',
        description: 'Regular marathon entry',
        price: 50,
        quantity: 100,
        max_per_user: 1,
        status: 'active',
        available_quantity: 75
      },
      {
        id: uuidv4(),
        event_id: eventId,
        name: 'VIP Entry',
        description: 'VIP marathon entry with extra benefits',
        price: 100,
        quantity: 20,
        max_per_user: 1,
        status: 'active',
        available_quantity: 15
      },
      {
        id: uuidv4(),
        event_id: eventId,
        name: 'Early Bird',
        description: 'Discounted early registration',
        price: 35,
        quantity: 50,
        max_per_user: 1,
        status: 'active',
        available_quantity: 10
      }
    ];
  }
  
  const supabase = createServerSupabaseClient();
  
  // Get all active tickets for the event
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('event_id', eventId)
    .eq('status', 'active')
    .order('price', { ascending: true });
    
  if (error) {
    throw new Error(`Error fetching tickets: ${error.message}`);
  }
  
  // For each ticket, get registration count to determine availability
  const ticketsWithAvailability = await Promise.all(
    tickets.map(async (ticket) => {
      const { count, error: countError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('ticket_id', ticket.id)
        .not('status', 'eq', 'cancelled');
        
      if (countError) {
        throw new Error(`Error checking ticket availability: ${countError.message}`);
      }
      
      const availableQuantity = ticket.quantity - (count || 0);
      
      return {
        ...ticket,
        available_quantity: availableQuantity,
      };
    })
  );
  
  return ticketsWithAvailability;
}

/**
 * Get event details
 */
export async function getEventDetails(eventId: string) {
  if (isLocalDb) {
    // Return mock event details for local development
    return {
      id: eventId,
      title: 'Mock Marathon Event',
      description: 'This is a mock event for local development with comprehensive details. It includes information about the course, aid stations, and other important details for participants.',
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      location: 'Local Development City, Central Park',
      status: 'published',
      banner_url: 'https://placehold.co/1200x400?text=Marathon+Event',
      organizer: {
        name: 'Local Development Organizer',
        email: 'organizer@example.com'
      }
    };
  }
  
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('events')
    .select(`
      *,
      organizer:profiles(name, email)
    `)
    .eq('id', eventId)
    .eq('status', 'published')
    .single();
    
  if (error) {
    throw new Error(`Error fetching event: ${error.message}`);
  }
  
  return data;
}

/**
 * Start a new registration
 */
export async function createRegistration(eventId: string, ticketId: string) {
  if (isLocalDb) {
    // Generate a mock registration ID for local development
    const mockRegistrationId = uuidv4();
    return { registrationId: mockRegistrationId };
  }
  
  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Check if user already has a registration for this event
  const { data: existingRegistration } = await supabase
    .from('registrations')
    .select('id, status')
    .eq('event_id', eventId)
    .eq('user_id', session.user.id)
    .not('status', 'eq', 'cancelled')
    .single();
    
  if (existingRegistration) {
    throw new Error('You already have a registration for this event');
  }
  
  // Verify ticket availability
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('id, quantity, status')
    .eq('id', ticketId)
    .eq('event_id', eventId)
    .single();
    
  if (ticketError || !ticket) {
    throw new Error('Ticket not found or not available');
  }
  
  if (ticket.status !== 'active') {
    throw new Error('This ticket is no longer available');
  }
  
  // Count registrations for this ticket to check availability
  const { count: registrationCount, error: countError } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .eq('ticket_id', ticketId)
    .not('status', 'eq', 'cancelled');
    
  if (countError) {
    throw new Error(`Error checking ticket availability: ${countError.message}`);
  }
  
  if (registrationCount && registrationCount >= ticket.quantity) {
    throw new Error('This ticket is sold out');
  }
  
  // Create a new registration
  const registrationId = uuidv4();
  const { error: registrationError } = await supabase
    .from('registrations')
    .insert({
      id: registrationId,
      event_id: eventId,
      user_id: session.user.id,
      ticket_id: ticketId,
      status: 'pending'
    });
    
  if (registrationError) {
    throw new Error(`Error creating registration: ${registrationError.message}`);
  }
  
  return { registrationId };
}

/**
 * Get the form schema for an event
 */
export async function getEventFormSchema(eventId: string) {
  if (isLocalDb) {
    // Return mock form schema for local development
    return {
      title: "Registration Information",
      description: "Please provide your details for event registration",
      fields: [
        {
          id: "full_name",
          label: "Full Name",
          type: "text",
          required: true,
          placeholder: "Enter your full name"
        },
        {
          id: "email",
          label: "Email Address",
          type: "email",
          required: true,
          placeholder: "Enter your email address"
        },
        {
          id: "phone",
          label: "Phone Number",
          type: "phone",
          required: true,
          placeholder: "Enter your phone number"
        },
        {
          id: "emergency_contact",
          label: "Emergency Contact Name",
          type: "text",
          required: true,
          placeholder: "Emergency contact name"
        },
        {
          id: "emergency_phone",
          label: "Emergency Contact Phone",
          type: "phone",
          required: true,
          placeholder: "Emergency contact phone"
        },
        {
          id: "medical_conditions",
          label: "Medical Conditions",
          type: "textarea",
          required: false,
          placeholder: "Enter any relevant medical conditions"
        },
        {
          id: "tshirt_size",
          label: "T-Shirt Size",
          type: "select",
          required: true,
          options: [
            { label: "X-Small", value: "XS" },
            { label: "Small", value: "S" },
            { label: "Medium", value: "M" },
            { label: "Large", value: "L" },
            { label: "X-Large", value: "XL" },
            { label: "XX-Large", value: "XXL" }
          ]
        }
      ]
    };
  }
  
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('event_forms')
    .select('schema')
    .eq('event_id', eventId)
    .single();
    
  if (error && error.code !== 'PGRST116') {
    throw new Error(`Error fetching form schema: ${error.message}`);
  }
  
  return data?.schema || null;
}

/**
 * Save form responses
 */
export async function saveFormResponses(registrationId: string, responses: Record<string, any>) {
  if (isLocalDb) {
    // For local development, just return success
    console.log(`[Local Dev] Saving form responses for registration ${registrationId}:`, responses);
    return { success: true };
  }
  
  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Verify the registration belongs to the current user
  const { data: registration, error: registrationError } = await supabase
    .from('registrations')
    .select('id, user_id')
    .eq('id', registrationId)
    .single();
    
  if (registrationError || !registration) {
    throw new Error('Registration not found');
  }
  
  if (registration.user_id !== session.user.id) {
    throw new Error('Unauthorized');
  }
  
  // Save or update form responses
  const { data: existingResponse } = await supabase
    .from('form_responses')
    .select('id')
    .eq('registration_id', registrationId)
    .single();
    
  if (existingResponse) {
    // Update existing response
    const { error } = await supabase
      .from('form_responses')
      .update({
        response_data: responses,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingResponse.id);
      
    if (error) {
      throw new Error(`Error updating form responses: ${error.message}`);
    }
  } else {
    // Create new response
    const { error } = await supabase
      .from('form_responses')
      .insert({
        registration_id: registrationId,
        response_data: responses
      });
      
    if (error) {
      throw new Error(`Error saving form responses: ${error.message}`);
    }
  }
  
  // Revalidate paths to ensure fresh data
  revalidatePath(`/events/[eventId]/register`);
  
  return { success: true };
}

/**
 * Complete registration
 */
export async function completeRegistration(registrationId: string) {
  if (isLocalDb) {
    // For local development, just return success with a mock ticket code
    const ticketCode = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    console.log(`[Local Dev] Completing registration ${registrationId} with ticket code ${ticketCode}`);
    return { success: true, ticketCode };
  }
  
  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Verify the registration belongs to the current user
  const { data: registration, error: registrationError } = await supabase
    .from('registrations')
    .select('id, user_id, event_id, ticket_id')
    .eq('id', registrationId)
    .single();
    
  if (registrationError || !registration) {
    throw new Error('Registration not found');
  }
  
  if (registration.user_id !== session.user.id) {
    throw new Error('Unauthorized');
  }
  
  // Update registration status to confirmed
  const { error } = await supabase
    .from('registrations')
    .update({
      status: 'confirmed',
      updated_at: new Date().toISOString()
    })
    .eq('id', registrationId);
    
  if (error) {
    throw new Error(`Error confirming registration: ${error.message}`);
  }
  
  // Generate a ticket code (simplified for example - in production use a more secure method)
  const ticketCode = `TKT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  // Create a new ticket record
  const { error: ticketError } = await supabase
    .from('tickets')
    .insert({
      registration_id: registrationId,
      code: ticketCode,
      status: 'active',
      qr_code: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticketCode}`
    });
    
  if (ticketError) {
    // Don't throw here, we'll just log the error
    console.error(`Error creating ticket: ${ticketError.message}`);
  }
  
  // Revalidate paths to ensure fresh data
  revalidatePath(`/events/${registration.event_id}/register`);
  revalidatePath(`/dashboard/tickets`);
  
  return { success: true, ticketCode };
}

/**
 * Get a registration with its form responses
 */
export async function getRegistrationWithResponses(registrationId: string) {
  if (isLocalDb) {
    // For local development, return mock registration and form responses
    return {
      registration: {
        id: registrationId,
        event_id: 'mock-event-id',
        user_id: 'mock-user-id',
        ticket_id: 'mock-ticket-id',
        status: 'pending',
        created_at: new Date().toISOString(),
        events: {
          title: 'Mock Marathon Event',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Local Development City'
        },
        tickets: {
          name: 'Standard Entry',
          price: 50
        }
      },
      formResponse: {
        id: 'mock-form-response-id',
        response_data: {
          full_name: 'Test Runner',
          email: 'runner@example.com',
          phone: '123-456-7890',
          emergency_contact: 'Emergency Contact',
          emergency_phone: '987-654-3210',
          medical_conditions: '',
          tshirt_size: 'M'
        },
        created_at: new Date().toISOString()
      }
    };
  }
  
  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Get registration details
  const { data: registration, error: registrationError } = await supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      user_id,
      ticket_id,
      status,
      created_at,
      events(title, date, location),
      tickets(name, price)
    `)
    .eq('id', registrationId)
    .eq('user_id', session.user.id)
    .single();
    
  if (registrationError || !registration) {
    throw new Error('Registration not found');
  }
  
  // Get form responses
  const { data: formResponse, error: responseError } = await supabase
    .from('form_responses')
    .select('id, response_data, created_at')
    .eq('registration_id', registrationId)
    .single();
    
  if (responseError && responseError.code !== 'PGRST116') {
    throw new Error(`Error fetching form responses: ${responseError.message}`);
  }
  
  return {
    registration,
    formResponse: formResponse || null
  };
}

/**
 * Get all registrations for the current user
 */
export async function getUserRegistrations() {
  if (isLocalDb) {
    // Return mock registrations for local development
    const now = new Date();
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days in future
    const pastDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days in past
    
    const mockUpcomingRegistrations = [
      {
        id: uuidv4(),
        event_id: 'mock-event-id-1',
        ticket_id: 'mock-ticket-id-1',
        status: 'confirmed',
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        event: {
          id: 'mock-event-id-1',
          title: 'Upcoming Marathon',
          description: 'A future marathon event',
          date: futureDate.toISOString(),
          location: 'Future City',
          banner_url: 'https://placehold.co/600x400?text=Future+Event',
          status: 'published'
        },
        ticket: {
          name: 'Standard Entry',
          price: 50
        }
      }
    ];
    
    const mockPastRegistrations = [
      {
        id: uuidv4(),
        event_id: 'mock-event-id-2',
        ticket_id: 'mock-ticket-id-2',
        status: 'confirmed',
        created_at: pastDate.toISOString(),
        updated_at: pastDate.toISOString(),
        event: {
          id: 'mock-event-id-2',
          title: 'Past Marathon',
          description: 'A past marathon event',
          date: pastDate.toISOString(),
          location: 'Past City',
          banner_url: 'https://placehold.co/600x400?text=Past+Event',
          status: 'published'
        },
        ticket: {
          name: 'Early Bird',
          price: 35
        }
      }
    ];
    
    return {
      upcoming: mockUpcomingRegistrations,
      past: mockPastRegistrations,
      all: [...mockUpcomingRegistrations, ...mockPastRegistrations]
    };
  }
  
  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Get all registrations for this user with related event and ticket info
  const { data: registrations, error } = await supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      ticket_id,
      status,
      created_at,
      updated_at,
      event:events(
        id,
        title,
        description,
        date,
        location,
        banner_url,
        status
      ),
      ticket:tickets(
        name,
        price
      )
    `)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });
    
  if (error) {
    throw new Error(`Error fetching registrations: ${error.message}`);
  }
  
  // Separate registrations into upcoming and past based on event date
  const now = new Date();
  
  const upcomingRegistrations = registrations.filter(reg => 
    reg.event && new Date(reg.event.date as string) >= now
  );
  
  const pastRegistrations = registrations.filter(reg => 
    reg.event && new Date(reg.event.date as string) < now
  );
  
  return {
    upcoming: upcomingRegistrations,
    past: pastRegistrations,
    all: registrations
  };
} 