"use client";

import { useState, useEffect } from "react";
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Users, Edit, Trash2, ChevronRight, BarChart3, QrCode, Ticket, FormInput } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistance } from 'date-fns'
import { EventForm } from '@/components/events/EventForm'
import { EventFormData, EventType } from '@/types/event'
import { TicketManager } from '@/components/events/TicketManager'
import { updateEvent } from '@/lib/actions/event'
import { getClient } from '@/lib/db-client'

interface EventManagePageProps {
  params: {
    eventId: string
  }
}

// Define the shape of our event data
interface EventWithRegistrations {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  type?: EventType;
  categories?: string[];
  capacity: number;
  banner_url: string | null;
  banner_storage_path?: string | null;
  status: 'draft' | 'published' | 'cancelled';
  registration_deadline?: string;
  created_at: string;
  updated_at?: string;
  organizer_id?: string;
  registrations: { count: number }[] | null;
}

// Separate the client-side component
export default function EventManagePage({ params }: EventManagePageProps) {
  return <EventManageContent eventId={params.eventId} />;
}

async function fetchEventData(eventId: string) {
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  let typedEvent: EventWithRegistrations;
  let registrationCount = 0;
  let eventTickets: any[] = [];
  
  if (isLocalDb) {
    // Mock data for local development
    const mockEvents: EventWithRegistrations[] = [
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
      notFound();
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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      redirect('/auth');
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single();

    if (!profile || profile.role !== 'organizer') {
      redirect('/dashboard');
    }

    // Get event details
    const { data: event } = await supabase
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
      .eq('organizer_id', session.user.id)
      .single();

    if (!event) {
      notFound();
    }

    // Map event_date to date for consistency
    typedEvent = {
      ...event,
      date: event.event_date,
    } as unknown as EventWithRegistrations;

    // Get registration count
    const { count } = await supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);
      
    registrationCount = count || 0;

    // Fetch tickets for this event
    const { data: tickets, error: ticketsError } = await supabase
      .from('tickets')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true });

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
    }
    
    eventTickets = tickets || [];
  }

  // Use registration_deadline if available, otherwise fallback to date
  const deadline = typedEvent.registration_deadline || typedEvent.date;
  
  return { typedEvent, registrationCount, eventTickets, deadline };
}

