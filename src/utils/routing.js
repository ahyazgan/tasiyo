// ╔══════════════════════════════════════════════════════════════════╗
// ║  Yol rotası + ETA — gerçek karayolu rotası (OSRM).                  ║
// ║  getRoute(from,to): yol geometrisi + mesafe(km) + süre(dk).         ║
// ║  Hata/erişimsizlikte null → çağıran taraf haversine'e düşer.        ║
// ║  Demo: router.project-osrm.org (rate-limited). Üretimde kendi OSRM/ ║
// ║  Mapbox/ORS endpoint'inle ROUTE_BASE'i değiştir.                    ║
// ╚══════════════════════════════════════════════════════════════════╝

const ROUTE_BASE = "https://router.project-osrm.org/route/v1/driving";

// Basit önbellek (aynı koordinatlara tekrar tekrar istek atma).
const cache = new Map();
const key = (a, b) => `${a[0].toFixed(3)},${a[1].toFixed(3)};${b[0].toFixed(3)},${b[1].toFixed(3)}`;

// from,to: [lat,lng]. Dönüş: { coords:[[lat,lng]...], distanceKm, durationMin } | null
export async function getRoute(from, to) {
  if (!from || !to) return null;
  const k = key(from, to);
  if (cache.has(k)) return cache.get(k);
  try {
    const url = `${ROUTE_BASE}/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const r = data?.routes?.[0];
    if (!r?.geometry?.coordinates) return null;
    const out = {
      coords: r.geometry.coordinates.map(([lng, lat]) => [lat, lng]), // GeoJSON [lng,lat] → [lat,lng]
      distanceKm: r.distance / 1000,
      durationMin: Math.max(1, Math.round(r.duration / 60)),
    };
    cache.set(k, out);
    return out;
  } catch {
    return null;
  }
}
