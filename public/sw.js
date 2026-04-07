// Service Worker minimal — Yayyam PWA
const CACHE_NAME = 'yayyam-pro-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim())
})

self.addEventListener('fetch', (event) => {
  // Network-first strategy — ne pas cacher pour le moment
  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)))
})
