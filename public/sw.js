// Service Worker de GastX — cache básico de la "app shell" para carga offline.
// Estrategia: network-first para navegación (HTML), cache-first para estáticos.
// Se registra como /sw.js?v=<versión>: cada deploy instala un SW nuevo que
// toma el control al instante y borra el cache de la versión anterior.
// Nota: las notificaciones push se agregarán en una fase posterior.

const VERSION = new URL(self.location.href).searchParams.get("v") || "v1";
const CACHE = `gastx-${VERSION}`;
const APP_SHELL = ["/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // APIs y otros dominios (Supabase, PayPal): siempre directo a la red.
  if (url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Navegación (HTML): red primero, cae a cache si no hay conexión.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Las redirecciones no se pueden servir desde cache en una navegación.
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((r) => r || caches.match("/dashboard"))
            .then((r) => r || Response.error()),
        ),
    );
    return;
  }

  // Estáticos: cache primero, si no está va a la red.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
