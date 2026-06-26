// ╔══════════════════════════════════════════════════════════════════╗
// ║  Konum — native'de @capacitor/geolocation, web'de navigator.geo.   ║
// ║  watchPosition(cb): { lat,lng,speed,heading,accuracy,at } akıtır.  ║
// ║  Dönüş: izlemeyi durduran fonksiyon. İzin reddinde sessiz biter.   ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

// İki [lat,lng] arası mesafe (km, yuvarlamasız) — geofence için hassas.
export function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b[0] - a[0]), dLng = toR(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const toPoint = (pos) => ({
  lat: pos.coords.latitude,
  lng: pos.coords.longitude,
  speed: pos.coords.speed ?? null,        // m/s
  heading: pos.coords.heading ?? null,    // derece
  accuracy: pos.coords.accuracy ?? null,  // m
  at: Date.now(),
});

// Tek seferlik konum (teslim kanıtı için). Hata/izinsizde null.
export async function getCurrentPosition() {
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const perm = await Geolocation.requestPermissions().catch(() => null);
      if (perm && perm.location === "denied") return null;
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
      return toPoint(pos);
    } catch { return null; }
  }
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(toPoint(pos)),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }
  return null;
}

export async function watchPosition(onPoint, onError) {
  // ── Native (iOS/Android) ──
  if (Capacitor.isNativePlatform()) {
    try {
      const { Geolocation } = await import("@capacitor/geolocation");
      const perm = await Geolocation.requestPermissions().catch(() => null);
      if (perm && perm.location === "denied") { onError?.("denied"); return () => {}; }
      const id = await Geolocation.watchPosition(
        { enableHighAccuracy: true, timeout: 15000 },
        (pos, err) => { if (err) { onError?.(err); return; } if (pos) onPoint(toPoint(pos)); }
      );
      return () => { try { Geolocation.clearWatch({ id }); } catch { /* noop */ } };
    } catch (e) {
      onError?.(e);
      return () => {};
    }
  }

  // ── Web/PWA ──
  if (typeof navigator !== "undefined" && navigator.geolocation) {
    const id = navigator.geolocation.watchPosition(
      (pos) => onPoint(toPoint(pos)),
      (err) => onError?.(err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }
  onError?.("unsupported");
  return () => {};
}
