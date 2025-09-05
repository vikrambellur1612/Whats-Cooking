// Service Worker for ನಾಳೆ ಅಡುಗೆ ಏನು? PWA v2.1.0
const CACHE_NAME = 'naale-aduge-v2.1.0';
const STATIC_CACHE_NAME = 'whats-cooking-static-v2.1.0';
const DYNAMIC_CACHE_NAME = 'whats-cooking-dynamic-v2.1.0';

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/css/components.css',
  '/js/main.js',
  '/js/navigation.js',
  '/data/breakfast-catalog.json',
  '/data/mains-catalog.json',
  '/data/side-dishes-catalog.json',
  '/data/accompaniments-catalog.json',
  '/modules/dashboard/dashboard.html',
  '/modules/dashboard/dashboard.css',
  '/modules/dashboard/dashboard.js',
  '/modules/calendar/home.html',
  '/modules/calendar/home.css',
  '/modules/calendar/home.js',
  '/modules/breakfast-catalog/breakfast-catalog.html',
  '/modules/breakfast-catalog/breakfast-catalog.css',
  '/modules/breakfast-catalog/breakfast-catalog.js',
  '/modules/mains-catalog/mains-catalog.html',
  '/modules/mains-catalog/mains-catalog.css',
  '/modules/mains-catalog/mains-catalog.js',
  '/modules/side-dishes-catalog/side-dishes-catalog.html',
  '/modules/side-dishes-catalog/side-dishes-catalog.css',
  '/modules/side-dishes-catalog/side-dishes-catalog.js',
  '/modules/accompaniments-catalog/accompaniments-catalog.html',
  '/modules/accompaniments-catalog/accompaniments-catalog.css',
  '/modules/accompaniments-catalog/accompaniments-catalog.js',
  '/modules/about/about.html',
  '/modules/about/about.css',
  '/modules/about/about.js',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png'
];

// Network-first resources (always try network first)
const NETWORK_FIRST = [
  '/data/'
];

// Cache-first resources (try cache first)
const CACHE_FIRST = [
  '/css/',
  '/js/',
  '/modules/',
  '/assets/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing service worker v2.1.0...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Installation complete');
        // Don't skip waiting automatically - let the app decide
        return;
      })
      .catch((error) => {
        console.error('SW: Installation failed:', error);
      })
  );
});

// Activate event - cleanup old caches and notify about updates
self.addEventListener('activate', (event) => {
  console.log('SW: Activating service worker v2.1.0...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const oldCaches = cacheNames.filter((cacheName) => {
          return cacheName !== STATIC_CACHE_NAME && 
                 cacheName !== DYNAMIC_CACHE_NAME &&
                 (cacheName.startsWith('whats-cooking-') || cacheName.startsWith('naale-aduge-'));
        });
        
        // If there were old caches, this is an update
        const isUpdate = oldCaches.length > 0;
        
        return Promise.all([
          // Delete old caches
          ...oldCaches.map((cacheName) => {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }),
          // Take control of clients
          self.clients.claim().then(() => {
            if (isUpdate) {
              // Notify all clients about the update
              return self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                  client.postMessage({
                    type: 'SW_UPDATED',
                    version: '2.1.0',
                    message: 'App updated! New features: improved navigation and modal positioning.'
                  });
                });
              });
            }
          })
        ]);
      })
      .then(() => {
        console.log('SW: Activation complete');
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }

  event.respondWith(handleRequest(request));
});

// Handle different types of requests
async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;
  
  try {
    // Network-first strategy for data files
    if (NETWORK_FIRST.some(pattern => path.includes(pattern))) {
      return await networkFirst(request);
    }
    
    // Cache-first strategy for static assets
    if (CACHE_FIRST.some(pattern => path.includes(pattern))) {
      return await cacheFirst(request);
    }
    
    // HTML files - network first with cache fallback
    if (path.endsWith('.html') || path === '/') {
      return await networkFirst(request);
    }
    
    // Default to cache-first for everything else
    return await cacheFirst(request);
    
  } catch (error) {
    console.error('SW: Request handling failed:', error);
    
    // Return offline fallback if available
    return await getOfflineFallback(request);
  }
}

// Network-first strategy
async function networkFirst(request) {
  try {
    console.log('SW: Network-first for:', request.url);
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for next time
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.log('SW: Network failed, trying cache for:', request.url);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Cache-first strategy
async function cacheFirst(request) {
  console.log('SW: Cache-first for:', request.url);
  
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    console.log('SW: Serving from cache:', request.url);
    return cachedResponse;
  }
  
  console.log('SW: Not in cache, fetching:', request.url);
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('SW: Both cache and network failed for:', request.url);
    
    // Try to return a meaningful offline response for HTML/JS/CSS files
    if (request.url.includes('.html') || request.url.includes('.js') || request.url.includes('.css')) {
      return new Response(
        `// Offline fallback for ${request.url}
        console.error('Resource unavailable offline: ${request.url}');`,
        {
          status: 200,
          statusText: 'OK (Offline Fallback)',
          headers: {
            'Content-Type': request.url.includes('.html') ? 'text/html' : 
                           request.url.includes('.js') ? 'application/javascript' : 
                           'text/css',
          },
        }
      );
    }
    
    throw error;
  }
}

// Offline fallback
async function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For HTML requests, return the main page
  if (request.headers.get('accept')?.includes('text/html')) {
    const cachedIndex = await caches.match('/');
    if (cachedIndex) {
      return cachedIndex;
    }
  }
  
  // For images, return a placeholder if available
  if (request.headers.get('accept')?.includes('image/')) {
    const cachedIcon = await caches.match('/assets/icons/icon-192x192.png');
    if (cachedIcon) {
      return cachedIcon;
    }
  }
  
  // Return a generic offline response
  return new Response(
    JSON.stringify({
      error: 'Offline',
      message: 'This content is not available offline',
      timestamp: new Date().toISOString()
    }),
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

// Background sync for data updates
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    console.log('SW: Performing background sync...');
    
    // Refresh data files
    const dataFiles = [
      '/data/breakfast-catalog.json',
      '/data/mains-catalog.json',
      '/data/side-dishes-catalog.json',
      '/data/accompaniments-catalog.json'
    ];
    
    const cache = await caches.open(DYNAMIC_CACHE_NAME);
    
    for (const file of dataFiles) {
      try {
        const response = await fetch(file);
        if (response.ok) {
          await cache.put(file, response);
          console.log('SW: Updated cache for:', file);
        }
      } catch (error) {
        console.log('SW: Failed to update:', file, error);
      }
    }
    
  } catch (error) {
    console.error('SW: Background sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'New content available',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/icon-72x72.png',
    data: data.url || '/',
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'close',
        title: 'Close'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'What\'s Cooking', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'close') {
    return;
  }
  
  const urlToOpen = event.notification.data || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handler for communication with main app
self.addEventListener('message', (event) => {
  console.log('SW: Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('SW: Skipping waiting and taking control');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'VERSION',
      version: CACHE_NAME,
      staticCache: STATIC_CACHE_NAME,
      dynamicCache: DYNAMIC_CACHE_NAME
    });
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    // Respond with current version info
    const response = {
      type: 'VERSION_INFO',
      version: '2.1.0',
      cacheVersion: CACHE_NAME,
      updateAvailable: false
    };
    
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(response);
    } else {
      // Broadcast to all clients
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage(response);
        });
      });
    }
  }
});
