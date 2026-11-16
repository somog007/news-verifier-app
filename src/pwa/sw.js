// sw.js - VerifiNews service worker (template; the build fills in VERSION and FILES).
//
// Saves the whole app on install so it opens with no connection. Pages and the
// app's own files come from the cache first; a new deploy installs a new worker,
// and the page offers to reload into it. API calls and news sites are never
// cached here: live checks always go to the network, and offline checks use the
// headlines the app saves in localStorage.

const VERSION = "__VERSION__";
const FILES = __FILES__;
const APP_CACHE = `verifinews-app-${VERSION}`;
const FONT_CACHE = "verifinews-fonts-v1";
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

const scopeUrl = new URL(self.registration.scope);
const INDEX = new URL("index.html", scopeUrl).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(FILES.map((f) => new URL(f, scopeUrl).href))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k.startsWith("verifinews-app-") && k !== APP_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

async function fromCacheFirst(request, cacheName) {
  // ignoreVary: script tags send an Origin header that the saved copy (fetched at
  // install) didn't, and hosts that answer with "Vary: Origin" would otherwise miss.
  const cached = await caches.match(request, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok || response.type === "opaque") {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// Fonts: show the saved copy straight away and refresh it in the background.
async function staleWhileRevalidate(request) {
  const cache = await caches.open(FONT_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response.ok || response.type === "opaque") cache.put(request, response.clone());
      return response;
    })
    .catch(() => cached);
  return cached || network;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
    return;
  }
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopeUrl.pathname)) return;
  if (url.pathname.startsWith(`${scopeUrl.pathname}api/`)) return;

  if (request.mode === "navigate") {
    // Single-page app: every page in scope is index.html.
    event.respondWith(
      caches.match(INDEX, { ignoreVary: true }).then((cached) => cached || fetch(request)),
    );
    return;
  }
  event.respondWith(fromCacheFirst(request, APP_CACHE));
});
