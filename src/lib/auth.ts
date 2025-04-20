'use client';

import { createClient } from './supabase/client';
import { createUserRecord } from './utils/user-utils';

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpData extends SignInCredentials {
  firstName: string;
  lastName: string;
  role: 'runner' | 'organizer' | 'volunteer';
}

interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
  data?: any;
}

export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password,
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Check if user record exists, if not create it
    try {
      await createUserRecord(supabase, data.user, { email: credentials.email });
    } catch (err: any) {
      console.error('Error creating user record during sign in:', err);
    }

    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

export async function signUp(userData: SignUpData): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName,
          role: userData.role
        }
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    if (data.user) {
      try {
        await createUserRecord(supabase, data.user, userData);
      } catch (err: any) {
        return {
          success: false,
          error: err.message
        };
      }
    }

    return {
      success: true,
      user: data.user
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

export async function googleSignIn(): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Note: For Google sign-in, the user record will be created in the callback
    // because we don't have access to the user data yet at this point

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

export async function signOut(): Promise<AuthResponse> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
} 