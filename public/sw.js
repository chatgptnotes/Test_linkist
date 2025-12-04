// Service Worker for Linkist PWA
// Enables "Add to Home Screen" native prompt

const CACHE_NAME = 'linkist-v1';

// Install event - activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim all clients
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

// Fetch event - network first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Return cached response if network fails
        return caches.match(event.request);
      })
  );
});
