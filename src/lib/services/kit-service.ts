'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/database.types';
import { RaceKit, KitDistribution } from '@/types/volunteer';
import { revalidatePath } from 'next/cache';

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
 * Get race kits for an event
 */
export async function getKits(eventId: string): Promise<RaceKit[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('race_kits')
    .select('*')
    .eq('event_id', eventId);
    
  if (error) {
    console.error('Error fetching race kits:', error);
    throw new Error(`Failed to fetch race kits: ${error.message}`);
  }
  
  // Calculate available quantity
  return data.map(kit => ({
    ...kit,
    available_quantity: kit.total_quantity - kit.distributed_quantity
  }));
}

/**
 * Create a new race kit
 */
export async function createKit(kitData: Omit<RaceKit, 'id' | 'created_at' | 'updated_at' | 'available_quantity'>): Promise<RaceKit> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('race_kits')
    .insert({
      id: uuidv4(),
      event_id: kitData.event_id,
      name: kitData.name,
      description: kitData.description || null,
      total_quantity: kitData.total_quantity,
      distributed_quantity: 0
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
  
  return {
    ...data,
    available_quantity: data.total_quantity - data.distributed_quantity
  };
}

/**
 * Update a race kit
 */
export async function updateKit(
  id: string, 
  kitData: Partial<Pick<RaceKit, 'name' | 'description' | 'total_quantity'>>
): Promise<RaceKit> {
  const supabase = createServerSupabaseClient();
  
  // Get the current kit to revalidate the right paths
  const { data: currentKit } = await supabase
    .from('race_kits')
    .select('event_id')
    .eq('id', id)
    .single();
    
  if (!currentKit) {
    throw new Error('Race kit not found');
  }
  
  const { data, error } = await supabase
    .from('race_kits')
    .update({
      name: kitData.name,
      description: kitData.description,
      total_quantity: kitData.total_quantity,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating race kit:', error);
    throw new Error(`Failed to update race kit: ${error.message}`);
  }
  
  // Revalidate the event page to reflect changes
  revalidatePath(`/events/${currentKit.event_id}`);
  revalidatePath(`/events/${currentKit.event_id}/volunteers`);
  
  return {
    ...data,
    available_quantity: data.total_quantity - data.distributed_quantity
  };
}

/**
 * Delete a race kit
 */
export async function deleteKit(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  
  // Get the current kit to revalidate the right paths
  const { data: currentKit } = await supabase
    .from('race_kits')
    .select('event_id')
    .eq('id', id)
    .single();
    
  if (!currentKit) {
    throw new Error('Race kit not found');
  }
  
  const { error } = await supabase
    .from('race_kits')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting race kit:', error);
    throw new Error(`Failed to delete race kit: ${error.message}`);
  }
  
  // Revalidate the event page to reflect changes
  revalidatePath(`/events/${currentKit.event_id}`);
  revalidatePath(`/events/${currentKit.event_id}/volunteers`);
}

/**
 * Get kit distributions for an event
 */
export async function getKitDistributions(eventId: string): Promise<KitDistribution[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('kit_distribution')
    .select(`
      *,
      race_kits!kit_id(*),
      profiles!distributed_by(id, name)
    `)
    .order('distributed_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching kit distributions:', error);
    throw new Error(`Failed to fetch kit distributions: ${error.message}`);
  }
  
  return data.map(item => ({
    ...item,
    kit: item.race_kits,
    distributor: item.profiles
  } as unknown as KitDistribution));
}

/**
 * Get kit distributions for a specific registration
 */
export async function getKitDistributionsByRegistration(registrationId: string): Promise<KitDistribution[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('kit_distribution')
    .select(`
      *,
      race_kits!kit_id(*),
      profiles!distributed_by(id, name)
    `)
    .eq('registration_id', registrationId)
    .order('distributed_at', { ascending: false });
    
  if (error) {
    console.error('Error fetching kit distributions for registration:', error);
    throw new Error(`Failed to fetch kit distributions: ${error.message}`);
  }
  
  return data.map(item => ({
    ...item,
    kit: item.race_kits,
    distributor: item.profiles
  } as unknown as KitDistribution));
}

/**
 * Distribute a kit to a participant
 */
