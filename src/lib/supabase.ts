'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '../types/supabase';

// DEPRECATED: This singleton approach is deprecated. 
// Please use the createClient() function from @/lib/supabase/client instead.
// This file is kept for backward compatibility but may be removed in future versions.
console.warn(
  'Using the singleton supabase client is deprecated. ' +
  'Please import createClient from @/lib/supabase/client instead.'
);

// Ensure environment variables are available
if (typeof window !== 'undefined') {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error('Missing environment variable NEXT_PUBLIC_SUPABASE_URL');
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

// Create a singleton browser client
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Re-export types for convenience
export type { Database } from '../types/supabase';

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T];

export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']; 