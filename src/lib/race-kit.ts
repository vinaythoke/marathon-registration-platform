import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { 
  RaceKitInventory, 
  KitAssignment, 
  RaceKitWithEvent,
  KitAssignmentWithDetails 
} from '@/types/race-kit';

const supabase = createClientComponentClient();

export async function createKitInventory(kitData: Omit<RaceKitInventory, 'kit_id' | 'created_at' | 'updated_at' | 'status'>) {
  const { data, error } = await supabase
    .from('race_kit_inventory')
    .insert(kitData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKitInventory(
  kitId: string,
  updates: Partial<Omit<RaceKitInventory, 'kit_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('race_kit_inventory')
    .update(updates)
    .eq('kit_id', kitId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getEventKitInventory(eventId: string): Promise<RaceKitWithEvent[]> {
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

  if (error) throw error;
  return data;
}

export async function assignKitToRegistration(
  kitId: string,
  registrationId: string,
  notes?: string
): Promise<KitAssignment> {
  const { data, error } = await supabase
    .from('kit_assignments')
    .insert({
      kit_id: kitId,
      registration_id: registrationId,
      notes
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateKitAssignment(
  assignmentId: string,
  updates: Partial<Omit<KitAssignment, 'assignment_id' | 'kit_id' | 'registration_id' | 'assigned_at'>>
) {
  const { data, error } = await supabase
    .from('kit_assignments')
    .update(updates)
    .eq('assignment_id', assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getKitAssignmentsForEvent(eventId: string): Promise<KitAssignmentWithDetails[]> {
  const { data, error } = await supabase
    .from('kit_assignments')
    .select(`
      *,
      kit:race_kit_inventory (*),
      registration:registrations (
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

  if (error) throw error;
  return data;
}

export async function getKitAssignmentForRegistration(registrationId: string): Promise<KitAssignmentWithDetails | null> {
  const { data, error } = await supabase
    .from('kit_assignments')
    .select(`
      *,
      kit:race_kit_inventory (*),
      registration:registrations (
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
    .eq('registration_id', registrationId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
  return data;
}

export async function markKitAsPickedUp(assignmentId: string) {
  const { data, error } = await supabase
    .from('kit_assignments')
    .update({
      pickup_status: 'picked_up',
      picked_up_at: new Date().toISOString()
    })
    .eq('assignment_id', assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function cancelKitAssignment(assignmentId: string) {
  const { data, error } = await supabase
    .from('kit_assignments')
    .update({
      pickup_status: 'cancelled'
    })
    .eq('assignment_id', assignmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
} 