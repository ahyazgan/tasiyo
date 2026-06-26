// ╔══════════════════════════════════════════════════════════════════╗
// ║  "Yazıyor…" sinyali — backend yok; sekmeler arası localStorage ile  ║
// ║  simüle edilir (storage olayı). Tek-son-olay modeli (hafif).        ║
// ║  Supabase realtime gelince setTyping bir kanala publish eder.       ║
// ╚══════════════════════════════════════════════════════════════════╝

const KEY = "hamted_typing";
const TTL = 4000; // ms — bu süre içinde sinyal "aktif" sayılır

// threadKey: "listingId:offerId" · userId: yazan kullanıcı
export function setTyping(threadKey, userId) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ k: String(threadKey), u: String(userId), at: Date.now() }));
  } catch { /* noop */ }
}

// Belirli thread'de, belirli kullanıcı (karşı taraf) şu an yazıyor mu?
export function isTyping(threadKey, otherId) {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || "null");
    if (!s) return false;
    return s.k === String(threadKey) && s.u === String(otherId) && (Date.now() - s.at) < TTL;
  } catch {
    return false;
  }
}
