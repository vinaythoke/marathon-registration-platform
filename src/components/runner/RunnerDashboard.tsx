"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserTickets } from "@/lib/services/ticket-service";
import { DigitalTicket } from "@/components/tickets/types";
import TicketList from "@/components/tickets/TicketList";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Ticket, CalendarDays, Activity } from "lucide-react";
import StatisticsTab from "./statistics-tab";

export default function RunnerDashboard() {
  const [tickets, setTickets] = useState<DigitalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the current user
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError("Authentication required. Please sign in to view your dashboard.");
        setLoading(false);
        return;
      }
      
      setUserId(user.id);
      
      // Fetch tickets for the user
      const userTickets = await getUserTickets(user.id);
      setTickets(userTickets);
      
      // Get upcoming events for the user
      const { data: registrations } = await supabase
        .from('registrations')
        .select(`
          *,
          event:events(*),
          ticket:tickets(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (registrations) {
        // Filter for upcoming events (where event date is in the future)
        const upcoming = registrations
          .filter(reg => {
            const eventDate = new Date(reg.event?.date);
            return eventDate > new Date();
          })
          .map(reg => ({
            id: reg.event?.id,
            title: reg.event?.title,
            date: reg.event?.date,
            location: reg.event?.location,
            ticket: reg.ticket?.name,
            registrationId: reg.id
          }));
        
        setUpcomingEvents(upcoming);
      }
      
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Failed to load your dashboard data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="my-6">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Runner Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your race registrations and view your tickets
        </p>
      </div>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">My Events</TabsTrigger>
          <TabsTrigger value="tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="statistics">My Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
            
            {upcomingEvents.length === 0 ? (
              <Card>
                <CardContent className="py-6">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-4">You don't have any upcoming events.</p>
                    <Link href="/events">
                      <Button>
                        Browse Events
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingEvents.map((event) => (
                  <Card key={event.id}>
                    <CardHeader>
                      <CardTitle>{event.title}</CardTitle>
                      <CardDescription>
                        <div className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{event.location}</p>
                      <p className="text-sm font-medium">Ticket: {event.ticket}</p>
                    </CardContent>
                    <div className="p-4 pt-0 flex justify-between">
                      <Link href={`/dashboard/events/${event.id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                      </Link>
                      <Link href={`/dashboard/tickets/${event.registrationId}`}>
                        <Button variant="default" size="sm" className="flex items-center">
                          <Ticket className="mr-1 h-4 w-4" />
                          View Ticket
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="tickets" className="space-y-4">
          <TicketList tickets={tickets} title="My Tickets" />
          
          {tickets.length > 0 && (
            <div className="flex justify-center mt-4">
              <Link href="/dashboard/tickets">
                <Button variant="outline">
                  View All Tickets
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          {userId && <StatisticsTab userId={userId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
} 