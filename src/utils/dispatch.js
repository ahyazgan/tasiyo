// ╔══════════════════════════════════════════════════════════════════╗
// ║  Çağrı (dispatch ping) kanalı — müteahhitin çevrimiçi bir sürücüyü ║
// ║  doğrudan işe çağırması. Uber'in "sürücüye istek düşer → kabul/ret"║
// ║  dinamiği. ŞİMDİ localStorage (sekmeler arası demo realtime),       ║
// ║  SONRA Supabase Realtime — arayüz (sendPing/respondPing/subscribe) ║
// ║  aynı kalır.                                                        ║
// ╚══════════════════════════════════════════════════════════════════╝

const KEY = "hamted_dispatch";
export const RING_MS = 60000;      // çağrı bu süre içinde yanıtlanmazsa düşer
const MAX = 200;                   // saklanan çağrı sayısı tavanı

function readAll() {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function writeAll(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX))); } catch { /* noop */ }
  try { window.dispatchEvent(new Event("dayim:dispatch")); } catch { /* noop */ }
}

const genId = () => "png_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const isExpired = (p) => p.status === "ringing" && Date.now() - (p.createdAt || 0) > RING_MS;
// Bayat "ringing" çağrıları okurken "expired" gibi davranır (depoyu kirletmeden).
const view = (p) => (isExpired(p) ? { ...p, status: "expired" } : p);

// Çağrı gönder. p: { listingId, jobTitle, jobCat, fromId, fromName, toId, toName,
//                    price, priceType, originIl, dist }
export function sendPing(p) {
  const all = readAll()
    // aynı sürücüye aynı iş için çalan eski çağrıyı iptal et (tek aktif çağrı)
    .map((x) => (x.status === "ringing" && String(x.toId) === String(p.toId) && String(x.listingId) === String(p.listingId)
      ? { ...x, status: "cancelled", updatedAt: Date.now() } : x));
  const ping = { ...p, id: genId(), status: "ringing", createdAt: Date.now(), updatedAt: Date.now() };
  writeAll([ping, ...all]);
  return ping;
}

export function respondPing(id, status) {
  const all = readAll().map((p) => (String(p.id) === String(id) ? { ...p, status, updatedAt: Date.now() } : p));
  writeAll(all);
}

export const cancelPing = (id) => respondPing(id, "cancelled");

// Bir sürücüye düşen aktif (çalan, bayatlamamış) çağrı — en yenisi.
export function getActivePingForDriver(driverId) {
  if (driverId == null) return null;
  return readAll()
    .filter((p) => String(p.toId) === String(driverId) && p.status === "ringing" && !isExpired(p))
    .sort((a, b) => b.createdAt - a.createdAt)[0] || null;
}

// Bir kullanıcının gönderdiği çağrılar (müteahhit radarında durum göstergesi için).
export function getPingsFromUser(userId) {
  if (userId == null) return [];
  return readAll().filter((p) => String(p.fromId) === String(userId)).map(view);
}

// cb() — değişimde ve periyodik olarak çağrılır. Dönüş: aboneliği bırakır.
export function subscribeDispatch(cb) {
  cb();
  const iv = setInterval(cb, 2000);
  window.addEventListener("dayim:dispatch", cb);
  window.addEventListener("storage", cb);
  return () => { clearInterval(iv); window.removeEventListener("dayim:dispatch", cb); window.removeEventListener("storage", cb); };
}
