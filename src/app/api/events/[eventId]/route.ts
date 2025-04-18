import { NextRequest, NextResponse } from 'next/server';
import { getClient } from '@/lib/db-client';

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { eventId } = params;
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';

  try {
    let typedEvent;
    let registrationCount = 0;
    let eventTickets = [];

    if (isLocalDb) {
      // Mock data for local development
      const mockEvents = [
        {
          id: '44444444-4444-4444-4444-444444444444',
          title: 'Test Marathon',
          description: 'A test marathon event',
          date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Test City',
          status: 'published',
          created_at: new Date().toISOString(),
          banner_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
          capacity: 100,
          registrations: [{ count: 25 }],
          registration_deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          title: 'Local Development Marathon',
          description: 'A test event for local development',
          date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Local City',
          status: 'draft',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          banner_url: null,
          capacity: 200,
          registrations: [{ count: 0 }],
          registration_deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        }
      ];
      
      // Find the mock event by ID
      const event = mockEvents.find(e => e.id === eventId);
      
      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }
      
      typedEvent = event;
      registrationCount = (event.registrations && event.registrations[0]?.count) || 0;
      
      // Mock tickets
      eventTickets = [
        {
          id: '11111111-1111-1111-1111-111111111111',
          event_id: event.id,
          name: 'Standard Entry',
          description: 'Regular race entry',
          price: 20.00,
          quantity: 100,
          max_per_user: 1,
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        }
      ];
    } else {
      // Use Supabase for production
      const supabase = getClient();
      
      // Get event details
      const { data: event, error } = await supabase
        .from('events')
        .select(`
          id,
          title,
          description,
          event_date,
          location,
          type,
          categories,
          capacity,
          banner_url,
          banner_storage_path,
          status,
          registration_deadline,
          created_at,
          updated_at,
          organizer_id,
          registrations:registrations(count)
        `)
        .eq('id', eventId)
        .single();

      if (error || !event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      }

      // Map event_date to date for consistency
      typedEvent = {
        ...event,
        date: event.event_date,
      };

      // Get registration count
      const { count, error: countError } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);
        
      if (!countError) {
        registrationCount = count || 0;
      }

      // Fetch tickets for this event
      const { data: tickets } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      
      eventTickets = tickets || [];
    }

    // Use registration_deadline if available, otherwise fallback to date
    const deadline = typedEvent.registration_deadline || typedEvent.date;
    
    return NextResponse.json({ 
      typedEvent, 
      registrationCount, 
      eventTickets, 
      deadline 
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return NextResponse.json(
      { error: 'Error fetching event data' }, 
      { status: 500 }
    );
  }
} 