// ╔══════════════════════════════════════════════════════════════════╗
// ║  HamTed Service Worker — PWA offline + hız                          ║
// ║  Navigasyon: network-first (taze içerik, çevrimdışı → app-shell).   ║
// ║  Statik varlık (JS/CSS/img/font): cache-first.                      ║
// ║  Supabase/API çağrıları: ASLA cache'lenmez (taze veri).            ║
// ╚══════════════════════════════════════════════════════════════════╝

const VERSION = "hamted-v2";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const APP_SHELL = "/index.html";

// Yeni SW hemen devralsın (kurulumda bekleme yok).
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(["/", APP_SHELL, "/manifest.json", "/logo-icon.png"])).catch(() => {})
  );
  self.skipWaiting();
});

// Eski sürüm cache'lerini temizle.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const isAsset = (url) =>
  /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|gif|webp|ico)$/i.test(url.pathname);

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Sadece kendi origin'imiz. Supabase, tile sunucu, GA vb. → dokunma (ağdan).
  if (url.origin !== self.location.origin) return;

  // Sayfa gezintileri (SPA route'ları): network-first → çevrimdışı app-shell.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(APP_SHELL, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(APP_SHELL).then((r) => r || caches.match("/")))
    );
    return;
  }

  // Statik varlıklar: cache-first, arkada güncelle (stale-while-revalidate).
  if (isAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(request, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
  }
});
