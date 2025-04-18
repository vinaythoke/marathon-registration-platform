'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/database.types';
import { revalidatePath } from 'next/cache';

type RunnerProfile = Database['public']['Tables']['runner_profiles']['Row'];
type RunnerProfileInsert = Partial<Omit<Database['public']['Tables']['runner_profiles']['Row'], 'created_at' | 'updated_at'>>;
type RunnerProfileUpdate = Database['public']['Tables']['runner_profiles']['Update'];

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
 * Get the current user's runner profile
 */
export async function getRunnerProfile(): Promise<RunnerProfile | null> {
  // Check if using local development environment
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  if (isLocalDb) {
    // Return a mock profile for local development
    return {
      id: 'mock-user-id',
      address: '123 Main St',
      city: 'Test City',
      state: 'Test State',
      postal_code: '12345',
      country: 'Test Country',
      phone: '+1-555-123-4567',
      date_of_birth: new Date('1990-01-01').toISOString(),
      gender: 'prefer_not_to_say',
      medical_conditions: null,
      allergies: null,
      medications: null,
      blood_type: 'unknown',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_phone: '+1-555-987-6543',
      emergency_contact_relationship: 'Family',
      experience_level: 'intermediate',
      years_running: 5,
      previous_marathons: 2,
      average_pace: '5:30',
      preferred_distance: ['5k', '10k', 'half-marathon'],
      running_goals: 'Complete a full marathon',
      t_shirt_size: 'L',
      profile_image_url: null,
      bio: 'Test runner bio',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as RunnerProfile;
  }

  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
    // Return null to satisfy TypeScript - this code is unreachable after redirect
    return null;
  }
  
  // Check if the user is a runner
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (userError || userData?.role !== 'runner') {
    return null;
  }
    
  // Get the runner profile
  const { data, error } = await supabase
    .from('runner_profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
    
  if (error) {
    // If the profile doesn't exist, return null
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Error fetching runner profile: ${error.message}`);
  }
  
  return data;
}

/**
 * Create a runner profile for the current user
 */
export async function createRunnerProfile(
  data: Partial<RunnerProfile>
): Promise<RunnerProfile> {
  // Check if using local development environment
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  if (isLocalDb) {
    // Return the mock profile with the updated data for local development
    return {
      id: 'mock-user-id',
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as RunnerProfile;
  }

  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
    // This code is unreachable after redirect, but we need to return something for TypeScript
    throw new Error('No session found');
  }
  
  // Check if the user is a runner
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single();
    
  if (userError || userData?.role !== 'runner') {
    throw new Error('User is not a runner');
  }
  
  // Create the runner profile
  const { data: profileData, error } = await supabase
    .from('runner_profiles')
    .insert([
      {
        id: session.user.id,
        ...data,
      },
    ])
    .select('*')
    .single();
    
  if (error) {
    throw new Error(`Error creating runner profile: ${error.message}`);
  }
  
  // Revalidate the profile page
  revalidatePath('/dashboard/profile');
  
  return profileData;
}

/**
 * Update the current user's runner profile
 */
export async function updateRunnerProfile(profileData: RunnerProfileUpdate) {
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  if (isLocalDb) {
    // Return the mock profile with the updated data for local development
    return {
      id: 'mock-user-id',
      ...profileData,
      updated_at: new Date().toISOString(),
    } as RunnerProfile;
  }

  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Update the profile
  const { data, error } = await supabase
    .from('runner_profiles')
    .update(profileData)
    .eq('id', session.user.id)
    .select()
    .single();
    
  if (error) {
    throw new Error(`Error updating runner profile: ${error.message}`);
  }
  
  // Revalidate the profile page
  revalidatePath('/dashboard/profile');
  
  return data;
}

/**
 * Upload a profile image to Supabase storage
 */
export async function uploadProfileImage(file: File): Promise<string> {
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  if (isLocalDb) {
    // Return a mock URL for local development
    return 'https://via.placeholder.com/150';
  }

  const supabase = createServerSupabaseClient();
  
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/auth');
  }
  
  // Generate a unique file name
  const fileExt = file.name.split('.').pop();
  const fileName = `${session.user.id}-${Date.now()}.${fileExt}`;
  
  // Upload the file
  const { data, error } = await supabase
    .storage
    .from('profile-images')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    });
    
  if (error) {
    throw new Error(`Error uploading profile image: ${error.message}`);
  }
  
  // Get the public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from('profile-images')
    .getPublicUrl(data.path);
    
  return publicUrl;
} 