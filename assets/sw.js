const CACHE_NAME = 'bbk-seite-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/assets/style.css',
  '/assets/shared.js',
  '/assets/home.js',
  '/countdown/',
  '/countdown/index.html',
  '/countdown/countdown.js',
  '/pruefungen/',
  '/pruefungen/index.html',
  '/pruefungen/pruefungen.js',
  '/pruefungen/data.json'
];

// Install event - cache all resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            })
            .catch(err => {
              console.log('Cache put failed:', err);
            });
          
          return response;
        }).catch(err => {
          console.log('Fetch failed:', err);
          // Return a custom offline response if needed
          throw err;
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
