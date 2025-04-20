import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

interface UserData {
  email: string;
  firstName?: string;
  lastName?: string;
  role?: 'runner' | 'organizer' | 'volunteer';
}

export async function createUserRecord(
  supabase: SupabaseClient<Database>,
  authUser: any,
  userData?: UserData
) {
  console.log('Creating user record for:', { authUser, userData });
  
  try {
    // First check by auth_id
    const { data: existingUserByAuthId, error: authIdError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .maybeSingle();

    if (authIdError && authIdError.code !== 'PGRST116') {
      console.error('Error checking by auth_id:', authIdError);
      throw authIdError;
    }

    if (existingUserByAuthId) {
      console.log('User record exists by auth_id:', existingUserByAuthId);
      return existingUserByAuthId;
    }

    // Then check by email
    const email = userData?.email || authUser.email;
    console.log('Checking for existing user by email:', email);
    
    const { data: existingUserByEmail, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error checking by email:', emailError);
      throw emailError;
    }

    if (existingUserByEmail) {
      console.log('Found existing user by email:', existingUserByEmail);
      
      // Update the auth_id if it doesn't match
      if (existingUserByEmail.auth_id !== authUser.id) {
        console.log('Updating auth_id for existing user');
        
        // First update
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            auth_id: authUser.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingUserByEmail.id);

        if (updateError) {
          console.error('Error updating auth_id:', updateError);
          throw updateError;
        }

        // Then fetch the updated record
        const { data: updatedUser, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', existingUserByEmail.id)
          .maybeSingle();

        if (fetchError) {
          console.error('Error fetching updated user:', fetchError);
          throw fetchError;
        }

        if (!updatedUser) {
          throw new Error('Failed to fetch updated user record');
        }

        console.log('Successfully updated auth_id:', updatedUser);
        return updatedUser;
      }

      return existingUserByEmail;
    }

    // If no existing user found, create new one
    const firstName = 
      userData?.firstName || 
      authUser.user_metadata?.full_name?.split(' ')[0] || 
      'User';
    
    const lastName = 
      userData?.lastName || 
      authUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || 
      '';
    
    const role = userData?.role || 'runner';

    const newUser = {
      auth_id: authUser.id,
      email,
      first_name: firstName,
      last_name: lastName,
      role
    };

    console.log('Creating new user record:', newUser);
    
    const { data: createdUser, error: createError } = await supabase
      .from('users')
      .insert([newUser])
      .select()
      .maybeSingle();

    if (createError) {
      console.error('Error creating user record:', createError);
      throw createError;
    }
    
    console.log('Successfully created user record:', createdUser);
    return createdUser;
  } catch (error) {
    console.error('Error in createUserRecord:', error);
    throw error;
  }
} 