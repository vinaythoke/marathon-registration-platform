import { createClient } from '@/lib/supabase/client';
import { Database } from '@/database.types';
import { v4 as uuidv4 } from 'uuid';
import { DigitalTicket, TicketMetadata } from '@/components/tickets/types';

/**
 * Generates a unique QR code data for a ticket
 */
export const generateQRCodeData = (
  userId: string,
  eventId: string,
  ticketId: string,
  registrationId: string
): string => {
  // Create a unique identifier with validation info
  const uniqueId = uuidv4();
  
  // Structure the data to be encoded in the QR code
  const qrData = {
    u: userId,        // User ID
    e: eventId,       // Event ID
    t: ticketId,      // Ticket ID
    r: registrationId, // Registration ID for direct lookup
    ts: Date.now(),   // Timestamp for additional verification
    id: uniqueId,     // Unique identifier to prevent duplication
    v: 1,             // QR code version for future compatibility
  };
  
  // Return JSON string of the QR code data
  return JSON.stringify(qrData);
};

/**
 * Creates a digital ticket in the database after registration completion
 */
export const createDigitalTicket = async (
  userId: string,
  eventId: string,
  ticketId: string,
  registrationId: string
): Promise<string | null> => {
  try {
    const supabase = createClient();
    
    // Generate QR code data
    const qrCodeData = generateQRCodeData(userId, eventId, ticketId, registrationId);
    
    // Update the registration with ticket metadata
    const ticketMetadata: TicketMetadata = {
      qr_code_data: qrCodeData,
    };
    
    // Update the registration record with the ticket metadata
    const { error } = await supabase
      .from('registrations')
      .update({ 
        metadata: ticketMetadata,
        status: 'confirmed'  // Update status to confirmed once ticket is generated
      })
      .eq('id', registrationId);
    
    if (error) {
      console.error('Error creating digital ticket:', error);
      return null;
    }
    
    return qrCodeData;
  } catch (error) {
    console.error('Error in createDigitalTicket:', error);
    return null;
  }
};

/**
 * Retrieves all digital tickets for a specific user
 */
export const getUserTickets = async (userId: string): Promise<DigitalTicket[]> => {
  try {
    const supabase = createClient();
    
    // Fetch registrations with related event and ticket info
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(*),
        ticket:tickets(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error || !data) {
      console.error('Error fetching user tickets:', error);
      return [];
    }
    
    // Fetch user profile for runner name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // Transform data into DigitalTicket format
    const tickets: DigitalTicket[] = data.map(item => {
      // Default metadata if none exists
      const metadata = (item.metadata as TicketMetadata) || { 
        qr_code_data: generateQRCodeData(userId, item.event_id, item.ticket_id, item.id)
      };
      
      return {
        id: item.id,
        event_id: item.event_id,
        user_id: userId,
        ticket_id: item.ticket_id,
        event_name: item.event?.title || 'Unknown Event',
        ticket_name: item.ticket?.name || 'General Admission',
        event_date: item.event?.date || new Date().toISOString(),
        event_location: item.event?.location || 'TBD',
        runner_name: profileData?.name || 'Runner',
        status: item.status,
        metadata: metadata,
        created_at: item.created_at
      };
    });
    
    return tickets;
  } catch (error) {
    console.error('Error in getUserTickets:', error);
    return [];
  }
};

/**
 * Get a single ticket by registration ID
 */