export async function distributeKit(
  kitId: string,
  registrationId: string,
  notes?: string
): Promise<KitDistribution> {
  const supabase = createServerSupabaseClient();
  
  // Get current user's ID from session
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('You must be logged in to distribute kits');
  }
  
  // Get the race kit for validation
  const { data: kit } = await supabase
    .from('race_kits')
    .select('*')
    .eq('id', kitId)
    .single();
    
  if (!kit) {
    throw new Error('Race kit not found');
  }
  
  // Verify that there are kits available
  if (kit.distributed_quantity >= kit.total_quantity) {
    throw new Error('All kits of this type have been distributed');
  }
  
  // Start a transaction
  // Note: Supabase doesn't support proper transactions in the client,
  // so we'll use separate operations and handle errors manually
  
  // 1. Create the distribution record
  const { data: distribution, error: distributionError } = await supabase
    .from('kit_distribution')
    .insert({
      id: uuidv4(),
      kit_id: kitId,
      registration_id: registrationId,
      distributed_by: user.id,
      distributed_at: new Date().toISOString(),
      notes: notes || null
    })
    .select(`
      *,
      race_kits!kit_id(*),
      profiles!distributed_by(id, name)
    `)
    .single();
    
  if (distributionError) {
    console.error('Error creating kit distribution:', distributionError);
    throw new Error(`Failed to distribute kit: ${distributionError.message}`);
  }
  
  // 2. Update the kit's distributed quantity
  const { error: updateError } = await supabase
    .from('race_kits')
    .update({
      distributed_quantity: kit.distributed_quantity + 1,
      updated_at: new Date().toISOString()
    })
    .eq('id', kitId);
    
  if (updateError) {
    // If updating the kit fails, try to remove the distribution record
    await supabase
      .from('kit_distribution')
      .delete()
      .eq('id', distribution.id)
      .throwOnError();
      
    console.error('Error updating kit quantity:', updateError);
    throw new Error(`Failed to update kit quantity: ${updateError.message}`);
  }
  
  // Get the event ID for revalidation
  const { data: kitWithEvent } = await supabase
    .from('race_kits')
    .select('event_id')
    .eq('id', kitId)
    .single();
    
  if (kitWithEvent) {
    // Revalidate paths
    revalidatePath(`/events/${kitWithEvent.event_id}`);
    revalidatePath(`/events/${kitWithEvent.event_id}/volunteers`);
  }
  
  return {
    ...distribution,
    kit: distribution.race_kits,
    distributor: distribution.profiles
  } as unknown as KitDistribution;
}

/**
 * Cancel a kit distribution
 */
export async function cancelKitDistribution(distributionId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  
  // Get the distribution record for validation
  const { data: distribution } = await supabase
    .from('kit_distribution')
    .select(`
      *,
      race_kits!kit_id(event_id)
    `)
    .eq('id', distributionId)
    .single();
    
  if (!distribution) {
    throw new Error('Distribution record not found');
  }
  
  // Get the race kit
  const { data: kit } = await supabase
    .from('race_kits')
    .select('*')
    .eq('id', distribution.kit_id)
    .single();
    
  if (!kit) {
    throw new Error('Race kit not found');
  }
  
  // Start a transaction
  // 1. Delete the distribution record
  const { error: deleteError } = await supabase
    .from('kit_distribution')
    .delete()
    .eq('id', distributionId);
    
  if (deleteError) {
    console.error('Error cancelling kit distribution:', deleteError);
    throw new Error(`Failed to cancel distribution: ${deleteError.message}`);
  }
  
  // 2. Update the kit's distributed quantity
  const { error: updateError } = await supabase
    .from('race_kits')
    .update({
      distributed_quantity: Math.max(0, kit.distributed_quantity - 1),
      updated_at: new Date().toISOString()
    })
    .eq('id', kit.id);
    
  if (updateError) {
    console.error('Error updating kit quantity:', updateError);
    throw new Error(`Failed to update kit quantity: ${updateError.message}`);
  }
  
  // Revalidate paths if we have the event ID
  if (distribution.race_kits?.event_id) {
    revalidatePath(`/events/${distribution.race_kits.event_id}`);
    revalidatePath(`/events/${distribution.race_kits.event_id}/volunteers`);
  }
} 