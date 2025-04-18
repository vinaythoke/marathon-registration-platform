import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runMigration } from '@/lib/migrations/create_ticket_verifications_table';

export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is an admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Run the migration
    await runMigration();
    
    return NextResponse.json(
      { success: true, message: 'Migration completed successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in ticket verifications migration:', error);
    
    return NextResponse.json(
      { error: 'Migration failed', details: error.message },
      { status: 500 }
    );
  }
} 