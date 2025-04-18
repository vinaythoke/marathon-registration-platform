import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Users, ChevronRight, Medal, Clock, PlusCircle, Shield } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistance } from 'date-fns'
import { getClient } from '@/lib/db-client'
import { getUserVerificationStatus } from '@/lib/actions/verification'
import { VerificationBadge } from '@/components/verification/verification-badge'

// Define the shape of our events data
interface EventWithRegistration {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  status: 'draft' | 'published' | 'cancelled';
  created_at: string;
  banner_url: string | null;
  registration_status: 'pending' | 'confirmed' | 'cancelled' | 'checked_in';
  ticket_name: string;
}

// Mock data for local development
const mockEvents: EventWithRegistration[] = [
  {
    id: '44444444-4444-4444-4444-444444444444',
    title: 'Test Marathon',
    description: 'A test marathon event',
    date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Test City',
    status: 'published',
    created_at: new Date().toISOString(),
    banner_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=500&q=80',
    registration_status: 'confirmed',
    ticket_name: 'Standard Entry'
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
    registration_status: 'pending',
    ticket_name: 'Early Bird'
  }
];

// Mock stats for local development
const mockStats = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    event_name: 'Previous Marathon',
    date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    distance: 21.1,
    time_seconds: 7200,
    pace_per_km: 340,
    position: 120,
    total_participants: 500
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    event_name: 'City 10K',
    date: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    distance: 10,
    time_seconds: 3000,
    pace_per_km: 300,
    position: 50,
    total_participants: 300
  }
];

export default async function RunnerDashboardPage() {
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  let registeredEvents: EventWithRegistration[] = [];
  let runnerStats = mockStats;
  let userName = 'Test Runner'; // Default name for local development
  let verificationStatus = { status: 'pending', type: 'aadhaar' };
  
  if (isLocalDb) {
    // Use mock data for local development
    registeredEvents = mockEvents;
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
      
    // Ensure user is a runner
    if (profile?.role !== 'runner') {
      redirect('/dashboard');
    }
    
    userName = profile ? `${profile.first_name} ${profile.last_name}` : '';

    // Get verification status
    verificationStatus = await getUserVerificationStatus() || { status: 'not_verified', type: 'aadhaar' };

    // Get events this runner is registered for
    const { data: registrations } = await supabase
      .from('registrations')
      .select(`
        id,
        status,
        ticket:tickets(name),
        event:events(
          id,
          title,
          description,
          event_date,
          location,
          status,
          created_at,
          banner_url
        )
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    // Transform registrations into the format we need
    if (registrations) {
      registeredEvents = registrations.map(reg => ({
        id: reg.event.id,
        title: reg.event.title,
        description: reg.event.description,
        date: reg.event.event_date,
        location: reg.event.location,
        status: reg.event.status,
        created_at: reg.event.created_at,
        banner_url: reg.event.banner_url,
        registration_status: reg.status,
        ticket_name: reg.ticket?.name || 'Standard Entry'
      }));
    }

    // Get runner stats
    const { data: stats } = await supabase
      .from('run_statistics')
      .select(`
        id,
        event:events(title),
        event_date,
        distance,
        time_seconds,
        pace_per_km,
        metadata
      `)
      .eq('user_id', session.user.id)
      .order('event_date', { ascending: false })
      .limit(5);
    
    if (stats) {
      runnerStats = stats.map(stat => ({
        id: stat.id,
        event_name: stat.event?.title || 'Personal Run',
        date: stat.event_date,
        distance: stat.distance,
        time_seconds: stat.time_seconds,
        pace_per_km: stat.pace_per_km,
        position: stat.metadata?.position || null,
        total_participants: stat.metadata?.total_participants || null
      }));
    }
  }

  // Helper function to format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else {
      return `${minutes}m ${secs}s`;
    }
  };

  // Helper function to format pace
  const formatPace = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}/km`;
  };

  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Runner Dashboard</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-muted-foreground">
              Welcome, {userName}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground mx-1">•</span>
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm">Aadhaar:</span>
                <VerificationBadge 
                  status={verificationStatus?.status || 'not_verified'} 
                  type="aadhaar"
                  size="sm"
                  showLabel={true}
                />
              </div>
              {verificationStatus?.status !== 'verified' && (
                <Link href="/dashboard/profile?tab=verification">
                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                    Verify Now
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">My Registrations</TabsTrigger>
          <TabsTrigger value="stats">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          {registeredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 bg-muted/50 rounded-lg">
              <h3 className="text-xl font-medium mb-2">No registrations found</h3>
              <p className="text-muted-foreground mb-6">Register for an event to get started</p>
              <Link href="/events">
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Browse Events
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {registeredEvents.map((event) => (
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
                        event.registration_status === 'confirmed' ? 'default' : 
                        event.registration_status === 'pending' ? 'outline' : 'destructive'
                      }>
                        {event.registration_status}
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
                    <div className="text-sm text-muted-foreground">
                      Ticket: {event.ticket_name}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div className="text-xs text-muted-foreground">
                      {formatDistance(new Date(event.date), new Date(), { addSuffix: true })}
                    </div>
                    <Link href={`/dashboard/tickets/${event.id}`}>
                      <Button variant="ghost" size="sm">
                        View Ticket <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Races</CardTitle>
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{runnerStats.length}</div>
                <p className="text-xs text-muted-foreground">
                  Events completed
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Distance</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {runnerStats.reduce((acc, stat) => acc + stat.distance, 0).toFixed(1)} km
                </div>
                <p className="text-xs text-muted-foreground">
                  Distance covered
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Best Performance</CardTitle>
                <Medal className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {runnerStats.length > 0 
                    ? formatPace(Math.min(...runnerStats.map(s => s.pace_per_km)))
                    : 'N/A'
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  Best pace
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="w-full">
            <CardHeader>
              <CardTitle>Race History</CardTitle>
              <CardDescription>
                Your recent event performances
              </CardDescription>
            </CardHeader>
            <CardContent>
              {runnerStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No race history available</p>
              ) : (
                <div className="space-y-6">
                  {runnerStats.map((stat) => (
                    <div key={stat.id} className="flex flex-col">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{stat.event_name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {new Date(stat.date).toLocaleDateString()} • {stat.distance} km
                          </p>
                        </div>
                        {stat.position && (
                          <Badge variant="outline" className="ml-2">
                            {stat.position}/{stat.total_participants}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Time</p>
                          <p className="font-medium">{formatTime(stat.time_seconds)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Pace</p>
                          <p className="font-medium">{formatPace(stat.pace_per_km)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t px-6 py-4">
              <Link href="/dashboard/runner/statistics" className="w-full">
                <Button variant="outline" className="w-full">
                  View Detailed Statistics
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 