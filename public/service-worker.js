// Marathon Registration Platform - Service Worker
// Version: 1.0.0

const CACHE_NAME = 'marathon-app-v1';
const RUNTIME_CACHE = 'marathon-runtime-v1';

// Resources to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add CSS and JS files that are crucial for the app shell
];

// Installation Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activation Event - Clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network first with cache fallback strategy for API calls
// Cache first for static assets
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - Network first with cache fallback
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache the response for future offline use
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // If network fails, try to serve from cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Static assets - Cache first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache responses that aren't successful
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Cache the new resource for future use
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // If both cache and network fail, show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
        
        // Return nothing for non-navigation requests
        return new Response('', { 
          status: 408,
          headers: { 'Content-Type': 'text/plain' }
        });
      });
    })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncRegistrations());
  }
  
  if (event.tag === 'sync-tickets') {
    event.waitUntil(syncTickets());
  }
});

// Handle push notifications
self.addEventListener('push', (event) => {
  const data = event.data.json();
  
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/notification-badge.png',
      data: data.url ? { url: data.url } : null
    })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Utility functions for background sync
async function syncRegistrations() {
  // Implement the logic to sync pending registrations
  try {
    // Get all pending registrations from IndexedDB
    // Process each registration and send to server
    return Promise.resolve();
  } catch (error) {
    console.error('Error syncing registrations:', error);
    return Promise.reject(error);
  }
}

async function syncTickets() {
  // Implement the logic to sync tickets
  try {
    // Get all pending ticket operations from IndexedDB
    // Process each operation and send to server
    return Promise.resolve();
  } catch (error) {
    console.error('Error syncing tickets:', error);
    return Promise.reject(error);
  }
} 