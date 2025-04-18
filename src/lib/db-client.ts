import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Check if we're using local DB or Supabase
const isLocalDb = process.env.IS_LOCAL_DB === 'true';

// Set up DB connection parameters
const url = isLocalDb 
  ? process.env.LOCAL_POSTGRES_URL || 'http://localhost:54321'
  : process.env.NEXT_PUBLIC_SUPABASE_URL || '';

const key = isLocalDb
  ? process.env.LOCAL_POSTGRES_ANON_KEY || 'local-dev-key'
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!url) {
  throw new Error('Missing database URL environment variable');
}

if (!key) {
  throw new Error('Missing database API key environment variable');
}

let supabaseClient: SupabaseClient<Database>;

// Get or create Supabase client
export function getClient(): SupabaseClient<Database> {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createClient<Database>(url, key, {
    db: {
      schema: 'public',
    },
    auth: {
      autoRefreshToken: !isLocalDb,
      persistSession: !isLocalDb,
    },
  });

  return supabaseClient;
}

// Get current user (custom implementation for local development)
export async function getCurrentUser() {
  const client = getClient();
  
  if (isLocalDb) {
    // For local development, return a mocked user
    return {
      id: process.env.DEV_USER_ID || 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      email: process.env.DEV_USER_EMAIL || 'test@example.com',
      role: process.env.DEV_USER_ROLE || 'runner'
    };
  }
  
  // For Supabase, use the actual auth system
  const { data: { user } } = await client.auth.getUser();
  if (!user) return null;
  
  // Get the user's profile from the database
  const { data, error } = await client
    .from('users')
    .select('*')
    .eq('auth_id', user.id)
    .single();
    
  if (error || !data) return null;
  
  return data;
}

// Simple function to test the database connection
export async function testDatabaseConnection() {
  try {
    const client = getClient();
    const { data, error } = await client
      .from('users')
      .select('count')
      .limit(1)
      .single();

    if (error) {
      return {
        success: false,
        message: error.message,
        isLocalDb
      };
    }

    return {
      success: true,
      message: `Successfully connected to ${isLocalDb ? 'local PostgreSQL' : 'Supabase'}`,
      isLocalDb
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error',
      isLocalDb
    };
  }
} 