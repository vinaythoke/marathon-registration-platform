import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { unstable_cache } from 'next/cache'
import { type Database } from '@/types/supabase'

// Function to retrieve user role by ID
async function fetchUserRole(userId: string, supabase: any) {
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('auth_id', userId)
    .single()
  return profile?.role || 'runner'
}

// Create a custom caching wrapper that includes userId in the cache key
function createRoleCache(userId: string) {
  return unstable_cache(
    async (supabaseClient: any) => {
      return fetchUserRole(userId, supabaseClient)
    },
    [`user-role-${userId}`], // Unique cache key per user
    { revalidate: 60 } // Cache for 60 seconds
  )
}

export default async function DashboardPage({ searchParams }: { searchParams: { role?: string } }) {
  // Get role from query parameter if present
  // In Next.js 15, searchParams should be awaited before accessing its properties
  const params = await searchParams;
  const roleFromQuery = params.role;
  
  // Check if a valid role is specified in the query
  const isValidRole = (role: string) => ['organizer', 'runner', 'volunteer'].includes(role);
  
  // If a valid role is specified in the query, redirect directly to that role's dashboard
  if (roleFromQuery && isValidRole(roleFromQuery)) {
    redirect(`/dashboard/${roleFromQuery}`);
  }
  
  // Check if we're using local DB
  const isLocalDb = process.env.IS_LOCAL_DB === 'true';
  
  if (isLocalDb) {
    // Read user role from environment variable in local development mode
    const role = process.env.DEV_USER_ROLE || cookies().get('preferred_role')?.value || 'runner';
    redirect(`/dashboard/${role}`);
  } else {
    // Create Supabase client outside the cached function
    const supabase = await createClient();
    
    // Use getUser() instead of getSession() for better security
    // This contacts the Supabase server to verify the token
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      redirect('/auth');
    }

    // Create a cache function specifically for this user ID
    const getUserRoleCached = createRoleCache(user.id);
    
    // Call the cached function with the supabase client
    const userRole = await getUserRoleCached(supabase);

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