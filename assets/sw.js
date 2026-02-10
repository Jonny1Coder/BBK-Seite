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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

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
          throw err;
        });
      })
  );
});

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
