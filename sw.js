/* ==========================================================================
   sw.js — service worker for offline + installable (PWA) support.
   Cache-first for the static app shell (everything here is a plain
   <script>/<link> tag with no build step, so "the app shell" is just this
   file list). Navigation requests go network-first so an online visit
   always picks up new code, falling back to the cache when offline.
   Bump CACHE_NAME on any app-shell change so old clients pick up the
   new files instead of serving a stale cache forever.
   ========================================================================== */

const CACHE_NAME = 'fz-shell-v4';

const APP_SHELL = [
  './',
  'index.html',
  'styles.css',
  'script.js',
  'config.js',
  'manifest.json',
  'images/favicon.svg',
  'images/logo.svg',

  'data/supabaseClient.js',
  'data/adapters/supabaseDataAdapter.js',
  'data/adapters/mockDataAdapter.js',
  'data/adapters/supabaseAuthAdapter.js',
  'data/adapters/mockAuthAdapter.js',
  'data/appMode.js',
  'data/storage.js',

  'utils/id.js',
  'utils/format.js',
  'utils/dom.js',
  'utils/markdown.js',
  'utils/archive.js',
  'utils/recurrence.js',
  'utils/chart.js',

  'components/toast.js',
  'components/modal.js',
  'components/confirm.js',
  'components/deleteFlow.js',
  'components/form.js',
  'components/card.js',
  'components/listRow.js',
  'components/search.js',
  'components/sidebar.js',
  'components/auth.js',

  'modules/tasks.js',
  'modules/finance.js',
  'modules/clients.js',
  'modules/projects.js',
  'modules/health.js',
  'modules/habits.js',
  'modules/knowledge.js',
  'modules/calendar.js',
  'modules/archive.js',
  'modules/settings.js',
  'modules/analytics.js',
  'modules/dashboard.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('index.html', copy));
          return response;
        })
        .catch(() => caches.match('index.html'))
    );
    return;
  }

  // Only the same-origin app shell is cache-first. Supabase API calls and
  // the supabase-js CDN script are cross-origin and MUST go straight to the
  // network every time — caching a database response here would silently
  // serve stale data instead of what's actually in Postgres.
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    }))
  );
});
