function load(key, fallback) {
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fallback; }
  catch { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}
function loadStr(key, fallback) {
  try { return localStorage.getItem(key) || fallback; } catch { return fallback; }
}
function saveStr(key, val) {
  try { localStorage.setItem(key, val); } catch { /* ignore */ }
}

export const loadTheme = () => loadStr("hamted_theme", "light");
export const saveTheme = (v) => saveStr("hamted_theme", v);

// Nakliye platformu
export const loadListings = () => load("hamted_listings", []);
export const saveListings = (v) => save("hamted_listings", v);
export const loadUser = () => load("hamted_user", null);
export const saveUser = (v) => save("hamted_user", v);
export const loadUsers = () => load("hamted_users", []);
export const saveUsers = (v) => save("hamted_users", v);
export const loadOffers = () => load("hamted_offers", []);
export const saveOffers = (v) => save("hamted_offers", v);
export const loadMessages = () => load("hamted_messages", []);
export const saveMessages = (v) => save("hamted_messages", v);
export const loadMsgSeen = () => load("hamted_msg_seen", {});
export const saveMsgSeen = (v) => save("hamted_msg_seen", v);
export const loadNotifSeen = () => load("hamted_notif_seen", {});
export const saveNotifSeen = (v) => save("hamted_notif_seen", v);
export const loadReviews = () => load("hamted_reviews", []);
export const saveReviews = (v) => save("hamted_reviews", v);
export const loadDocs = () => load("hamted_docs", []);
export const saveDocs = (v) => save("hamted_docs", v);
export const loadOnboarded = () => loadStr("hamted_onboarded", "") === "1";
export const saveOnboarded = () => saveStr("hamted_onboarded", "1");
export const loadReports = () => load("hamted_reports", []);
export const saveReports = (v) => save("hamted_reports", v);
export const loadSavedSearches = () => load("hamted_saved_searches", []);
export const saveSavedSearches = (v) => save("hamted_saved_searches", v);
// Favori (kaydedilen) ilanlar — ilan id'lerinin string dizisi.
export const loadFavorites = () => load("hamted_favorites", []);
export const saveFavorites = (v) => save("hamted_favorites", v);
// Son aramalar — serbest metin sorgu geçmişi (en yeni başta, maks 6).
export const loadRecentSearches = () => load("hamted_recent_searches", []);
export const saveRecentSearches = (v) => save("hamted_recent_searches", v);
// Engellenen kullanıcılar — { [blockerId]: [engellenenId, ...] }.
export const loadBlocked = () => load("hamted_blocked", {});
export const saveBlocked = (v) => save("hamted_blocked", v);
// Akıllı Fiyat piyasa ayarları (admin): yakıt endeksi vb. — engine'e geçirilir.
export const loadPricingConfig = () => load("hamted_pricing_config", { fuelIndex: 1.0, feeRate: 0.10 });
export const savePricingConfig = (v) => save("hamted_pricing_config", v);
// Ana sayfa duyuru / kampanya bandi (admin yonetir).
export const loadAnnouncement = () => load("hamted_announcement", { active: false, text: "", tone: "promo" });
export const saveAnnouncement = (v) => save("hamted_announcement", v);
// Admin denetim kaydi (audit log) — kim, ne zaman, ne yapti.
export const loadAuditLog = () => load("hamted_audit_log", []);
export const appendAudit = (entry) => {
  const next = [{ id: Date.now() + "-" + Math.random().toString(36).slice(2, 6), at: new Date().toISOString(), ...entry }, ...loadAuditLog()].slice(0, 200);
  save("hamted_audit_log", next);
  return next;
};
