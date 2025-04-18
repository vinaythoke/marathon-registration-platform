import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Calendar, MapPin, Clock, Users, ChevronLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/lib/utils';
import { mockEvents } from '../mock-data';
import { getClient } from '@/lib/db-client';

interface EventPageProps {
  params: {
    eventId: string;
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = params;
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  let event;
  let tickets = [];
  let registrationCount = 0;
  let userRole = null;
  let session = null;
  
  try {
    if (isLocalDb) {
      // For local development, check our mock events including hardcoded IDs
      const hardcodedEvents = [
        {
          id: '44444444-4444-4444-4444-444444444444',
          title: 'Test Marathon',
          description: 'A test marathon event with detailed information about the race, including course details, aid stations, and what to expect on race day. This marathon is suitable for runners of all levels.',
          event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Test City',
          status: 'published',
          created_at: new Date().toISOString(),
          banner_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
          capacity: 100,
          organizer: { name: 'Test Organizer' }
        },
        {
          id: '55555555-5555-5555-5555-555555555555',
          title: 'Local Development Marathon',
          description: 'A test event for local development with all the features needed to properly test the registration process. This event includes multiple ticket types and registration options.',
          event_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Local City',
          status: 'draft',
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          banner_url: null,
          capacity: 200,
          organizer: { name: 'Local Organizer' }
        }
      ];
      
      // First check our hardcoded events that match the ones in the dashboard
      event = hardcodedEvents.find(e => e.id === eventId);
      
      // If not found, fall back to mock events
      if (!event) {
        event = mockEvents.find(e => e.id === eventId);
        
        if (event) {
          // Add any missing fields
          event = {
            ...event,
            organizer: { name: 'Demo Organizer' },
            capacity: 100
          };
        }
      }
      
      if (!event) {
        notFound();
      }
      
      // Mock tickets
      tickets = [
        {
          id: 'ticket-1',
          name: 'Early Bird',
          description: 'Limited early bird tickets at a discounted price',
          price: 25.00
        },
        {
          id: 'ticket-2',
          name: 'Regular',
          description: 'Standard registration fee',
          price: 35.00
        },
        {
          id: 'ticket-3',
          name: 'VIP Package',
          description: 'Premium experience with exclusive perks',
          price: 75.00
        }
      ];
      
      registrationCount = Math.floor(Math.random() * 50) + 10;
      userRole = 'runner'; // Default role for local development
    } else {
      // Supabase client for production
      const supabase = getClient();
      
      // Try to get session
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData.session;
      
      // Get event details from Supabase 
      const { data: eventData, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:users!events_organizer_id_fkey(first_name, last_name)
        `)
        .eq('id', eventId)
        .single();
      
      if (error || !eventData) {
        notFound();
      }
      
      // Format organizer name
      event = {
        ...eventData,
        organizer: { 
          name: `${eventData.organizer.first_name} ${eventData.organizer.last_name}` 
        }
      };
      
      // Get available tickets
      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .eq('event_id', eventId)
        .eq('status', 'active')
        .order('price', { ascending: true });
        
      tickets = ticketsData || [];
      
      // Calculate total registrations for this event
      const { count } = await supabase
        .from('registrations')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId)
        .neq('status', 'cancelled');
        
      registrationCount = count || 0;
      
      // Check if the current user is authenticated and get their role
      if (session) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', session.user.id)
          .single();
          
        userRole = userData?.role;
      }
    }
  } catch (error) {
    console.error('Error fetching event:', error);
    notFound();
  }
  
  // Display capacity and spots left
  const capacity = event.capacity || 'Unlimited';
  const spotsLeft = event.capacity ? `${event.capacity - registrationCount} spots left` : 'Open registration';

  return (
    <div className="container py-8">
      <Link href="/events" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6">
        <ChevronLeft className="mr-1 h-4 w-4" />
        Back to Events
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          {event.banner_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg mb-6">
              <img 
                src={event.banner_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <h1 className="text-3xl font-bold mb-3">{event.title}</h1>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
              {formatDate(event.event_date)}
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
              {event.location}
            </div>
            <div className="flex items-center text-sm">
              <Users className="mr-2 h-4 w-4 text-muted-foreground" />
              {registrationCount} registered
            </div>
            <div className="flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
              {spotsLeft}
            </div>
          </div>
          
          <div className="prose max-w-none dark:prose-invert mb-8">
            <h2>About This Event</h2>
            <p>{event.description}</p>
          </div>
          
          {tickets.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Ticket Options</h2>
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{ticket.name}</h3>
                        <p className="text-sm text-muted-foreground">{ticket.description}</p>
                      </div>
                      <div className="text-lg font-bold">{formatCurrency(ticket.price)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="md:col-span-1">
          <div className="sticky top-24 border rounded-lg p-6 bg-card">
            <h2 className="text-xl font-bold mb-4">Registration</h2>
            
            <div className="mb-6 space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Starting from</span>
                <span className="font-bold">{
                  tickets.length > 0 
                    ? formatCurrency(Math.min(...tickets.map(t => t.price))) 
                    : 'Free'
                }</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{formatDate(event.event_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Location</span>
                <span>{event.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Organizer</span>
                <span>{event.organizer.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <span className="text-green-600 font-medium">Open</span>
              </div>
            </div>
            
            <div className="flex flex-col gap-4">
              {userRole === 'runner' ? (
                <Link href={`/events/${eventId}/register`}>
                  <Button className="w-full">Register Now</Button>
                </Link>
              ) : session ? (
                <div className="text-sm text-muted-foreground text-center">
                  Only runners can register for events.
                </div>
              ) : (
                <Link href={`/auth/login?returnUrl=/events/${eventId}`}>
                  <Button className="w-full">Login to Register</Button>
                </Link>
              )}
              
              <Link href="/events">
                <Button variant="outline" className="w-full">
                  Browse More Events
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 