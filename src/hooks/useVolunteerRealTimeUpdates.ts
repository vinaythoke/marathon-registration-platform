'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { VolunteerAssignment } from '@/types/volunteer';

export function useVolunteerRealTimeUpdates(
  eventId: string,
  onUpdate?: (assignments: VolunteerAssignment[]) => void
) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const channel = supabase
      .channel(`volunteer-assignments-${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'volunteer_assignments',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          console.log('Received real-time update:', payload);
          
          // Fetch the updated assignments
          try {
            const { data, error } = await supabase
              .from('volunteer_assignments')
              .select(`
                *,
                profiles!volunteer_id(
                  id,
                  name,
                  email,
                  role,
                  created_at
                ),
                volunteer_profiles!volunteer_id(*),
                volunteer_roles!role_id(*)
              `)
              .eq('event_id', eventId);
              
            if (error) {
              console.error('Error fetching updated assignments:', error);
              setError('Failed to fetch updated assignments');
              return;
            }
            
            // Transform the data to VolunteerAssignment[]
            const assignments = data.map((item) => {
              const profile = item.profiles;
              const volunteerProfile = item.volunteer_profiles;
              const role = item.volunteer_roles;
              
              return {
                ...item,
                volunteer: {
                  ...volunteerProfile,
                  profile
                },
                role
              } as VolunteerAssignment;
            });
            
            // Call the onUpdate callback
            if (onUpdate) {
              onUpdate(assignments);
            }
          } catch (err: any) {
            console.error('Error handling real-time update:', err);
            setError(err.message || 'Failed to process real-time update');
          }
        }
      )
      .subscribe();

    setIsSubscribed(true);

    // Cleanup function
    return () => {
      channel.unsubscribe();
      setIsSubscribed(false);
    };
  }, [eventId, onUpdate]);

  return { isSubscribed, error };
} 