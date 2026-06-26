// ── Service Worker kaydı. Yalnızca production'da (dev'de HMR'ı bozmasın). ──

export function registerSW() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (!import.meta.env.PROD) return; // dev'de kayıt yok

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.warn("SW kaydı başarısız:", err);
    });
  });
}
