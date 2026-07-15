// Service Worker de GastX — cache básico de la "app shell" para carga offline.
// Estrategia: network-first para navegación (HTML), cache-first para estáticos.
// Nota: las notificaciones push se agregarán en una fase posterior.

const CACHE = "gastx-v1";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icon.svg"];

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
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navegación (HTML): red primero, cae a cache si no hay conexión.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
    );
    return;
  }

  // Estáticos: cache primero, si no está va a la red.
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
