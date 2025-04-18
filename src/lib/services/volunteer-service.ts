'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/database.types';
import { 
  VolunteerProfile, 
  VolunteerRole, 
  VolunteerAssignment,
  VolunteerTraining,
  TrainingCompletion,
  RaceKit,
  KitDistribution,
  VolunteerWithProfile,
  VolunteerDashboardStats
} from '@/types/volunteer';
import { Profile } from '@/types/database';
import { revalidatePath } from 'next/cache';

// Create a Supabase client for server components
const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

/**
 * Get volunteers with their profiles
 */
export async function getVolunteers(eventId?: string): Promise<VolunteerWithProfile[]> {
  const supabase = createServerSupabaseClient();
  
  let query = supabase
    .from('profiles')
    .select(`
      *,
      volunteer_profiles!inner(*)
    `)
    .eq('role', 'volunteer');
    
  if (eventId) {
    // If eventId is provided, get only volunteers assigned to this event
    const { data: assignments } = await supabase
      .from('volunteer_assignments')
      .select('volunteer_id')
      .eq('event_id', eventId);
      
    if (assignments && assignments.length > 0) {
      const volunteerIds = assignments.map(a => a.volunteer_id);
      query = query.in('id', volunteerIds);
    } else {
      // No volunteers assigned to this event
      return [];
    }
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching volunteers:', error);
    throw new Error(`Failed to fetch volunteers: ${error.message}`);
  }
  
  return data.map(item => {
    const profile = {
      id: item.id,
      name: item.name,
      email: item.email,
      role: item.role,
      created_at: item.created_at
    } as Profile;
    
    const volunteerProfile = item.volunteer_profiles as unknown as VolunteerProfile;
    
    return {
      ...volunteerProfile,
      profile
    } as VolunteerWithProfile;
  });
}

/**
 * Get volunteer roles for an event
 */
export async function getVolunteerRoles(eventId: string): Promise<VolunteerRole[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('volunteer_roles')
    .select(`
      *,
      volunteer_assignments(volunteer_id)
    `)
    .eq('event_id', eventId);
    
  if (error) {
    console.error('Error fetching volunteer roles:', error);
    throw new Error(`Failed to fetch volunteer roles: ${error.message}`);
  }
  
  return data.map(role => ({
    ...role,
    assigned_volunteers_count: role.volunteer_assignments ? role.volunteer_assignments.length : 0
  }));
}

/**
 * Get assigned volunteers for a role
 */
export async function getVolunteersForRole(roleId: string): Promise<VolunteerWithProfile[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select(`
      volunteer_id,
      profiles!volunteer_id(
        id,
        name,
        email,
        role,
        created_at
      ),
      volunteer_profiles!volunteer_id(*)
    `)
    .eq('role_id', roleId);
    
  if (error) {
    console.error('Error fetching volunteers for role:', error);
    throw new Error(`Failed to fetch volunteers for role: ${error.message}`);
  }
  
  return data.map(item => {
    const profile = item.profiles as unknown as Profile;
    const volunteerProfile = item.volunteer_profiles as unknown as VolunteerProfile;
    
    return {
      ...volunteerProfile,
      profile
    } as VolunteerWithProfile;
  });
}

/**
 * Get volunteer assignments for an event
 */
export async function getVolunteerAssignments(eventId: string): Promise<VolunteerAssignment[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .select(`
      *,
      profiles!volunteer_id(
        id,
        name,
        email,
        role,
        created_at
      ),
      volunteer_profiles!volunteer_id(*),
      volunteer_roles!role_id(*)
    `)
    .eq('event_id', eventId);
    
  if (error) {
    console.error('Error fetching volunteer assignments:', error);
    throw new Error(`Failed to fetch volunteer assignments: ${error.message}`);
  }
  
  return data.map(item => {
    const profile = item.profiles as unknown as Profile;
    const volunteerProfile = item.volunteer_profiles as unknown as VolunteerProfile;
    const role = item.volunteer_roles as unknown as VolunteerRole;
    
    return {
      ...item,
      volunteer: {
        ...volunteerProfile,
        profile
      } as VolunteerWithProfile,
      role
    } as VolunteerAssignment;
  });
}

