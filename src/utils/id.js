// ── Yerel (localStorage) modda benzersiz id/zaman üretimi. ──
// SB modunda id'leri veritabanı üretir; bunlar yalnızca yerel kayıtlar için.
// Ayrı modülde olması, bileşen render'ının saf (pure) kalmasını sağlar.

export function newId() {
  return Date.now();
}

export function nowIso() {
  return new Date().toISOString();
}