// Client component for interactivity
function EventManageContent({ eventId }: { eventId: string }) {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(false);
  const [eventData, setEventData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const getEventData = async () => {
      try {
        setLoading(true);
        // Fetch event data using an API route
        const response = await fetch(`/api/events/${eventId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch event data");
        }
        const data = await response.json();
        setEventData(data);
      } catch (err) {
        setError("Error loading event data");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    getEventData();
  }, [eventId]);
  
  const handlePublishEvent = async () => {
    // Implementation for publishing event
    try {
      setLoading(true);
      await fetch(`/api/events/${eventId}/publish`, {
        method: 'POST',
      });
      // Update local state or refresh data
      window.location.reload();
    } catch (err) {
      console.error("Failed to publish event:", err);
      // Show error to user
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelEvent = async () => {
    // Implementation for cancelling event
    if (confirm("Are you sure you want to cancel this event? This cannot be undone.")) {
      try {
        setLoading(true);
        await fetch(`/api/events/${eventId}/cancel`, {
          method: 'POST',
        });
        // Update local state or refresh data
        window.location.reload();
      } catch (err) {
        console.error("Failed to cancel event:", err);
        // Show error to user
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (loading && !eventData) {
    return (
      <div className="container mx-auto py-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          <h3 className="text-lg font-medium">Error loading event</h3>
          <p>{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }
  
  if (!eventData) {
    // Showing a skeleton UI while data is being fetched
    return (
      <div className="container mx-auto py-10">
        <div className="mb-8">
          <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="h-8 w-64 bg-gray-200 animate-pulse rounded mb-2"></div>
          <div className="h-4 w-32 bg-gray-200 animate-pulse rounded"></div>
        </div>
        
        <div className="h-10 w-full bg-gray-200 animate-pulse rounded mb-6"></div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded"></div>
          ))}
        </div>
      </div>
    );
  }
  
  const { typedEvent, registrationCount, eventTickets, deadline } = eventData;
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <Link href="/dashboard" className="flex items-center text-sm text-muted-foreground mb-2 hover:text-foreground transition-colors">
          <ArrowLeft className="mr-1 h-4 w-4" /> Back to Dashboard
        </Link>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">{typedEvent.title}</h1>
          <Badge variant={typedEvent.status === 'published' ? 'default' : 
                           typedEvent.status === 'draft' ? 'outline' : 'destructive'}>
            {typedEvent.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          Event ID: {typedEvent.id}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-background">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edit">Edit Event</TabsTrigger>
          <TabsTrigger value="registrations">Registrations</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{registrationCount}</div>
                <p className="text-xs text-muted-foreground">
                  {Math.round((registrationCount / typedEvent.capacity) * 100)}% of capacity
                </p>
                <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full"
                    style={{ width: `${Math.min((registrationCount / typedEvent.capacity) * 100, 100)}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Date</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{new Date(typedEvent.date).toLocaleDateString()}</div>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(new Date(typedEvent.date), new Date(), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Registration Deadline</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(deadline).toLocaleDateString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatDistance(new Date(deadline), new Date(), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
                <CardDescription>Key information about this event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium mb-1">Location</h4>
                  <p className="text-sm text-muted-foreground">{typedEvent.location}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-1">Type</h4>
                  <p className="text-sm text-muted-foreground">{typedEvent.type || 'Marathon'}</p>
                </div>
                {typedEvent.categories && (
                  <div>
                    <h4 className="text-sm font-medium mb-1">Categories</h4>
                    <div className="flex flex-wrap gap-1">
                      {typedEvent.categories.map((category, i) => (
                        <Badge key={i} variant="outline">{category}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-medium mb-1">Description</h4>
                  <p className="text-sm text-muted-foreground">{typedEvent.description}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your event</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("edit")}
                >
                  <Edit className="mr-2 h-4 w-4" /> Edit Details
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setActiveTab("tickets")}
                >
                  <Ticket className="mr-2 h-4 w-4" /> Manage Tickets
                </Button>
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => window.location.href = `/events/${eventId}/validate`}
                >
                  <QrCode className="mr-2 h-4 w-4" /> Scan QR Codes
                </Button>
                {typedEvent.status === 'draft' && (
                  <Button 
                    className="w-full justify-start"
                    onClick={handlePublishEvent}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Publishing...
                      </>
                    ) : (
                      <>Publish Event</>
                    )}
                  </Button>
                )}
                {typedEvent.status === 'published' && (
                  <Button 
                    className="w-full justify-start" 
                    variant="destructive"
                    onClick={handleCancelEvent}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        Cancelling...
                      </>
                    ) : (
                      <>Cancel Event</>
                    )}
                  </Button>
                )}
              </CardContent>
              <CardFooter>
                <Link href={`/events/${typedEvent.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    View Public Page
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="edit">
          <Card>
            <CardHeader>
              <CardTitle>Edit Event</CardTitle>
              <CardDescription>Update your event details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Event editing is currently under development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>Event Registrations</CardTitle>
              <CardDescription>View and manage participant registrations</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Registration management is currently under development.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Management</CardTitle>
              <CardDescription>Configure event tickets and pricing</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Ticket management is currently under development.
              </p>
              {eventTickets.length > 0 ? (
                <div className="space-y-4">
                  {eventTickets.map((ticket) => (
                    <div key={ticket.id} className="border rounded-md p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{ticket.name}</h3>
                          <p className="text-sm text-muted-foreground">{ticket.description}</p>
                        </div>
                        <Badge>{ticket.status}</Badge>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Price:</span> ${ticket.price}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Quantity:</span> {ticket.quantity}
                        </div>
                        <div>
                          <span className="text-muted-foreground">Start:</span> {new Date(ticket.start_date).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="text-muted-foreground">End:</span> {new Date(ticket.end_date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No tickets found for this event.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 