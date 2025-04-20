'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { RaceKit, KitDistribution } from '@/types/volunteer';

export function useKitRealTimeUpdates(
  eventId: string,
  onKitUpdate?: (kits: RaceKit[]) => void,
  onDistributionUpdate?: (distributions: KitDistribution[]) => void
) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    // Create a single channel for both tables
    const channel = supabase
      .channel(`kit-updates-${eventId}`)
      
      // Listen for race_kits changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'race_kits',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          console.log('Received kit update:', payload);
          
          if (onKitUpdate) {
            try {
              const { data, error } = await supabase
                .from('race_kits')
                .select('*')
                .eq('event_id', eventId);
                
              if (error) {
                console.error('Error fetching updated kits:', error);
                setError('Failed to fetch updated kits');
                return;
              }
              
              // Calculate available quantity
              const kits = data.map(kit => ({
                ...kit,
                available_quantity: kit.total_quantity - kit.distributed_quantity
              }));
              
              onKitUpdate(kits);
            } catch (err: any) {
              console.error('Error handling kit update:', err);
              setError(err.message || 'Failed to process kit update');
            }
          }
        }
      )
      
      // Listen for kit_distribution changes
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'kit_distribution',
        },
        async (payload) => {
          console.log('Received distribution update:', payload);
          
          if (onDistributionUpdate) {
            try {
              const { data, error } = await supabase
                .from('kit_distribution')
                .select(`
                  *,
                  race_kits!kit_id(*),
                  profiles!distributed_by(id, name)
                `)
                .order('distributed_at', { ascending: false });
                
              if (error) {
                console.error('Error fetching updated distributions:', error);
                setError('Failed to fetch updated distributions');
                return;
              }
              
              const distributions = data.map(item => ({
                ...item,
                kit: item.race_kits,
                distributor: item.profiles
              } as unknown as KitDistribution));
              
              onDistributionUpdate(distributions);
            } catch (err: any) {
              console.error('Error handling distribution update:', err);
              setError(err.message || 'Failed to process distribution update');
            }
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
  }, [eventId, onKitUpdate, onDistributionUpdate]);

  return { isSubscribed, error };
} 