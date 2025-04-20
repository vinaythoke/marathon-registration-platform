'use server';

import { createClient } from '@/lib/supabase/server';
import { type Database } from '@/types/supabase';

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string) {
  try {
    const supabase = await createClient();
    const { data: event } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    return event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

/**
 * Get all events
 */
export async function getEvents(status?: 'draft' | 'published' | 'cancelled') {
  try {
    const supabase = await createClient();
    let query = supabase.from('events').select('*');

    if (status) {
      query = query.eq('status', status);
    }

    const { data: events } = await query;
    return events || [];
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
} 