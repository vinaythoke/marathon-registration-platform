import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { v4 as uuidv4 } from 'uuid';

import { EventForm } from '@/components/events/EventForm'
import { EventFormData } from '@/types/event'
import { getClient } from '@/lib/db-client';

export default async function CreateEventPage() {
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  // For both local and production, we need to create a client
  const supabase = getClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  // Check if user has organizer role
  let isOrganizer = false;
  
  if (isLocalDb) {
    // In local development, check the role from environment variable
    const role = process.env.DEV_USER_ROLE || 'runner';
    isOrganizer = role === 'organizer';
  } else {
    // In production, check the role from the database
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();
    
    isOrganizer = profile?.role === 'organizer';
  }

  // Redirect if not an organizer
  if (!isOrganizer) {
    redirect('/dashboard');
  }

  // Handle form submission
  const handleCreateEvent = async (data: EventFormData): Promise<void> => {
    if (isLocalDb) {
      console.log('Creating event in local mode:', data);
      // For local development, we just simulate success
      // In a real implementation, we would store this in local storage or a mock DB
      
      // Generate a random ID for the event
      const eventId = uuidv4();
      console.log(`Event created with ID: ${eventId}`);
      
      // Redirect to the dashboard
      redirect('/dashboard/organizer');
    } else {
      // For production, store in the database
      const { error } = await supabase
        .from('events')
        .insert([{
          ...data,
          organizer_id: session.user.id,
          status: 'draft'
        }]);

      if (error) {
        throw new Error(`Failed to create event: ${error.message}`);
      }

      redirect('/dashboard/organizer');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Create New Event</h1>
      <EventForm onSubmit={handleCreateEvent} />
    </div>
  );
} 