import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, Clock, MapPin, Ticket, ExternalLink } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface UpcomingEventCardProps {
  registration: {
    id: string;
    status: string;
    event: {
      id: string;
      title: string;
      date: string;
      location: string;
      banner_url?: string;
    };
    ticket: {
      name: string;
      price: number;
    };
  };
}

export default function UpcomingEventCard({ registration }: UpcomingEventCardProps) {
  const { event, ticket } = registration;
  const eventDate = new Date(event.date);
  
  // Format registration status for display
  const statusColor = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    checked_in: "bg-blue-100 text-blue-800"
  }[registration.status] || "bg-gray-100 text-gray-800";

  const statusText = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    checked_in: "Checked In"
  }[registration.status] || "Unknown";
  
  return (
    <Card className="overflow-hidden h-full flex flex-col">
      {event.banner_url && (
        <div className="h-40 overflow-hidden">
          <img 
            src={event.banner_url} 
            alt={event.title} 
            className="w-full h-full object-cover" 
          />
        </div>
      )}
      
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start mb-2">
          <Badge 
            variant="outline" 
            className={`${statusColor} border-0`}
          >
            {statusText}
          </Badge>
          <div className="text-sm text-muted-foreground">
            {format(eventDate, 'MMM d')}
          </div>
        </div>
        <h3 className="font-semibold text-lg line-clamp-2">{event.title}</h3>
      </CardHeader>
      
      <CardContent className="pb-4 flex-grow">
        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground/70" />
            <span>{format(eventDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground/70" />
            <span>{format(eventDate, 'h:mm a')}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground/70" />
            <span className="line-clamp-1">{event.location}</span>
          </div>
          <div className="flex items-center gap-2">
            <Ticket className="h-4 w-4 text-muted-foreground/70" />
            <span>
              {ticket.name} - {ticket.price === 0 ? 'Free' : formatCurrency(ticket.price)}
            </span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 border-t flex justify-between">
        <Link href={`/events/${event.id}`}>
          <Button variant="ghost" size="sm" className="gap-1 h-8">
            <ExternalLink className="h-3 w-3" />
            Event Details
          </Button>
        </Link>
        
        <Link href={`/dashboard/runner/events/${event.id}`}>
          <Button size="sm" className="h-8">View Registration</Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 