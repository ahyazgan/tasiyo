// ╔══════════════════════════════════════════════════════════════════╗
// ║  Sefer kanalı — canlı konum yayını/aboneliği. Transport soyutlaması.║
// ║  ŞİMDİ: localStorage (sekmeler arası demo realtime).                ║
// ║  SONRA: Supabase Realtime kanalına publish/subscribe ile değişir —  ║
// ║  TakipPage arayüzü (publishLocation/subscribeTrip) aynı kalır.      ║
// ╚══════════════════════════════════════════════════════════════════╝

const KEY = "hamted_trip_loc";
const TRAIL_MAX = 80;       // saklanan iz noktası sayısı
const STALE_MS = 45000;     // bu süre güncellenmezse "aktif değil"

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function writeAll(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* noop */ }
  try { window.dispatchEvent(new Event("dayim:trip")); } catch { /* noop */ }
}

export function startTrip(listingId) {
  const all = readAll();
  all[listingId] = { active: true, last: null, trail: [], startedAt: Date.now(), updatedAt: Date.now() };
  writeAll(all);
}

export function publishLocation(listingId, point) {
  const all = readAll();
  const cur = all[listingId] || { active: true, trail: [], startedAt: Date.now() };
  const trail = [...(cur.trail || []), point].slice(-TRAIL_MAX);
  all[listingId] = { ...cur, active: true, last: point, trail, updatedAt: Date.now() };
  writeAll(all);
}

export function endTrip(listingId) {
  const all = readAll();
  if (all[listingId]) { all[listingId] = { ...all[listingId], active: false, updatedAt: Date.now() }; writeAll(all); }
}

export function getTrip(listingId) {
  const t = readAll()[listingId] || null;
  if (!t) return null;
  const stale = Date.now() - (t.updatedAt || 0) > STALE_MS;
  return { ...t, live: Boolean(t.active) && !stale };
}

// cb(trip) — değişimde ve periyodik olarak çağrılır. Dönüş: aboneliği bırakır.
export function subscribeTrip(listingId, cb) {
  const emit = () => cb(getTrip(listingId));
  emit();
  const iv = setInterval(emit, 3000);
  window.addEventListener("dayim:trip", emit);
  window.addEventListener("storage", emit);
  return () => { clearInterval(iv); window.removeEventListener("dayim:trip", emit); window.removeEventListener("storage", emit); };
}
