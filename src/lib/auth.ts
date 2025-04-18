import { supabase } from './supabase';

interface SignInCredentials {
  email: string;
  password: string;
}

interface SignUpData extends SignInCredentials {
  firstName: string;
  lastName: string;
}

interface AuthResponse {
  success: boolean;
  user?: any;
  error?: string;
  data?: any;
}

export async function signIn(credentials: SignInCredentials): Promise<AuthResponse> {
  try {
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
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.firstName,
          last_name: userData.lastName
        }
      }
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
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
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google'
    });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

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