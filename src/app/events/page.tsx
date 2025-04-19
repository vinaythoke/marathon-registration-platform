import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils';

// Mock events for when no real data is available
const mockEvents = [
  {
    id: 'mock-1',
    title: 'City Marathon 2023',
    description: 'The biggest marathon event in the city with multiple categories.',
    event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Central Park, New York',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1564352969906-8b7f46a8f3cc?w=800&auto=format&fit=crop'
  },
  {
    id: 'mock-2',
    title: 'Half Marathon Challenge',
    description: 'A challenging half marathon route through scenic trails.',
    event_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Mountain View Park',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1594882645126-14020914d58d?w=800&auto=format&fit=crop'
  },
  {
    id: 'mock-3',
    title: '5K Fun Run',
    description: 'Family-friendly 5K run for all ages and experience levels.',
    event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    location: 'Downtown River Trail',
    status: 'published',
    banner_url: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=800&auto=format&fit=crop'
  }
];

export default async function EventsPage() {
  // Try to fetch real events from database
  let events = [];
  
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .order('event_date', { ascending: true });
      
    if (!error && data && data.length > 0) {
      events = data;
    } else {
      // Use mock data if no events found
      events = mockEvents;
    }
  } catch (error) {
    console.error('Error fetching events:', error);
    // Fallback to mock data
    events = mockEvents;
  }

  return (
    <div className="container mx-auto py-12">
      <h1 className="text-3xl font-bold mb-6">Upcoming Events</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <Card key={event.id} className="overflow-hidden flex flex-col">
            {event.banner_url && (
              <div className="aspect-video w-full overflow-hidden">
                <img 
                  src={event.banner_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <CardTitle>{event.title}</CardTitle>
              <CardDescription>{formatDate(event.event_date)}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground mb-2">{event.location}</p>
              <p className="line-clamp-3">{event.description}</p>
            </CardContent>
            <CardFooter>
              <Link href={`/events/${event.id}`} passHref className="w-full">
                <Button className="w-full">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
} 