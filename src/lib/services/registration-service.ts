import { createClient } from '@/lib/supabase/server';
import { type Database } from '@/types/supabase';

export async function getRegistration(registrationId: string) {
  try {
    const supabase = await createClient();
    const { data: registration } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .single();

    return registration;
  } catch (error) {
    console.error('Error fetching registration:', error);
    return null;
  }
}

export async function getRegistrations(eventId?: string) {
  try {
    const supabase = await createClient();
    let query = supabase.from('registrations').select('*');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data: registrations } = await query;
    return registrations || [];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
}

export async function createRegistration(data: any) {
  try {
    const supabase = await createClient();
    const { data: registration, error } = await supabase
      .from('registrations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return registration;
  } catch (error) {
    console.error('Error creating registration:', error);
    return null;
  }
}

export async function updateRegistration(registrationId: string, data: any) {
  try {
    const supabase = await createClient();
    const { data: registration, error } = await supabase
      .from('registrations')
      .update(data)
      .eq('id', registrationId)
      .select()
      .single();

    if (error) throw error;
    return registration;
  } catch (error) {
    console.error('Error updating registration:', error);
    return null;
  }
} 