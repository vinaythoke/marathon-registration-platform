import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { createUserRecord } from '@/lib/utils/user-utils';

interface UserProfile {
  id: string;
  auth_id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'runner' | 'organizer' | 'volunteer';
  created_at: string;
  updated_at: string;
}

const supabase = createClient();

export function useAuth() {
  const [user, setUser] = useState<string | undefined>(undefined);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  async function fetchProfile(userId: string) {
    console.log('🔍 fetchProfile called for userId:', userId);
    try {
      console.log('📡 Querying users table...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', userId)
        .single();

      if (error) {
        console.error('❌ Error querying users table:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });

        // If no record found, try to create one
        if (error.code === 'PGRST116') {
          console.log('🔄 No user record found, attempting to create one...');
          const session = await supabase.auth.getSession();
          if (session.data.session?.user) {
            const newProfile = await createUserRecord(
              supabase,
              session.data.session.user,
              { email: session.data.session.user.email || '' }
            );
            console.log('✅ Created new user record:', newProfile);
            setProfile(newProfile);
            setError(null);
            return newProfile;
          }
        }

        setError(error.message);
        setProfile(null);
        return null;
      }

      console.log('✅ Query successful, data:', data);
      setProfile(data);
      setError(null);
      return data;
    } catch (error: any) {
      console.error('❌ Unexpected error in fetchProfile:', error);
      setError(error?.message || 'Failed to fetch profile');
      setProfile(null);
      return null;
    }
  }

  useEffect(() => {
    console.log('🔄 Auth hook initialized, loading:', loading);
    let mounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      console.log('👤 Initial auth state:', {
        user: session?.user?.id,
        error
      });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setUser(session?.user?.id);
      
      if (session?.user?.id) {
        console.log('🔄 Fetching initial profile for user:', session.user.id);
        fetchProfile(session.user.id).finally(() => {
          if (mounted) {
            setLoading(false);
            setIsInitialized(true);
          }
        });
      } else {
        setLoading(false);
        setIsInitialized(true);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      console.log('🔄 Auth state changed:', {
        event,
        userId: session?.user?.id
      });

      if (!isInitialized) {
        console.log('⚠️ Skipping auth state change:', { mounted, isInitialized });
        return;
      }

      setUser(session?.user?.id);
      
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      console.log('🧹 Auth hook cleanup');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isInitialized]);

  const signOut = async () => {
    console.log('🚪 Signing out...');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Sign out error:', error);
        setError(error.message);
        return;
      }
      console.log('✅ Sign out successful');
      setUser(undefined);
      setProfile(null);
      setError(null);
      window.location.href = '/';
    } catch (err: any) {
      console.error('❌ Error in signOut:', err);
      setError(err?.message || 'Failed to sign out');
    }
  };

  return {
    user,
    profile,
    error,
    loading,
    isInitialized,
    signOut,
    isOrganizer: profile?.role === 'organizer',
    refreshProfile: () => user ? fetchProfile(user) : null,
  };
} 