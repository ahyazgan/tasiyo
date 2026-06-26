// ╔══════════════════════════════════════════════════════════════════╗
// ║  Uygulama içi sürüm uyarısı — uzaktaki app-version.json ile         ║
// ║  yeni sürüm kontrolü. Hata/erişimsizlikte sessizce null döner.     ║
// ║  Sürüm çıktıkça yuklet.co/app-version.json güncellenir.            ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

// Native versionName/CFBundleShortVersionString ile EŞ tutulmalı (şu an 1.0.0).
export const APP_VERSION = "1.0.0";

// Uzak sürüm bildirimi. Örnek içerik için public/app-version.json'a bakın.
const VERSION_URL = "https://yuklet.co/app-version.json";

// "1.2.0" vs "1.0.3" → -1 | 0 | 1
function cmpVersion(a, b) {
  const pa = String(a).split(".").map((n) => parseInt(n, 10) || 0);
  const pb = String(b).split(".").map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
}

// { updateAvailable, forced, latest, storeUrl } veya null.
export async function checkForUpdate() {
  try {
    const res = await fetch(VERSION_URL, { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const latest = String(data.latest || "");
    if (!latest) return null;
    const platform = Capacitor.getPlatform(); // ios | android | web
    const storeUrl = (platform === "ios" ? data.iosUrl : platform === "android" ? data.androidUrl : data.url) || data.url || null;
    return {
      updateAvailable: cmpVersion(latest, APP_VERSION) > 0,
      forced: data.min ? cmpVersion(data.min, APP_VERSION) > 0 : false, // zorunlu güncelleme
      latest,
      storeUrl,
    };
  } catch {
    return null;
  }
}
