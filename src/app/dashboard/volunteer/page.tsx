import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Users, QrCode, ClipboardCheck, ChevronRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistance } from 'date-fns'
import { getClient } from '@/lib/db-client'

// Define the shape of our events data
interface EventWithAssignments {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
  banner_url: string | null;
  volunteer_count: number;
}

// Mock data for local development
const mockEvents: EventWithAssignments[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Test Marathon',
    description: 'A test marathon event',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Test City',
    status: 'published',
    created_at: new Date().toISOString(),
    banner_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    volunteer_count: 15
  },
  {
    id: '55555555-5555-5555-5555-555555555555',
    title: 'Local Development Marathon',
    description: 'A test event for local development',
    date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Local City',
    status: 'published',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    banner_url: null,
    volunteer_count: 8
  }
];

export default async function VolunteerDashboardPage() {
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  let assignedEvents: EventWithAssignments[] = [];
  let userName = 'Test Volunteer'; // Default name for local development
  
  if (isLocalDb) {
    // Use mock data for local development
    assignedEvents = mockEvents;
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
      
    // Ensure user is a volunteer
    if (profile?.role !== 'volunteer') {
      redirect('/dashboard');
    }
    
    userName = profile ? `${profile.first_name} ${profile.last_name}` : '';

    // Get events this volunteer is assigned to
    const { data: assignments } = await supabase
      .from('volunteer_assignments')
      .select(`
        event:events(
          id,
          title,
          description,
          event_date,
          location,
          status,
          created_at,
          banner_url
        ),
        volunteer_count:events(
          volunteer_assignments(count)
        )
      `)
      .eq('volunteer_id', session.user.id)
      .order('created_at', { ascending: false });
    
    // Extract events from assignments
    if (assignments) {
      const eventMap = new Map();
      assignments.forEach(assignment => {
        if (assignment.event) {
          eventMap.set(assignment.event.id, {
            ...assignment.event,
            volunteer_count: assignment.volunteer_count || 0
          });
        }
      });
      assignedEvents = Array.from(eventMap.values());
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Volunteer Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome, {userName}
          </p>
        </div>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Assigned Events</TabsTrigger>
          <TabsTrigger value="tasks">Current Tasks</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {assignedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-muted/50 rounded-lg">
              <h3 className="text-xl font-medium mb-2">No events assigned</h3>
              <p className="text-muted-foreground mb-6">You are not assigned to any events yet</p>
              <Link href="/events">
                <Button>
                  Browse Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignedEvents.map((event) => (
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
                      <Badge>{event.status}</Badge>
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
                      {event.volunteer_count} volunteers assigned
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      {formatDistance(new Date(event.date), new Date(), { addSuffix: true })}
                    </div>
                    <Link href={`/events/${event.id}/volunteer`}>
                      <Button variant="ghost" size="sm">
                        View Tasks <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Check-in Station</CardTitle>
                <CardDescription>Verify runners and distribute race kits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <QrCode className="h-10 w-10 text-primary" />
                    <div>
                      <h4 className="font-medium">QR Code Scanner</h4>
                      <p className="text-sm text-muted-foreground">Scan runner QR codes to check them in</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <ClipboardCheck className="h-10 w-10 text-primary" />
                    <div>
                      <h4 className="font-medium">Attendance Tracking</h4>
                      <p className="text-sm text-muted-foreground">Record runner attendance</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Link href="/dashboard/volunteer/check-in" className="w-full">
                  <Button className="w-full">
                    Go to Check-in Station
                  </Button>
                </Link>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Equipment Management</CardTitle>
                <CardDescription>Track and manage event equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">This feature is coming soon.</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 