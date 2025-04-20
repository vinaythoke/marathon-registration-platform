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
    // Get all users from public.users
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('*');

    if (allUsersError) {
      console.error('Error fetching all users:', allUsersError);
      return NextResponse.json({ error: 'Error fetching users', details: allUsersError }, { status: 500 });
    }

    // Find specific user by email
    const { data: emailUser, error: emailError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'organizer1@example.com')
      .single();

    if (emailError && emailError.code !== 'PGRST116') {
      console.error('Error fetching user by email:', emailError);
    }

    // Find user by auth_id
    const { data: authIdUser, error: authIdError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', '5b2ff97b-18eb-43b2-8985-25bfb216a474')
      .single();

    if (authIdError && authIdError.code !== 'PGRST116') {
      console.error('Error fetching user by auth_id:', authIdError);
    }

    return NextResponse.json({
      allUsers: allUsers || [],
      totalUsers: allUsers?.length || 0,
      emailUser: emailUser || null,
      emailError: emailError?.code !== 'PGRST116' ? emailError : null,
      authIdUser: authIdUser || null,
      authIdError: authIdError?.code !== 'PGRST116' ? authIdError : null
    });
  } catch (error) {
    console.error('Unexpected error in debug endpoint:', error);
    return NextResponse.json({ error: 'Unexpected error', details: error }, { status: 500 });
  }
} 