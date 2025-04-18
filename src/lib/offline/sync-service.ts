"use client";

import { processSyncQueue, addToSyncQueue, getAll, putItem } from './db';
import { createClient } from '@/lib/supabase/client';

// Define SyncManager interface for TypeScript
interface SyncManager {
  register(tag: string): Promise<void>;
}

// Extend ServiceWorkerRegistration to include sync property
declare global {
  interface ServiceWorkerRegistration {
    sync: SyncManager;
  }
  
  interface Window {
    SyncManager: SyncManager;
  }
}

// Different sync strategies for conflict resolution
export type SyncStrategy = 'server-wins' | 'client-wins' | 'merge' | 'manual';

interface SyncResult {
  successful: number;
  failed: number;
  pending: number;
}

/**
 * Initialize background sync if browser supports it
 */
export function registerBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      // Register different sync types
      registration.sync.register('sync-registrations');
      registration.sync.register('sync-tickets');
      console.log('Background sync registered');
    }).catch(err => {
      console.error('Background sync registration failed:', err);
    });
  } else {
    console.warn('Background sync not supported in this browser');
  }
}

/**
 * Try to sync all pending changes with the server
 * @param skipStrategy Optional sync strategy to use for all changes
 * @returns Promise resolving to the sync result
 */
export async function syncWithServer(skipStrategy?: SyncStrategy): Promise<SyncResult> {
  const result: SyncResult = {
    successful: 0,
    failed: 0,
    pending: 0
  };
  
  if (!navigator.onLine) {
    console.log('Device is offline, skipping sync');
    const pendingItems = await getAll('syncQueue');
    result.pending = pendingItems.length;
    return result;
  }
  
  try {
    const processedCount = await processSyncQueue(async (item) => {
      try {
        const { action, storeName, data } = item;
        const supabase = createClient();
        
        // Apply the appropriate sync strategy
        const strategy = skipStrategy || determineStrategy(storeName, action);
        
        // Handle the action based on the sync strategy
        switch (action) {
          case 'create':
            await handleCreateAction(supabase, storeName, data, strategy);
            break;
          case 'update':
            await handleUpdateAction(supabase, storeName, data, strategy);
            break;
          case 'delete':
            await handleDeleteAction(supabase, storeName, data);
            break;
        }
        
        result.successful++;
        return true;
      } catch (error) {
        console.error('Failed to process sync item:', error);
        result.failed++;
        return false;
      }
    });
    
    console.log(`Sync completed: ${processedCount} items processed`);
    
    // Get count of remaining items
    const pendingItems = await getAll('syncQueue');
    result.pending = pendingItems.length;
    
    return result;
  } catch (error) {
    console.error('Error during sync:', error);
    throw error;
  }
}

/**
 * Determine the appropriate sync strategy for the given store and action
 */
function determineStrategy(storeName: string, action: string): SyncStrategy {
  // Different entities may need different strategies
  switch (storeName) {
    case 'events':
      return 'server-wins'; // Events are managed by organizers, server is source of truth
    case 'registrations':
      return 'client-wins'; // User registrations should preserve local changes
    case 'tickets':
      return action === 'update' ? 'merge' : 'server-wins'; // Merge changes for ticket updates
    default:
      return 'server-wins';
  }
}

/**
 * Handle create actions
 */
async function handleCreateAction(
  supabase: any, 
  storeName: string, 
  data: any, 
  strategy: SyncStrategy
) {
  // For create actions, we insert the data into the server
  const { data: serverData, error } = await supabase
    .from(storeName)
    .insert(data)
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  // Store the updated data locally with the server-generated ID
  await putItem(storeName, serverData);
  
  return serverData;
}

/**
 * Handle update actions with conflict resolution
 */
async function handleUpdateAction(
  supabase: any, 
  storeName: string, 
  data: any, 
  strategy: SyncStrategy
) {
  // First, get the current server version
  const { data: serverData, error: fetchError } = await supabase
    .from(storeName)
    .select('*')
    .eq('id', data.id)
    .single();
  
  if (fetchError) {
    throw fetchError;
  }
  
  let dataToUpdate;
  
  // Apply the appropriate conflict resolution strategy
  switch (strategy) {
    case 'server-wins':
      // Just use server data, discard local changes
      dataToUpdate = serverData;
      break;
      
    case 'client-wins':
      // Use client data, overwrite server
      dataToUpdate = data;
      break;
      
    case 'merge':
      // Merge server and client data
      dataToUpdate = { ...serverData, ...data };
      break;
      
    case 'manual':
      // Store conflict for manual resolution
      await addToSyncQueue('update', `${storeName}_conflicts`, {
        clientData: data,
        serverData,
        timestamp: new Date().toISOString()
      });
      // For now, use the server data
      dataToUpdate = serverData;
      break;
  }
  
  // Update server with the resolved data
  const { data: updatedData, error: updateError } = await supabase
    .from(storeName)
    .update(dataToUpdate)
    .eq('id', data.id)
    .select()
    .single();
  
  if (updateError) {
    throw updateError;
  }
  
  // Update local storage with the final data
  await putItem(storeName, updatedData);
  
  return updatedData;
}

/**
 * Handle delete actions
 */
async function handleDeleteAction(supabase: any, storeName: string, data: any) {
  // For delete actions, we delete from the server
  const { error } = await supabase
    .from(storeName)
    .delete()
    .eq('id', data.id);
  
  if (error) {
    throw error;
  }
  
  return true;
}

/**
 * Force a synchronization attempt
 */
export async function forceSyncNow(): Promise<SyncResult> {
  try {
    // Try to register for background sync first
    registerBackgroundSync();
    
    // Then immediately try to sync
    return await syncWithServer();
  } catch (error) {
    console.error('Forced sync failed:', error);
    throw error;
  }
} 