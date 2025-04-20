import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { Database } from '@/types/supabase';

export async function GET() {
  const cookieStore = cookies();
  
  const supabase = createServerClient<Database>(
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

  try {
    // Get table information
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(0);

    if (tableError) {
      return NextResponse.json({
        error: 'Error checking users table',
        details: tableError
      }, { status: 500 });
    }

    // Get RLS policies
    const { data: policies, error: policyError } = await supabase
      .rpc('get_policies')
      .select('*');

    // Get all users (including empty result)
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*');

    return NextResponse.json({
      table: {
        exists: true,
        columns: tableInfo ? Object.keys(tableInfo.columns || {}) : [],
      },
      policies: policies || [],
      policyError,
      users: users || [],
      usersError
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Unexpected error checking schema',
      details: error
    }, { status: 500 });
  }
} 