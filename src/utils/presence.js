// ╔══════════════════════════════════════════════════════════════════╗
// ║  Canlı varlık (presence) kanalı — çevrimiçi nakliyecilerin konum   ║
// ║  yayını. Uber'in "yakındaki sürücüler" dinamiğinin temel katmanı.  ║
// ║  ŞİMDİ: localStorage (sekmeler arası demo realtime).                ║
// ║  SONRA: Supabase Realtime presence kanalı — arayüz (publishPresence/║
// ║  subscribeOnline) aynı kalır, sadece transport değişir.            ║
// ╚══════════════════════════════════════════════════════════════════╝

const KEY = "hamted_presence";
const STALE_MS = 45000; // bu süre güncellenmezse "çevrimdışı" sayılır

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
function writeAll(obj) {
  try { localStorage.setItem(KEY, JSON.stringify(obj)); } catch { /* noop */ }
  try { window.dispatchEvent(new Event("dayim:presence")); } catch { /* noop */ }
}

// Sürücü çevrimiçi olur / konumunu günceller (heartbeat).
// data: { id, name, cat, capacity, rating, lat, lng, heading?, target? }
export function publishPresence(data) {
  if (!data || data.id == null || !Number.isFinite(data.lat) || !Number.isFinite(data.lng)) return;
  const all = readAll();
  all[String(data.id)] = { ...data, id: String(data.id), updatedAt: Date.now() };
  writeAll(all);
}

// Sürücü çevrimdışı olur (kaydı siler).
export function removePresence(id) {
  if (id == null) return;
  const all = readAll();
  if (all[String(id)]) { delete all[String(id)]; writeAll(all); }
}

// Çevrimiçi (bayat olmayan) tüm sürücüler. exceptId verilirse onu hariç tutar.
export function getOnlineDrivers(exceptId = null) {
  const all = readAll();
  const now = Date.now();
  return Object.values(all)
    .filter((d) => d && now - (d.updatedAt || 0) <= STALE_MS)
    .filter((d) => exceptId == null || String(d.id) !== String(exceptId));
}

// cb(drivers[]) — değişimde ve periyodik olarak çağrılır. Dönüş: aboneliği bırakır.
export function subscribeOnline(cb, exceptId = null) {
  const emit = () => cb(getOnlineDrivers(exceptId));
  emit();
  const iv = setInterval(emit, 3000);
  window.addEventListener("dayim:presence", emit);
  window.addEventListener("storage", emit);
  return () => { clearInterval(iv); window.removeEventListener("dayim:presence", emit); window.removeEventListener("storage", emit); };
}
