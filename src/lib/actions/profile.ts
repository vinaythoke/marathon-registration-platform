'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Database } from '@/database.types';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { withCsrf } from '@/lib/csrf';

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
 * Get the current user's runner profile
 */
export async function getRunnerProfile(): Promise<RunnerProfile | null> {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.log('No session found in getRunnerProfile');
      return null;
    }
    
    // Get user data first to get the internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError) {
      console.log('Error fetching user data:', userError);
      return null;
    }
    
    if (!userData) {
      console.log('No user data found for auth_id:', session.user.id);
      return null;
    }

    console.log('Found user data:', userData);
    
    // Get profile from database using the internal ID
    const { data: profileData, error: profileError } = await supabase
      .from('runner_profiles')
      .select('*')
      .eq('user_id', userData.id)
      .single();
    
    if (profileError) {
      console.log('Error fetching runner profile:', profileError);
      return null;
    }

    console.log('Runner profile data:', profileData);
    return profileData;
  } catch (error) {
    console.error('Error in getRunnerProfile:', error);
    return null;
  }
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
  
  // Get user data first to get the internal ID and check role
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, role')
    .eq('auth_id', session.user.id)
    .single();
    
  if (userError || !userData || userData.role !== 'runner') {
    throw new Error('User is not a runner');
  }
  
  // Create the runner profile using the internal ID
  const { data: profileData, error } = await supabase
    .from('runner_profiles')
    .insert([
      {
        id: userData.id,
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
 * Protected by CSRF token validation
 */
export const updateRunnerProfile = withCsrf(async function updateRunnerProfileImpl(formData: FormData) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return {
        success: false,
        error: 'Authentication required'
      };
    }
    
    // Get user data first to get the internal ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userError || !userData) {
      return {
        success: false,
        error: 'User not found'
      };
    }
    
    // Extract profile data from form
    const profileData = {
      first_name: formData.get('first_name') as string,
      last_name: formData.get('last_name') as string,
      date_of_birth: formData.get('date_of_birth') as string,
      gender: formData.get('gender') as string,
      phone: formData.get('phone') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postal_code: formData.get('postal_code') as string,
      country: formData.get('country') as string,
      emergency_contact_name: formData.get('emergency_contact_name') as string,
      emergency_contact_phone: formData.get('emergency_contact_phone') as string,
      emergency_contact_relationship: formData.get('emergency_contact_relationship') as string,
      medical_conditions: formData.get('medical_conditions') as string,
      updated_at: new Date().toISOString()
    };
    
    // Validate required fields
    if (!profileData.first_name || !profileData.last_name) {
      return {
        success: false,
        error: 'Name is required'
      };
    }
    
    // Update profile in database using the internal ID
    const { error } = await supabase
      .from('runner_profiles')
      .upsert({
        id: userData.id,
        ...profileData
      }, {
        onConflict: 'id'
      });
    
    if (error) {
      throw error;
    }
    
    // Revalidate the profile page
    revalidatePath('/dashboard/profile');
    
    return {
      success: true,
      message: 'Profile updated successfully'
    };
  } catch (error) {
    console.error('Error updating profile:', error);
    return {
      success: false,
      error: 'An error occurred while updating your profile'
    };
  }
});

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