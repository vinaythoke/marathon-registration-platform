"use client";

import { useState, useEffect, useCallback } from 'react';
import { useOffline } from '@/context/OfflineContext';
import { getAll, getById, putItem, deleteItem, addToSyncQueue } from '@/lib/offline/db';
import { createClient } from '@/lib/supabase/client';

/**
 * A hook for handling data operations that work both online and offline
 * @param storeName The IndexedDB store name to use for offline data
 * @param tableName The Supabase table name (defaults to same as storeName)
 * @returns Object with data and operations
 */
export function useOfflineData<T extends { id: string }>(
  storeName: string,
  tableName: string = storeName
) {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOffline } = useOffline();
  
  // Fetch data either from server or local storage
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (isOffline) {
        // If offline, get data from IndexedDB
        const offlineData = await getAll<T>(storeName);
        setItems(offlineData);
      } else {
        // If online, get data from server
        const supabase = createClient();
        const { data, error } = await supabase.from(tableName).select('*');
        
        if (error) {
          throw error;
        }
        
        // Store data in IndexedDB for offline use
        for (const item of data) {
          await putItem(storeName, item);
        }
        
        setItems(data as T[]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
      
      // Try to get data from IndexedDB as a fallback
      try {
        const offlineData = await getAll<T>(storeName);
        setItems(offlineData);
      } catch (dbError) {
        console.error('Failed to get offline data:', dbError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isOffline, storeName, tableName]);
  
  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  // Get a single item
  const getItem = useCallback(async (id: string): Promise<T | null> => {
    try {
      if (isOffline) {
        // If offline, get from IndexedDB
        const item = await getById<T>(storeName, id);
        return item || null;
      } else {
        // If online, get from server
        const supabase = createClient();
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          throw error;
        }
        
        // Store in IndexedDB
        await putItem(storeName, data);
        
        return data as T;
      }
    } catch (err) {
      console.error(`Error getting item ${id}:`, err);
      
      // Try to get from IndexedDB as fallback
      try {
        const item = await getById<T>(storeName, id);
        return item || null;
      } catch (dbError) {
        console.error('Failed to get offline item:', dbError);
        return null;
      }
    }
  }, [isOffline, storeName, tableName]);
  
  // Create a new item
  const createItem = useCallback(async (item: Omit<T, 'id'>): Promise<T | null> => {
    try {
      if (isOffline) {
        // Generate a temporary ID
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const tempItem = { ...item, id: tempId } as T;
        
        // Store in IndexedDB
        await putItem(storeName, tempItem);
        
        // Add to sync queue
        await addToSyncQueue('create', tableName, tempItem);
        
        // Update local state
        setItems(prev => [...prev, tempItem]);
        
        return tempItem;
      } else {
        // If online, create on server
        const supabase = createClient();
        const { data, error } = await supabase
          .from(tableName)
          .insert(item)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        // Store in IndexedDB
        await putItem(storeName, data);
        
        // Update local state
        setItems(prev => [...prev, data as T]);
        
        return data as T;
      }
    } catch (err) {
      console.error('Error creating item:', err);
      
      if (isOffline) {
        // If we're offline, the error is expected, don't treat it as an error
        return null;
      }
      
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, [isOffline, storeName, tableName]);
  
  // Update an existing item
  const updateItem = useCallback(async (id: string, updates: Partial<T>): Promise<T | null> => {
    try {
      // Get the current item first
      const currentItem = await getItem(id);
      
      if (!currentItem) {
        throw new Error(`Item with ID ${id} not found`);
      }
      
      // Merge updates with current item
      const updatedItem = { ...currentItem, ...updates, id } as T;
      
      if (isOffline) {
        // Store in IndexedDB
        await putItem(storeName, updatedItem);
        
        // Add to sync queue
        await addToSyncQueue('update', tableName, updatedItem);
        
        // Update local state
        setItems(prev => prev.map(item => item.id === id ? updatedItem : item));
        
        return updatedItem;
      } else {
        // If online, update on server
        const supabase = createClient();
        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          throw error;
        }
        
        // Store in IndexedDB
        await putItem(storeName, data);
        
        // Update local state
        setItems(prev => prev.map(item => item.id === id ? (data as T) : item));
        
        return data as T;
      }
    } catch (err) {
      console.error(`Error updating item ${id}:`, err);
      
      if (isOffline) {
        // If we're offline, the error is expected, don't treat it as an error
        return null;
      }
      
      setError(err instanceof Error ? err : new Error(String(err)));
      return null;
    }
  }, [isOffline, storeName, tableName, getItem]);
  
  // Delete an item
  const deleteItemById = useCallback(async (id: string): Promise<boolean> => {
    try {
      if (isOffline) {
        // First get the item to store in sync queue
        const itemToDelete = await getById<T>(storeName, id);
        
        if (itemToDelete) {
          // Add to sync queue
          await addToSyncQueue('delete', tableName, { id });
        }
        
        // Delete from IndexedDB
        await deleteItem(storeName, id);
        
        // Update local state
        setItems(prev => prev.filter(item => item.id !== id));
        
        return true;
      } else {
        // If online, delete from server
        const supabase = createClient();
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);
        
        if (error) {
          throw error;
        }
        
        // Delete from IndexedDB
        await deleteItem(storeName, id);
        
        // Update local state
        setItems(prev => prev.filter(item => item.id !== id));
        
        return true;
      }
    } catch (err) {
      console.error(`Error deleting item ${id}:`, err);
      
      if (isOffline) {
        // If we're offline, the error is expected, don't treat it as an error
        return true;
      }
      
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [isOffline, storeName, tableName]);
  
  return {
    items,
    isLoading,
    error,
    refresh: fetchData,
    getItem,
    createItem,
    updateItem,
    deleteItem: deleteItemById,
  };
} 