export const getTicketById = async (registrationId: string): Promise<DigitalTicket | null> => {
  try {
    const supabase = createClient();
    
    // Fetch the registration with related event and ticket info
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(*),
        ticket:tickets(*)
      `)
      .eq('id', registrationId)
      .single();
    
    if (error || !data) {
      console.error('Error fetching ticket:', error);
      return null;
    }
    
    // Fetch user profile for runner name
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user_id)
      .single();
    
    // Default metadata if none exists
    const metadata = (data.metadata as TicketMetadata) || { 
      qr_code_data: generateQRCodeData(data.user_id, data.event_id, data.ticket_id, data.id)
    };
    
    // Transform into DigitalTicket format
    const ticket: DigitalTicket = {
      id: data.id,
      event_id: data.event_id,
      user_id: data.user_id,
      ticket_id: data.ticket_id,
      event_name: data.event?.title || 'Unknown Event',
      ticket_name: data.ticket?.name || 'General Admission',
      event_date: data.event?.date || new Date().toISOString(),
      event_location: data.event?.location || 'TBD',
      runner_name: profileData?.name || 'Runner',
      status: data.status,
      metadata: metadata,
      created_at: data.created_at
    };
    
    return ticket;
  } catch (error) {
    console.error('Error in getTicketById:', error);
    return null;
  }
};

/**
 * Verify a ticket using QR code data
 */
export const verifyTicket = async (qrCodeData: string): Promise<{
  valid: boolean;
  message: string;
  ticketData?: DigitalTicket;
}> => {
  try {
    // Parse the QR code data
    const parsedData = JSON.parse(qrCodeData);
    
    // Check for required fields
    if (!parsedData.u || !parsedData.e || !parsedData.t) {
      return { valid: false, message: 'Invalid QR code format' };
    }
    
    const supabase = createClient();
    
    // First try to look up by registration ID if available (faster)
    if (parsedData.r) {
      const { data: directData, error: directError } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*),
          ticket:tickets(*)
        `)
        .eq('id', parsedData.r)
        .single();
      
      if (!directError && directData) {
        // Verify that other fields match to prevent tampering
        if (directData.user_id === parsedData.u && 
            directData.event_id === parsedData.e && 
            directData.ticket_id === parsedData.t) {
          
          // Continue with validation
          return await validateTicket(supabase, directData);
        }
      }
    }
    
    // Fallback: Search for the registration with matching info
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        event:events(*),
        ticket:tickets(*)
      `)
      .eq('user_id', parsedData.u)
      .eq('event_id', parsedData.e)
      .eq('ticket_id', parsedData.t);
    
    if (error || !data || data.length === 0) {
      return { valid: false, message: 'Ticket not found' };
    }
    
    // Use the first matching registration
    return await validateTicket(supabase, data[0]);
    
  } catch (error) {
    console.error('Error in verifyTicket:', error);
    return { valid: false, message: 'Error verifying ticket' };
  }
};

/**
 * Helper function to validate ticket and format response
 */
async function validateTicket(
  supabase: ReturnType<typeof createClient>,
  registration: any
): Promise<{
  valid: boolean;
  message: string;
  ticketData?: DigitalTicket;
}> {
  // Check if ticket status is valid
  if (registration.status !== 'confirmed') {
    return { 
      valid: false, 
      message: `Ticket status is ${registration.status}` 
    };
  }
  
  // Fetch user profile for runner name
  const { data: profileData } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', registration.user_id)
    .single();
  
  // Transform into DigitalTicket format
  const ticketData: DigitalTicket = {
    id: registration.id,
    event_id: registration.event_id,
    user_id: registration.user_id,
    ticket_id: registration.ticket_id,
    event_name: registration.event?.title || 'Unknown Event',
    ticket_name: registration.ticket?.name || 'General Admission',
    event_date: registration.event?.date || new Date().toISOString(),
    event_location: registration.event?.location || 'TBD',
    runner_name: profileData?.name || 'Runner',
    status: registration.status,
    metadata: (registration.metadata as TicketMetadata) || { 
      qr_code_data: JSON.stringify({}) 
    },
    created_at: registration.created_at
  };
  
  return { 
    valid: true, 
    message: 'Ticket validated successfully',
    ticketData
  };
}

/**
 * Record a ticket verification in the database
 */
export const recordTicketVerification = async (
  ticketId: string,
  verifiedBy: string,
  status: 'verified' | 'rejected',
  notes?: string
): Promise<boolean> => {
  try {
    const supabase = createClient();
    
    // Create a verification record
    const { error } = await supabase
      .from('ticket_verifications')
      .insert({
        registration_id: ticketId,
        verified_by: verifiedBy,
        status: status,
        notes: notes || '',
        verified_at: new Date().toISOString()
      });
    
    if (error) {
      console.error('Error recording ticket verification:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in recordTicketVerification:', error);
    return false;
  }
};

/**
 * Get verification history for a ticket
 */
export const getTicketVerificationHistory = async (
  ticketId: string
): Promise<any[]> => {
  try {
    const supabase = createClient();
    
    // Fetch verification records
    const { data, error } = await supabase
      .from('ticket_verifications')
      .select(`
        *,
        verifier:profiles!verified_by(name)
      `)
      .eq('registration_id', ticketId)
      .order('verified_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching verification history:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getTicketVerificationHistory:', error);
    return [];
  }
}; 