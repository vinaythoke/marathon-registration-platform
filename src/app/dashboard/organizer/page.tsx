import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Users, ChevronRight, PlusCircle, BarChart, Download } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistance } from 'date-fns'
import { getClient } from '@/lib/db-client'

// Define the shape of our events data
interface EventWithRegistrations {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
  banner_url: string | null;
  capacity: number;
  registrations: { count: number }[] | null;
}

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
    registrations: [{ count: 25 }]
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
    registrations: [{ count: 0 }]
  }
];

export default async function OrganizerDashboardPage() {
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  let userEvents: EventWithRegistrations[] = [];
  let userName = 'Test Organizer'; // Default name for local development
  
  if (isLocalDb) {
    // Use mock data for local development
    userEvents = mockEvents;
  } else {
    // Use Supabase for production
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      redirect('/auth');
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('role, first_name, last_name')
      .eq('auth_id', session.user.id)
      .single();
      
    // Ensure user is an organizer
    if (profile?.role !== 'organizer') {
      redirect('/dashboard');
    }
    
    userName = profile ? `${profile.first_name} ${profile.last_name}` : '';

    // Get events created by this organizer
    const { data: events } = await supabase
      .from('events')
      .select(`
        id,
        title,
        description,
        event_date,
        location,
        status,
        created_at,
        banner_url,
        capacity,
        registrations:registrations(count)
      `)
      .eq('organizer_id', session.user.id)
      .order('created_at', { ascending: false });

    // If no events found, initialize as empty array
    userEvents = events || [];
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {userName}
          </p>
        </div>
        
        <Link href="/events/create">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Event
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">My Events</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {userEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-muted/50 rounded-lg">
              <h3 className="text-xl font-medium mb-2">No events found</h3>
              <p className="text-muted-foreground mb-6">Create your first event to get started</p>
              <Link href="/events/create">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userEvents.map((event) => (
                <Card key={event.id} className="relative overflow-hidden">
                  {event.banner_url && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={event.banner_url} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="line-clamp-2">{event.title}</CardTitle>
                      <Badge variant={
                        event.status === 'published' ? 'default' : 
                        event.status === 'draft' ? 'outline' : 'destructive'
                      }>
                        {event.status}
                      </Badge>
                    </div>
                    <CardDescription>
                      {new Date(event.date).toLocaleDateString()}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      <CalendarDays className="h-4 w-4 mr-1" /> {event.location}
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-4 w-4 mr-1" /> 
                      {(event.registrations && event.registrations[0]?.count) || 0} / {event.capacity || 100} registered
                    </div>
                    <div className="w-full bg-secondary h-2 rounded-full mt-2 overflow-hidden">
                      <div 
                        className={`h-full ${
                          event.status === 'published' ? 'bg-primary' : 'bg-muted-foreground'
                        }`}
                        style={{ width: `${Math.min((((event.registrations && event.registrations[0]?.count) || 0) / (event.capacity || 100)) * 100, 100)}%` }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      Created {formatDistance(new Date(event.created_at), new Date(), { addSuffix: true })}
                    </div>
                    <Link href={`/events/${event.id}/manage`}>
                      <Button variant="ghost" size="sm">
                        Manage <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{userEvents.length}</div>
                <p className="text-xs text-muted-foreground">
                  {userEvents.filter(e => e.status === 'published').length} published
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {userEvents.reduce((acc, event) => acc + ((event.registrations && event.registrations[0]?.count) || 0), 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Across all events
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Analytics</CardTitle>
                <BarChart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Coming Soon</div>
                <p className="text-xs text-muted-foreground">
                  Detailed analytics in development
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Event Performance</CardTitle>
              <CardDescription>
                Registration rates for your events
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userEvents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No event data available</p>
              ) : (
                <div className="space-y-4">
                  {userEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex flex-col">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium truncate max-w-[200px]">{event.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {(event.registrations && event.registrations[0]?.count) || 0} / {event.capacity || 100}
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-primary h-full"
                          style={{ width: `${Math.min((((event.registrations && event.registrations[0]?.count) || 0) / (event.capacity || 100)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Button variant="outline" className="w-full" disabled>
                <Download className="mr-2 h-4 w-4" />
                Export Report (Coming Soon)
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 