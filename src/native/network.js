// ╔══════════════════════════════════════════════════════════════════╗
// ║  Ağ durumu — native'de @capacitor/network, web'de navigator.onLine.║
// ║  onNetworkChange(cb): bağlantı değişince cb(online:boolean) çağrılır.║
// ║  Dönüş: aboneliği iptal eden fonksiyon.                            ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

// Mevcut durumu en iyi tahminle döndür (senkron).
export function isOnlineNow() {
  if (typeof navigator !== "undefined" && "onLine" in navigator) return navigator.onLine;
  return true;
}

export function onNetworkChange(cb) {
  // Native: Capacitor Network plugin (gerçek bağlantı tipi/durumu).
  if (Capacitor.isNativePlatform()) {
    let remove = () => {};
    (async () => {
      try {
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();
        cb(status.connected);
        const handle = await Network.addListener("networkStatusChange", (s) => cb(s.connected));
        remove = () => handle.remove();
      } catch {
        // Plugin yoksa web olaylarına düş.
        const on = () => cb(true);
        const off = () => cb(false);
        window.addEventListener("online", on);
        window.addEventListener("offline", off);
        remove = () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
      }
    })();
    return () => remove();
  }

  // Web/PWA: online/offline olayları.
  const on = () => cb(true);
  const off = () => cb(false);
  window.addEventListener("online", on);
  window.addEventListener("offline", off);
  return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
}
