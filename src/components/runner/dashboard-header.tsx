import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";

interface RunnerDashboardHeaderProps {
  upcomingCount: number;
  nextEvent?: {
    id: string;
    title: string;
    date: string;
    location: string;
  } | null;
}

export default function RunnerDashboardHeader({ 
  upcomingCount, 
  nextEvent 
}: RunnerDashboardHeaderProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Events</h1>
        <p className="text-muted-foreground mt-1">
          Track your upcoming and past events
        </p>
      </div>
      
      {nextEvent ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-start">
              <span>Next Event</span>
              <div className="text-sm font-normal bg-primary/10 text-primary px-3 py-1 rounded-full">
                {formatTimeToEvent(nextEvent.date)}
              </div>
            </CardTitle>
            <CardDescription>Your next upcoming event</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{nextEvent.title}</h3>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <CalendarDays className="h-4 w-4" />
                    <span>{format(new Date(nextEvent.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{format(new Date(nextEvent.date), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    <span>{nextEvent.location}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Link href={`/events/${nextEvent.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="h-4 w-4" />
                    Event Details
                  </Button>
                </Link>
                
                <Link href={`/dashboard/runner/events/${nextEvent.id}`}>
                  <Button size="sm">View Registration</Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : upcomingCount === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Upcoming Events</CardTitle>
            <CardDescription>
              You don't have any upcoming events. Explore events to register.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/events">
              <Button>Explore Events</Button>
            </Link>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function formatTimeToEvent(eventDate: string): string {
  const date = new Date(eventDate);
  const now = new Date();
  
  // If event is in the past
  if (date < now) {
    return "Event Passed";
  }
  
  const timeLeft = formatDistanceToNow(date, { addSuffix: true });
  return timeLeft;
} 