/**
 * Create a new volunteer role
 */
export async function createVolunteerRole(roleData: Omit<VolunteerRole, 'id' | 'created_at' | 'updated_at'>): Promise<VolunteerRole> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('volunteer_roles')
    .insert({
      id: uuidv4(),
      name: roleData.name,
      description: roleData.description || null,
      event_id: roleData.event_id,
      required_volunteers: roleData.required_volunteers,
      location: roleData.location || null,
      start_time: roleData.start_time || null,
      end_time: roleData.end_time || null,
      is_active: true
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating volunteer role:', error);
    throw new Error(`Failed to create volunteer role: ${error.message}`);
  }
  
  // Revalidate the event page to reflect changes
  revalidatePath(`/events/${roleData.event_id}`);
  revalidatePath(`/events/${roleData.event_id}/volunteers`);
  
  return data;
}

/**
 * Update a volunteer role
 */
export async function updateVolunteerRole(id: string, roleData: Partial<VolunteerRole>): Promise<VolunteerRole> {
  const supabase = createServerSupabaseClient();
  
  // Get the current role to revalidate the right paths
  const { data: currentRole } = await supabase
    .from('volunteer_roles')
    .select('event_id')
    .eq('id', id)
    .single();
    
  if (!currentRole) {
    throw new Error('Volunteer role not found');
  }
  
  const { data, error } = await supabase
    .from('volunteer_roles')
    .update({
      name: roleData.name,
      description: roleData.description,
      required_volunteers: roleData.required_volunteers,
      location: roleData.location,
      start_time: roleData.start_time,
      end_time: roleData.end_time,
      is_active: roleData.is_active,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating volunteer role:', error);
    throw new Error(`Failed to update volunteer role: ${error.message}`);
  }
  
  // Revalidate the event page to reflect changes
  revalidatePath(`/events/${currentRole.event_id}`);
  revalidatePath(`/events/${currentRole.event_id}/volunteers`);
  
  return data;
}

/**
 * Delete a volunteer role
 */
export async function deleteVolunteerRole(id: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  
  // Get the current role to revalidate the right paths
  const { data: currentRole } = await supabase
    .from('volunteer_roles')
    .select('event_id')
    .eq('id', id)
    .single();
    
  if (!currentRole) {
    throw new Error('Volunteer role not found');
  }
  
  const { error } = await supabase
    .from('volunteer_roles')
    .delete()
    .eq('id', id);
    
  if (error) {
    console.error('Error deleting volunteer role:', error);
    throw new Error(`Failed to delete volunteer role: ${error.message}`);
  }
  
  // Revalidate the event page to reflect changes
  revalidatePath(`/events/${currentRole.event_id}`);
  revalidatePath(`/events/${currentRole.event_id}/volunteers`);
}

/**
 * Assign a volunteer to a role
 */
export async function assignVolunteer(
  volunteerProfileId: string, 
  roleId: string, 
  eventId: string
): Promise<VolunteerAssignment> {
  const supabase = createServerSupabaseClient();
  
  // Check if this volunteer is already assigned to this role
  const { data: existingAssignment } = await supabase
    .from('volunteer_assignments')
    .select('id')
    .eq('volunteer_id', volunteerProfileId)
    .eq('role_id', roleId)
    .eq('event_id', eventId)
    .maybeSingle();
    
  if (existingAssignment) {
    throw new Error('Volunteer is already assigned to this role');
  }
  
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .insert({
      id: uuidv4(),
      volunteer_id: volunteerProfileId,
      role_id: roleId,
      event_id: eventId,
      status: 'assigned'
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error assigning volunteer:', error);
    throw new Error(`Failed to assign volunteer: ${error.message}`);
  }
  
  // Revalidate paths
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/events/${eventId}/volunteers`);
  
  return data;
}

/**
 * Remove a volunteer assignment
 */
export async function removeVolunteerAssignment(assignmentId: string): Promise<void> {
  const supabase = createServerSupabaseClient();
  
  // Get the current assignment to revalidate the right paths
  const { data: currentAssignment } = await supabase
    .from('volunteer_assignments')
    .select('event_id')
    .eq('id', assignmentId)
    .single();
    
  if (!currentAssignment) {
    throw new Error('Volunteer assignment not found');
  }
  
  const { error } = await supabase
    .from('volunteer_assignments')
    .delete()
    .eq('id', assignmentId);
    
  if (error) {
    console.error('Error removing volunteer assignment:', error);
    throw new Error(`Failed to remove volunteer assignment: ${error.message}`);
  }
  
  // Revalidate paths
  revalidatePath(`/events/${currentAssignment.event_id}`);
  revalidatePath(`/events/${currentAssignment.event_id}/volunteers`);
}

/**
 * Update volunteer assignment status (check-in, check-out)
 */
export async function updateVolunteerAssignmentStatus(
  assignmentId: string,
  status: string,
  checkInTime?: Date,
  checkOutTime?: Date
): Promise<VolunteerAssignment> {
  const supabase = createServerSupabaseClient();
  
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  };
  
  if (checkInTime) {
    updateData.check_in_time = checkInTime.toISOString();
  }
  
  if (checkOutTime) {
    updateData.check_out_time = checkOutTime.toISOString();
  }
  
  // Get the current assignment to revalidate the right paths
  const { data: currentAssignment } = await supabase
    .from('volunteer_assignments')
    .select('event_id')
    .eq('id', assignmentId)
    .single();
    
  if (!currentAssignment) {
    throw new Error('Volunteer assignment not found');
  }
  
  const { data, error } = await supabase
    .from('volunteer_assignments')
    .update(updateData)
    .eq('id', assignmentId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating volunteer assignment:', error);
    throw new Error(`Failed to update volunteer assignment: ${error.message}`);
  }
  
  // Revalidate paths
  revalidatePath(`/events/${currentAssignment.event_id}`);
  revalidatePath(`/events/${currentAssignment.event_id}/volunteers`);
  
  return data;
}

/**
 * Get volunteer dashboard statistics
 */
export async function getVolunteerDashboardStats(eventId: string): Promise<VolunteerDashboardStats> {
  const supabase = createServerSupabaseClient();
  
  // Get total volunteer count for this event
  const { count: totalVolunteers } = await supabase
    .from('volunteer_assignments')
    .select('volunteer_id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'confirmed');
    
  // Get role count for this event
  const { count: totalRoles } = await supabase
    .from('volunteer_roles')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId);
    
  // Get active role count
  const { count: activeRoles } = await supabase
    .from('volunteer_roles')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('is_active', true);
    
  // Get checked-in volunteer count
  const { count: checkedInVolunteers } = await supabase
    .from('volunteer_assignments')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .not('check_in_time', 'is', null);
    
  // Get distributed kit count
  const { data: kits } = await supabase
    .from('race_kits')
    .select('distributed_quantity')
    .eq('event_id', eventId);
    
  const kitsDistributed = kits ? kits.reduce((total, kit) => total + (kit.distributed_quantity || 0), 0) : 0;
  
  // Count how many roles have enough volunteers
  const { data: roles } = await supabase
    .from('volunteer_roles')
    .select(`
      id, 
      required_volunteers,
      volunteer_assignments!role_id(volunteer_id)
    `)
    .eq('event_id', eventId)
    .eq('is_active', true);
    
  const filledRoles = roles ? roles.filter(role => 
    role.volunteer_assignments && role.volunteer_assignments.length >= role.required_volunteers
  ).length : 0;
  
  // Get training completion count - using a simpler approach for now
  const { count: totalTrainingCompletions } = await supabase
    .from('volunteer_training_completion')
    .select('training_id', { count: 'exact', head: true });
  
  return {
    total_volunteers: totalVolunteers || 0,
    total_roles: totalRoles || 0,
    active_roles: activeRoles || 0,
    filled_roles: filledRoles,
    checked_in_volunteers: checkedInVolunteers || 0,
    total_training_completions: totalTrainingCompletions || 0,
    kits_distributed: kitsDistributed
  };
} 