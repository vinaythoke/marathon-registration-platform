'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/database.types';
import { Event } from '@/types/database';

// Create a Supabase client for server components
const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string): Promise<Event | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();
    
  if (error) {
    console.error('Error fetching event:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all events
 */
export async function getEvents(status?: 'draft' | 'published' | 'cancelled'): Promise<Event[]> {
  const supabase = createServerSupabaseClient();
  
  let query = supabase
    .from('events')
    .select('*')
    .order('date', { ascending: false });
    
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching events:', error);
    return [];
  }
  
  return data || [];
} 