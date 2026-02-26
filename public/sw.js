// RestAL Service Worker — PWA with offline support & web push
const CACHE_VERSION = 'restal-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const TRIP_CACHE = `${CACHE_VERSION}-trips`;

// Static assets to pre-cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/logo.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// API routes to cache dynamically for offline access
const CACHEABLE_API_PATTERNS = [
  /\/api\/trips/,
  /\/api\/notifications/,
  /\/api\/cashback-data/,
];

// Image patterns to cache
const IMAGE_PATTERNS = [
  /\/countryImages\//,
  /\/icons\//,
  /\/images\//,
  /\/companies\//,
];

/* ── Install ──────────────────────────────────────────────────────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

/* ── Activate ─────────────────────────────────────────────────────── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith('restal-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== TRIP_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/* ── Fetch ────────────────────────────────────────────────────────── */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;

  // Strategy: API requests → Network first, fallback to cache
  if (url.pathname.startsWith('/api/')) {
    const isCacheable = CACHEABLE_API_PATTERNS.some((p) => p.test(url.pathname));
    if (isCacheable) {
      event.respondWith(networkFirstWithCache(request, TRIP_CACHE));
    }
    return;
  }

  // Strategy: Images → Cache first, fallback to network
  if (IMAGE_PATTERNS.some((p) => p.test(url.pathname))) {
    event.respondWith(cacheFirstWithNetwork(request, DYNAMIC_CACHE));
    return;
  }

  // Strategy: HTML pages → Network first, then cache, then offline page
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstHTML(request));
    return;
  }

  // Strategy: Other static assets → Cache first
  event.respondWith(cacheFirstWithNetwork(request, STATIC_CACHE));
});

/* ── Strategies ───────────────────────────────────────────────────── */

async function networkFirstWithCache(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ offline: true, message: 'Ви офлайн' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 503,
    });
  }
}

async function cacheFirstWithNetwork(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

async function networkFirstHTML(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Return cached homepage as fallback offline page
    const homeCached = await caches.match('/');
    if (homeCached) return homeCached;

    return new Response(
      `<!DOCTYPE html>
      <html lang="uk">
      <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><title>RestAL — Офлайн</title>
      <style>
        body { font-family: -apple-system, system-ui, sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 24px; }
        .container { max-width: 400px; }
        h1 { font-size: 24px; margin-bottom: 12px; }
        p { color: #94a3b8; line-height: 1.6; }
        .icon { font-size: 48px; margin-bottom: 16px; }
        button { margin-top: 24px; background: #1e40af; color: #fff; border: none; padding: 12px 24px; border-radius: 12px; font-size: 16px; cursor: pointer; }
      </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">✈️</div>
          <h1>Ви офлайн</h1>
          <p>Немає підключення до інтернету. Перевірте з'єднання та спробуйте ще раз.</p>
          <button onclick="location.reload()">Оновити</button>
        </div>
      </body>
      </html>`,
      { headers: { 'Content-Type': 'text/html; charset=utf-8' }, status: 503 }
    );
  }
}

/* ── Background Sync (for offline actions) ────────────────────────── */
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notifications') {
    event.waitUntil(
      // Re-fetch notifications when back online
      fetch('/api/notifications').catch(() => {})
    );
  }
});

/* ── Message handler for cache management ─────────────────────────── */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'CACHE_TRIP_DATA') {
    // Cache trip data for offline access
    event.waitUntil(
      caches.open(TRIP_CACHE).then((cache) => {
        const tripData = JSON.stringify(event.data.payload);
        const response = new Response(tripData, {
          headers: { 'Content-Type': 'application/json' },
        });
        return cache.put(`/offline/trip/${event.data.payload._id}`, response);
      })
    );
  }

  if (event.data?.type === 'CLEAR_CACHES') {
    event.waitUntil(
      caches.keys().then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('restal-')).map((k) => caches.delete(k)))
      )
    );
  }

  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
