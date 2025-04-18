import React from 'react';
import { DigitalTicket as DigitalTicketType } from './types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronRight, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface TicketListProps {
  tickets: DigitalTicketType[];
  title?: string;
}

export const TicketList: React.FC<TicketListProps> = ({ tickets, title = 'Your Tickets' }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };

  if (!tickets || tickets.length === 0) {
    return (
      <Card className="w-full mt-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">You don't have any tickets yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>Manage your event tickets</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <Card key={ticket.id} className="overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                <div className="bg-primary p-4 text-white sm:w-1/4 flex flex-col justify-center items-center">
                  <h3 className="font-bold text-lg mb-1 text-center">{ticket.event_name}</h3>
                  <Badge className={`${getStatusColor(ticket.status)} mt-2`}>
                    {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </Badge>
                </div>
                <div className="p-4 sm:p-6 flex-1">
                  <h4 className="font-semibold mb-2">{ticket.ticket_name}</h4>
                  
                  <div className="flex flex-col space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(ticket.event_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{ticket.event_location}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <Link href={`/dashboard/tickets/${ticket.id}`} passHref>
                      <Button variant="outline" size="sm" className="flex items-center">
                        <QrCode className="mr-1 h-4 w-4" />
                        View Ticket
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TicketList; 