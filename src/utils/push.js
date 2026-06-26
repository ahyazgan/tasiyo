// ╔══════════════════════════════════════════════════════════════════╗
// ║  Bildirim — native (iOS/Android) gerçek local notification,        ║
// ║  web/PWA'da Web Notifications API. İkisi de yoksa "unsupported".    ║
// ║  (Web Notification API native WebView'da çalışmaz → plugin şart.)   ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

const isNative = Capacitor.isNativePlatform();
const webSupported = typeof window !== "undefined" && "Notification" in window;

export const pushSupported = isNative || webSupported;

// İzin durumu önbelleği — senkron pushPermission() için.
// "default" | "granted" | "denied" | "unsupported"
let cachedPerm = isNative ? "default" : webSupported ? Notification.permission : "unsupported";

// Native'de mevcut izni asenkron öğren, önbelleği güncelle (modül yüklenince).
if (isNative) {
  (async () => {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const res = await LocalNotifications.checkPermissions();
      cachedPerm = res.display === "granted" ? "granted" : res.display === "denied" ? "denied" : "default";
    } catch { /* noop */ }
  })();
}

export function pushPermission() {
  return cachedPerm;
}

// Kullanıcıdan izin ister; sonuç: "granted" | "denied" | "default" | "unsupported"
export async function requestPushPermission() {
  if (isNative) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      const res = await LocalNotifications.requestPermissions();
      cachedPerm = res.display === "granted" ? "granted" : "denied";
      return cachedPerm;
    } catch {
      cachedPerm = "denied";
      return "denied";
    }
  }
  if (!webSupported) return "unsupported";
  try {
    const res = await Notification.requestPermission();
    cachedPerm = res;
    return res;
  } catch {
    cachedPerm = "denied";
    return "denied";
  }
}

let nativeNotifId = 1;

// Tek bir bildirimi gösterir. Native: local notification; Web: Notification.
export async function showPush({ title, body, icon, tag, link } = {}) {
  if (cachedPerm !== "granted") return null;

  // ── Native (iOS/Android) ──
  if (isNative) {
    try {
      const { LocalNotifications } = await import("@capacitor/local-notifications");
      await LocalNotifications.schedule({
        notifications: [{
          id: nativeNotifId++,
          title: title || "YÜKLET",
          body: body || "",
          extra: link ? { link } : undefined,
        }],
      });
    } catch { /* noop */ }
    return null;
  }

  // ── Web/PWA ──
  if (!webSupported || Notification.permission !== "granted") return null;
  // Kullanıcı zaten uygulamaya bakıyorsa (sekme önde) bildirim gösterme.
  if (typeof document !== "undefined" && document.visibilityState === "visible") return null;
  try {
    const n = new Notification(title || "YÜKLET", {
      body: body || "",
      icon: icon || "/favicon.ico",
      badge: "/favicon.ico",
      tag: tag || undefined,
      renotify: false,
    });
    if (link) {
      n.onclick = () => {
        window.focus();
        try { window.location.assign(link); } catch { /* ignore */ }
        n.close();
      };
    }
    return n;
  } catch {
    return null;
  }
}
