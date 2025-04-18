"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { registerBackgroundSync, syncWithServer, forceSyncNow, SyncStrategy } from '@/lib/offline/sync-service';
import { initDatabase, getAll } from '@/lib/offline/db';
import { useToast } from '@/components/ui/use-toast';

// Define the context shape
interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  hasConflicts: boolean;
  conflictStores: string[];
  syncNow: () => Promise<void>;
  lastSyncTime: Date | null;
}

// Create the context with a default value
const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
  syncStores?: string[];
}

// Provider component
export function OfflineProvider({ 
  children, 
  syncStores = ['notes']
}: OfflineProviderProps) {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [hasConflicts, setHasConflicts] = useState<boolean>(false);
  const [conflictStores, setConflictStores] = useState<string[]>([]);
  const { toast } = useToast();

  // Check for conflicts in any of the sync stores
  const checkForConflicts = async () => {
    try {
      const storesWithConflicts = [];
      
      for (const store of syncStores) {
        const conflicts = await getAll(`${store}_conflicts`);
        if (conflicts.length > 0) {
          storesWithConflicts.push(store);
        }
      }
      
      setConflictStores(storesWithConflicts);
      setHasConflicts(storesWithConflicts.length > 0);
    } catch (error) {
      console.error('Error checking for conflicts:', error);
    }
  };

  // Function to manually trigger a sync
  const syncNow = async () => {
    if (isSyncing) return;
    
    try {
      setIsSyncing(true);
      
      // Use the existing forceSyncNow function instead of SyncManager
      await forceSyncNow();
      
      setLastSyncTime(new Date());
      await checkForConflicts();
      
      toast({
        title: "Sync completed",
        description: "Your data has been synchronized with the server.",
      });
    } catch (error) {
      console.error('Sync error:', error);
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: "There was an error synchronizing your data.",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Set up online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back online",
        description: "Your connection has been restored. Syncing data...",
      });
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        variant: "destructive",
        title: "You're offline",
        description: "Changes will be saved locally and synced when you reconnect.",
      });
    };

    // Check initial online status
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial conflict check
    checkForConflicts();

    // Set up periodic sync if online (every 5 minutes)
    const syncInterval = setInterval(() => {
      if (isOnline && !isSyncing) {
        syncNow();
      }
    }, 5 * 60 * 1000);

    // Clean up event listeners and interval
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline]);

  const contextValue: OfflineContextType = {
    isOnline,
    isSyncing,
    hasConflicts,
    conflictStores,
    syncNow,
    lastSyncTime,
  };
  
  return (
    <OfflineContext.Provider value={contextValue}>
      {children}
    </OfflineContext.Provider>
  );
}

// Custom hook to use the offline context
export function useOffline() {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
} 