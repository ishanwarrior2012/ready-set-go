// SafeTrack Service Worker v2.0.0 — Zero-Trust Offline + Background Sync
const CACHE_VERSION = "v2.0";
const CACHE_NAME = `safetrack-${CACHE_VERSION}`;
const RUNTIME_CACHE = `safetrack-runtime-${CACHE_VERSION}`;
const SYNC_TAG = "safetrack-background-sync";

// Assets to cache on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.svg",
];

// ─── Install: precache shell ───────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch(() => {
        // Fail silently — don't block install if a resource is missing
      });
    })
  );
  self.skipWaiting();
});

// ─── Activate: clean stale caches ──────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// ─── Fetch: Zero-trust tiered strategy ─────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Never intercept auth or Supabase Edge Function calls — always network
  if (
    url.pathname.startsWith("/functions/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/rest/") ||
    url.pathname.startsWith("/realtime/")
  ) {
    return;
  }

  // Navigation requests: network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((c) => c.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match("/") || new Response(
            "<html><body><h1>SafeTrack — You're Offline</h1><p>Connect to the internet to continue.</p></body></html>",
            { headers: { "Content-Type": "text/html" } }
          );
        })
    );
    return;
  }

  // Static assets: stale-while-revalidate
  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "image" ||
    request.destination === "font" ||
    request.destination === "manifest"
  ) {
    event.respondWith(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        }).catch(() => null);

        return cached || networkFetch;
      })
    );
    return;
  }

  // Default: network-first, cache as fallback
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.method === "GET") {
          caches.open(RUNTIME_CACHE).then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// ─── Background Sync: retry queued actions ─────────────────────────────────
self.addEventListener("sync", (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(processOfflineQueue());
  }
});

async function processOfflineQueue() {
  try {
    const clients = await self.clients.matchAll({ type: "window" });
    for (const client of clients) {
      client.postMessage({ type: "PROCESS_OFFLINE_QUEUE" });
    }
  } catch (e) {
    // Silently fail
  }
}

// ─── Message handler ─────────────────────────────────────────────────────────
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data?.type === "REGISTER_SYNC") {
    self.registration.sync?.register(SYNC_TAG).catch(() => {});
  }
});

// ─── Push Notifications ───────────────────────────────────────────────────────
self.addEventListener("push", (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const options = {
      body: data.message || "New update available",
      icon: "/favicon.svg",
      badge: "/favicon.svg",
      vibrate: [100, 50, 100],
      data: { url: data.url || "/" },
      actions: [
        { action: "open", title: "Open SafeTrack" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };
    event.waitUntil(
      self.registration.showNotification(data.title || "SafeTrack", options)
    );
  } catch (e) {
    // Malformed push data
  }
});

// ─── Notification click ───────────────────────────────────────────────────────
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});

// ─── Periodic background sync (future) ───────────────────────────────────────
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "safetrack-data-refresh") {
    event.waitUntil(processOfflineQueue());
  }
});

console.log("[SW] SafeTrack Service Worker v2.0 loaded");
