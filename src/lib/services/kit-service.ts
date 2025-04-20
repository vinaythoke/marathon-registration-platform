'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/database.types';
import { 
  RaceKit, 
  RaceKitWithEvent, 
  KitAssignment, 
  KitAssignmentWithDetails,
  RaceKitSize,
  RaceKitType,
  KitDistribution
} from '@/types/volunteer';
import { revalidatePath } from 'next/cache';

// Create a Supabase client for server components
const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // Handle error if needed
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete({ name, ...options });
          } catch (error) {
            // Handle error if needed
          }
        },
      },
    }
  );
};

/**
 * Get race kits for an event
 */
export async function getEventKits(eventId: string): Promise<RaceKitWithEvent[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('race_kit_inventory')
    .select(`
      *,
      event:events (
        id,
        title,
        date
      )
    `)
    .eq('event_id', eventId);
    
  if (error) {
    console.error('Error fetching race kits:', error);
    throw new Error(`Failed to fetch race kits: ${error.message}`);
  }
  
  return data;
}

/**
 * Create a new race kit
 */
export async function createKit(kitData: {
  event_id: string;
  size: RaceKitSize;
  quantity: number;
  type: RaceKitType;
}): Promise<RaceKit> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('race_kit_inventory')
    .insert({
      event_id: kitData.event_id,
      size: kitData.size,
      quantity: kitData.quantity,
      type: kitData.type
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating race kit:', error);
    throw new Error(`Failed to create race kit: ${error.message}`);
  }
  
  // Revalidate the event page and volunteer pages
  revalidatePath(`/events/${kitData.event_id}`);
  revalidatePath(`/events/${kitData.event_id}/volunteers`);
  
  return data;
}

/**
 * Update a race kit
 */
export async function updateKit(
  kitId: string, 
  updates: Partial<Pick<RaceKit, 'size' | 'quantity' | 'type'>>
): Promise<RaceKit> {
  const supabase = createServerSupabaseClient();
  
  // Get the current kit to revalidate the right paths
  const { data: currentKit } = await supabase
    .from('race_kit_inventory')
    .select('event_id')
    .eq('kit_id', kitId)
    .single();
    
  if (!currentKit) {
    throw new Error('Race kit not found');
  }
  
  const { data, error } = await supabase
    .from('race_kit_inventory')
    .update(updates)
    .eq('kit_id', kitId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating race kit:', error);
    throw new Error(`Failed to update race kit: ${error.message}`);
  }
  
  // Revalidate the event page to reflect changes
  revalidatePath(`/events/${currentKit.event_id}`);
  revalidatePath(`/events/${currentKit.event_id}/volunteers`);
  
  return data;
}

/**
 * Delete a race kit
 */
export async function deleteKit(kitId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  
  // Get the current kit to revalidate the right paths
  const { data: currentKit } = await supabase
    .from('race_kit_inventory')
    .select('event_id')
    .eq('kit_id', kitId)
    .single();
    
  if (!currentKit) {
    throw new Error('Race kit not found');
  }
  
  const { error } = await supabase
    .from('race_kit_inventory')
    .delete()
    .eq('kit_id', kitId);
    
  if (error) {
    console.error('Error deleting race kit:', error);
    throw new Error(`Failed to delete race kit: ${error.message}`);
  }
  
  // Revalidate the event page to reflect changes
  revalidatePath(`/events/${currentKit.event_id}`);
  revalidatePath(`/events/${currentKit.event_id}/volunteers`);
}

/**
 * Get kit assignments for an event
 */
export async function getEventKitAssignments(eventId: string): Promise<KitAssignmentWithDetails[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('kit_assignments')
    .select(`
      *,
      kit:race_kit_inventory!kit_id(*),
      registration:registrations!registration_id (
        id,
        user_id,
        event_id,
        user:users (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('kit.event_id', eventId);
    
  if (error) {
    console.error('Error fetching kit assignments:', error);
    throw new Error(`Failed to fetch kit assignments: ${error.message}`);
  }
  
  return data;
}

/**
 * Get kit assignments for a specific registration
 */
export async function getRegistrationKitAssignments(registrationId: string): Promise<KitAssignmentWithDetails[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('kit_assignments')
    .select(`
      *,
      kit:race_kit_inventory!kit_id(*),
      registration:registrations!registration_id (
        id,
        user_id,
        event_id,
        user:users (
          id,
          full_name,
          email
        )
      )
    `)
    .eq('registration_id', registrationId);
    
  if (error) {
    console.error('Error fetching kit assignments:', error);
    throw new Error(`Failed to fetch kit assignments: ${error.message}`);
  }
  
  return data;
}

/**
 * Assign a kit to a registration
 */
export async function assignKit(
  kitId: string,
  registrationId: string,
  notes?: string
): Promise<KitAssignment> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('kit_assignments')
    .insert({
      kit_id: kitId,
      registration_id: registrationId,
      notes: notes || null
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error assigning kit:', error);
    throw new Error(`Failed to assign kit: ${error.message}`);
  }
  
  return data;
}

/**
 * Mark a kit as picked up
 */
export async function markKitAsPickedUp(assignmentId: string): Promise<KitAssignment> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('kit_assignments')
    .update({
      pickup_status: 'picked_up',
      picked_up_at: new Date().toISOString()
    })
    .eq('assignment_id', assignmentId)
    .select()
    .single();
    
  if (error) {
    console.error('Error marking kit as picked up:', error);
    throw new Error(`Failed to mark kit as picked up: ${error.message}`);
  }
  
  return data;
}

/**
 * Cancel a kit assignment
 */
export async function cancelKitAssignment(assignmentId: string): Promise<KitAssignment> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('kit_assignments')
    .update({
      pickup_status: 'cancelled'
    })
    .eq('assignment_id', assignmentId)
    .select()
    .single();
    
  if (error) {
    console.error('Error cancelling kit assignment:', error);
    throw new Error(`Failed to cancel kit assignment: ${error.message}`);
  }
  
  return data;
}

export async function getKitDistributionsByRegistration(registrationId: string): Promise<KitDistribution[]> {
  try {
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('kit_distributions')
      .select(`
        id,
        kit:race_kits!kit_id (
          kit_id,
          event_id,
          name,
          size,
          type,
          quantity,
          status,
          created_at,
          updated_at
        ),
        status,
        pickup_date,
        pickup_time,
        pickup_location,
        notes
      `)
      .eq('registration_id', registrationId);

    if (error) throw error;

    // Transform the data to match the KitDistribution type
    const transformedData = data?.map(item => ({
      ...item,
      kit: Array.isArray(item.kit) ? item.kit[0] : item.kit
    })) || [];

    return transformedData;
  } catch (error) {
    console.error('Error fetching kit distributions:', error);
    throw new Error('Failed to fetch kit distributions');
  }
} 