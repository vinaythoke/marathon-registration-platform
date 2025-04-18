/**
 * IndexedDB setup and operations for offline data storage
 */

const DB_NAME = 'MarathonRegistrationDB';
const DB_VERSION = 1;

// Define object stores (tables) and their key paths
const STORES = {
  events: { keyPath: 'id' },
  tickets: { keyPath: 'id' },
  registrations: { keyPath: 'id' },
  syncQueue: { keyPath: 'id', autoIncrement: true }
};

// Define types for sync queue items
interface SyncQueueItem {
  id?: number;
  action: 'create' | 'update' | 'delete';
  storeName: string;
  data: any;
  timestamp: string;
  attempts: number;
  lastAttempt: string | null;
  error?: string;
}

// IndexedDB instance
let db: IDBDatabase | null = null;

/**
 * Initialize the database
 * @returns Promise that resolves when the database is ready
 */
export async function initDatabase(): Promise<IDBDatabase> {
  if (db) return db;
  
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Your browser does not support IndexedDB'));
      return;
    }
    
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      reject(new Error('Failed to open database'));
    };
    
    request.onsuccess = (event) => {
      db = request.result;
      resolve(db);
    };
    
    // Set up database schema if it's a new database or version upgrade
    request.onupgradeneeded = (event) => {
      const database = request.result;
      
      // Create object stores for each entity
      for (const [storeName, options] of Object.entries(STORES)) {
        if (!database.objectStoreNames.contains(storeName)) {
          database.createObjectStore(storeName, options);
          console.log(`Created object store: ${storeName}`);
        }
      }
      
      // Create indices for better querying
      const syncQueueStore = request.transaction?.objectStore('syncQueue');
      if (syncQueueStore && !syncQueueStore.indexNames.contains('by_action')) {
        syncQueueStore.createIndex('by_action', 'action', { unique: false });
      }
    };
  });
}

/**
 * Get all items from a store
 * @param storeName The name of the object store
 * @returns Promise resolving to an array of items
 */
export async function getAll<T>(storeName: string): Promise<T[]> {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => {
      resolve(request.result as T[]);
    };
    
    request.onerror = () => {
      reject(new Error(`Failed to get items from ${storeName}`));
    };
  });
}

/**
 * Get an item by its ID
 * @param storeName The name of the object store
 * @param id The ID of the item to get
 * @returns Promise resolving to the item or undefined if not found
 */
export async function getById<T>(storeName: string, id: string | number): Promise<T | undefined> {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => {
      resolve(request.result as T);
    };
    
    request.onerror = () => {
      reject(new Error(`Failed to get item with ID ${id} from ${storeName}`));
    };
  });
}

/**
 * Add or update an item in a store
 * @param storeName The name of the object store
 * @param item The item to add or update
 * @returns Promise resolving to the ID of the added/updated item
 */
export async function putItem<T>(storeName: string, item: T): Promise<IDBValidKey> {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = () => {
      reject(new Error(`Failed to save item to ${storeName}`));
    };
  });
}

/**
 * Delete an item by its ID
 * @param storeName The name of the object store
 * @param id The ID of the item to delete
 * @returns Promise that resolves when the item is deleted
 */
export async function deleteItem(storeName: string, id: string | number): Promise<void> {
  const database = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => {
      resolve();
    };
    
    request.onerror = () => {
      reject(new Error(`Failed to delete item with ID ${id} from ${storeName}`));
    };
  });
}

/**
 * Update a specific item by its ID
 * @param storeName The name of the object store
 * @param id The ID of the item to update
 * @param newData The new data to set
 * @returns Promise resolving to the updated item's ID
 */
export async function updateItem<T>(storeName: string, id: string | number, newData: T): Promise<IDBValidKey> {
  const database = await initDatabase();
  
  return new Promise(async (resolve, reject) => {
    try {
      // First get the existing item
      const existingItem = await getById<Record<string, any>>(storeName, id);
      
      if (!existingItem) {
        reject(new Error(`Item with ID ${id} not found in ${storeName}`));
        return;
      }
      
      // Merge existing and new data
      const updatedItem = { ...existingItem, ...newData as Record<string, any> };
      
      // Use putItem to update the record
      const result = await putItem(storeName, updatedItem);
      resolve(result);
    } catch (error) {
      reject(new Error(`Failed to update item with ID ${id} in ${storeName}: ${error}`));
    }
  });
}

/**
 * Add an item to the sync queue for processing when online
 * @param action The action to perform (create, update, delete)
 * @param storeName The name of the object store the action applies to
 * @param data The data associated with the action
 * @returns Promise resolving to the ID of the queued item
 */
export async function addToSyncQueue(
  action: 'create' | 'update' | 'delete',
  storeName: string,
  data: any
): Promise<IDBValidKey> {
  const syncItem: SyncQueueItem = {
    action,
    storeName,
    data,
    timestamp: new Date().toISOString(),
    attempts: 0,
    lastAttempt: null,
  };
  
  return putItem('syncQueue', syncItem);
}

/**
 * Process items in the sync queue
 * @param processFunction Function to process each queue item
 * @returns Promise resolving to the number of processed items
 */
export async function processSyncQueue(
  processFunction: (item: SyncQueueItem) => Promise<boolean>
): Promise<number> {
  const items = await getAll<SyncQueueItem>('syncQueue');
  let processedCount = 0;
  
  for (const item of items) {
    try {
      const success = await processFunction(item);
      
      if (success) {
        if (item.id !== undefined) {
          await deleteItem('syncQueue', item.id);
        }
        processedCount++;
      } else {
        // Update attempt count
        item.attempts += 1;
        item.lastAttempt = new Date().toISOString();
        await putItem('syncQueue', item);
      }
    } catch (error) {
      console.error('Error processing sync queue item:', error);
      // Update attempt count
      item.attempts += 1;
      item.lastAttempt = new Date().toISOString();
      item.error = error instanceof Error ? error.message : String(error);
      await putItem('syncQueue', item);
    }
  }
  
  return processedCount;
}

/**
 * Clear all data from the database
 * @returns Promise that resolves when all data is cleared
 */
export async function clearDatabase(): Promise<void> {
  const database = await initDatabase();
  
  const promises = Object.keys(STORES).map((storeName) => {
    return new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        resolve();
      };
      
      request.onerror = () => {
        reject(new Error(`Failed to clear ${storeName}`));
      };
    });
  });
  
  await Promise.all(promises);
} 