'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EventFormData } from '@/types/event';
import { createClient } from '@/lib/supabase/server';

/**
 * Server action to update an event
 */
export async function updateEvent(eventId: string, data: EventFormData): Promise<void> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  const { error } = await supabase
    .from('events')
    .update({
      ...data,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .eq('organizer_id', session.user.id);

  if (error) {
    throw new Error('Failed to update event');
  }

  redirect(`/events/${eventId}/manage`);
} 