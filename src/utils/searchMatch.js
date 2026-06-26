// ╔══════════════════════════════════════════════════════════════════╗
// ║  Kaydedilmiş arama ↔ ilan eşleştirme. ListingsPage filtre mantığının ║
// ║  paylaşılabilir özeti (bildirim üretiminde kullanılır).             ║
// ╚══════════════════════════════════════════════════════════════════╝

const norm = (s) => String(s ?? "").toLocaleLowerCase("tr");

// Bir ilan, kaydedilmiş bir aramanın (type/cat/il/material/q/price) kriterlerine uyuyor mu?
export function listingMatchesSearch(l, s) {
  if (!l || !s) return false;
  if (l.status === "kapali") return false;
  if (s.type && s.type !== "all" && l.type !== s.type) return false;
  if (s.cat && s.cat !== "all" && l.cat !== s.cat) return false;
  if (s.il && s.il !== "all" && l.il !== s.il) return false;
  if (s.material && s.material !== "all" && l.material !== s.material) return false;
  const min = s.priceMin ? Number(s.priceMin) : null;
  const max = s.priceMax ? Number(s.priceMax) : null;
  if (min != null && !(l.price != null && l.price >= min)) return false;
  if (max != null && !(l.price != null && l.price <= max)) return false;
  if (s.q) {
    const tokens = norm(s.q).split(/\s+/).filter(Boolean);
    const hay = norm([l.title, l.il, l.ilce, l.material, l.vehicle, l.yukleme, l.bosaltma, l.desc, l.owner].filter(Boolean).join(" "));
    if (!tokens.every((t) => hay.includes(t))) return false;
  }
  return true;
}
