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
    // Try to get users table info
    const { data: tableInfo, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    // Try an unauthenticated read
    const anonSupabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: () => null,
          set: () => {},
          remove: () => {},
        },
      }
    );

    const { data: anonData, error: anonError } = await anonSupabase
      .from('users')
      .select('*')
      .limit(1);

    return NextResponse.json({
      tableAccess: {
        authenticated: {
          success: !tableError,
          error: tableError
        },
        anonymous: {
          success: !anonError,
          error: anonError
        }
      },
      tableInfo: tableInfo ? {
        columns: Object.keys(tableInfo[0] || {})
      } : null
    });
  } catch (error) {
    console.error('Error checking policies:', error);
    return NextResponse.json({ error: 'Error checking policies', details: error }, { status: 500 });
  }
} 