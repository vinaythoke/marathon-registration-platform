'use client';

import { createClient } from './supabase/client';

export async function testSupabaseConnection() {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
      .single();

    if (error) {
      return {
        success: false,
        message: error.message
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to connect to Supabase'
    };
  }
} 