import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getClient } from '@/lib/db-client'

export default async function DashboardPage() {
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  if (isLocalDb) {
    // Read user role from environment variable in local development mode
    const role = process.env.DEV_USER_ROLE || cookies().get('preferred_role')?.value || 'runner';
    redirect(`/dashboard/${role}`);
  } else {
    // Use Supabase for production
    const supabase = getClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      redirect('/auth');
    }

    // Get user profile with role
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('auth_id', session.user.id)
      .single();
      
    const userRole = profile?.role || 'runner';

    // Redirect to appropriate dashboard based on role
    if (userRole === 'organizer') {
      redirect('/dashboard/organizer');
    } else if (userRole === 'runner') {
      redirect('/dashboard/runner');
    } else if (userRole === 'volunteer') {
      redirect('/dashboard/volunteer');
    } else {
      // Fallback to general dashboard if role is unknown
      redirect('/dashboard/runner');
    }
  }

  // This should never be reached due to redirects
  return null;
} 