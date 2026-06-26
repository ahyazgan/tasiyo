// ╔══════════════════════════════════════════════════════════════════╗
// ║  Boş-dönüş (backhaul) eşleştirme motoru.                           ║
// ║  Amaç: nakliyeci A→B yük taşırken dönüşte boş gitmesin —           ║
// ║  güzergaha uygun "dönüş yükü" işlerini il komşuluğu/bölgesine göre ║
// ║  bulur. Platformun asıl farkı + ağ etkisi motoru.                 ║
// ╚══════════════════════════════════════════════════════════════════╝

import { IL_LIST } from "../data/categories";

// ── Türkçe-duyarsız sadeleştirme ("Istanbul" == "İstanbul") ─────────
const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();

// ── İl komşuluk grafı (IL_LIST içindeki iller; gerçek il sınırlarına yakın) ──
const NEIGHBORS = {
  "İstanbul": ["Kocaeli", "Tekirdağ"],
  "Kocaeli": ["İstanbul", "Sakarya", "Bursa"],
  "Sakarya": ["Kocaeli", "Bursa"],
  "Bursa": ["Kocaeli", "Sakarya", "Balıkesir", "Eskişehir"],
  "Tekirdağ": ["İstanbul"],
  "Balıkesir": ["Bursa", "İzmir"],
  "İzmir": ["Balıkesir"],
  "Eskişehir": ["Bursa", "Ankara"],
  "Ankara": ["Eskişehir", "Konya", "Kayseri"],
  "Konya": ["Ankara", "Antalya", "Mersin"],
  "Kayseri": ["Ankara", "Adana", "Malatya"],
  "Antalya": ["Konya"],
  "Mersin": ["Adana", "Konya"],
  "Adana": ["Mersin", "Kayseri", "Gaziantep"],
  "Gaziantep": ["Adana", "Şanlıurfa", "Malatya"],
  "Şanlıurfa": ["Gaziantep", "Diyarbakır"],
  "Diyarbakır": ["Şanlıurfa", "Malatya"],
  "Malatya": ["Kayseri", "Gaziantep", "Diyarbakır"],
  "Samsun": ["Trabzon"],
  "Trabzon": ["Samsun"],
};
const REGION = {
  Marmara: ["İstanbul", "Kocaeli", "Bursa", "Sakarya", "Tekirdağ", "Balıkesir"],
  Ege: ["İzmir", "Balıkesir"],
  "İç Anadolu": ["Ankara", "Konya", "Kayseri", "Eskişehir"],
  Akdeniz: ["Antalya", "Adana", "Mersin"],
  "Güneydoğu": ["Gaziantep", "Şanlıurfa", "Diyarbakır", "Malatya"],
  Karadeniz: ["Samsun", "Trabzon"],
};
const regionOf = (il) => Object.keys(REGION).find((r) => REGION[r].includes(il)) || null;

// ── İlçe/yer → il sözlüğü (demo + yaygın yerler) ────────────────────
const PLACE_TO_IL = {
  // İstanbul
  samandira: "İstanbul", dudullu: "İstanbul", pendik: "İstanbul", umraniye: "İstanbul", kartal: "İstanbul", tuzla: "İstanbul", maltepe: "İstanbul", atasehir: "İstanbul", basaksehir: "İstanbul", esenyurt: "İstanbul", hadimkoy: "İstanbul",
  // Kocaeli
  gebze: "Kocaeli", cayirova: "Kocaeli", korfez: "Kocaeli", golcuk: "Kocaeli", izmit: "Kocaeli", dilovasi: "Kocaeli", darica: "Kocaeli",
  // Bursa
  nilufer: "Bursa", osmangazi: "Bursa", yildirim: "Bursa", inegol: "Bursa", gemlik: "Bursa", mudanya: "Bursa",
  // Ankara
  eryaman: "Ankara", etimesgut: "Ankara", sincan: "Ankara", cankaya: "Ankara", kecioren: "Ankara", polatli: "Ankara", yenimahalle: "Ankara",
  // İzmir
  aliaga: "İzmir", kemalpasa: "İzmir", bornova: "İzmir", cigli: "İzmir", torbali: "İzmir", menemen: "İzmir", gaziemir: "İzmir",
  // Diğer
  adapazari: "Sakarya", serdivan: "Sakarya", corlu: "Tekirdağ", cerkezkoy: "Tekirdağ", bandirma: "Balıkesir", edremit: "Balıkesir",
};

// Canonical il adı (IL_LIST'ten) bul
const canonIl = (text) => {
  if (!text) return null;
  const f = fold(text);
  // tam il adı geçiyor mu
  const direct = IL_LIST.find((il) => f.includes(fold(il)));
  if (direct) return direct;
  // ilçe/yer sözlüğü
  for (const key of Object.keys(PLACE_TO_IL)) if (f.includes(key)) return PLACE_TO_IL[key];
  return null;
};

// İlandan güzergah çıkar { fromIl, toIl }
export function routeOf(l) {
  const fromIl = canonIl(l.il) || canonIl(l.yukleme) || null;
  if (l.type === "arac") return { fromIl, toIl: fromIl }; // araç bir noktada müsait
  // Net 'varisIl' alanı varsa öncelik onun; yoksa serbest metinden tahmin
  const toIl = canonIl(l.varisIl) || canonIl(l.bosaltma) || canonIl(l.title) || fromIl;
  return { fromIl, toIl };
}

// İki il arası yakınlık: 0 aynı · 1 komşu · 2 aynı bölge · 3 uzak
export function ilDistance(a, b) {
  if (!a || !b) return 3;
  if (a === b) return 0;
  if ((NEIGHBORS[a] || []).includes(b)) return 1;
  if (regionOf(a) && regionOf(a) === regionOf(b)) return 2;
  return 3;
}

const FIT = { 0: "Aynı il", 1: "Çok uygun", 2: "Uygun" };

// ── Araç tipi / kapasite uyumu ──────────────────────────────
// Kategori = araç sınıfı: hafriyat -> açık damper, silobas -> kapalı silobas/tanker.
// (Damperli kamyon dökme çimento taşıyamaz; bu yüzden kategori = araç uyumu.)
export const vehicleClassOf = (l) => {
  if (l?.vehicle) {
    const f = fold(l.vehicle);
    if (f.includes("silobas") || f.includes("tanker")) return "Silobas / Tanker";
    if (f.includes("damper")) return "Damperli";
  }
  return l?.cat === "silobas" ? "Silobas / Tanker" : "Damperli";
};
// "18 ton" -> 18 ; "30 ton" -> 30
export const parseTons = (str) => {
  const m = String(str || "").match(/(\d+(?:[.,]\d+)?)/);
  return m ? parseFloat(m[1].replace(",", ".")) : null;
};
// Aralıktan azami kapasite: "Damperli kamyon (15–18 t)" -> 18
export const capacityTonOf = (str) => {
  const nums = String(str || "").match(/\d+(?:[.,]\d+)?/g);
  return nums ? Math.max(...nums.map((n) => parseFloat(n.replace(",", ".")))) : null;
};
// Araç bu işi kaç seferde taşır (kaba tahmin; ton/m³ için). capacityStr boşsa araç adından da okur.
export const estimateTrips = (jobAmount, jobUnit, capacityStr) => {
  const cap = capacityTonOf(capacityStr);
  if (!cap || !jobAmount || (jobUnit && jobUnit !== "ton" && jobUnit !== "m³")) return null;
  return Math.max(1, Math.ceil(jobAmount / cap));
};

// "is" işi için dönüş yükü zinciri: bu işi alan araç, B noktasında
// (boşaltma ili) yeni bir yük bulabilir mi?
export function backhaulForJob(job, all, limit = 3) {
  if (!job) return [];
  const r = routeOf(job);
  if (!r.toIl) return [];
  return all
    .filter((x) => x.type === "is" && x.id !== job.id && x.status !== "kapali" && (!job.ownerId || x.ownerId !== job.ownerId))
    .map((x) => {
      const xr = routeOf(x);
      const d = ilDistance(r.toIl, xr.fromIl);           // dönüşte yükü alabilir mi
      const back = ilDistance(xr.toIl, r.fromIl) <= 1 ? 1 : 0; // tam tur bonusu (eve döner)
      const sameCat = x.cat === job.cat ? 0 : 0.4;        // ayni arac tipi tercih (damper != silobas)
      return { listing: x, fromIl: xr.fromIl, toIl: xr.toIl, dist: d, score: d - back * 0.5 + sameCat, roundTrip: back === 1, sameCat: x.cat === job.cat };
    })
    .filter((m) => m.dist <= 2)
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map((m) => ({ ...m, fit: FIT[m.dist] || "Uygun" }));
}

// "arac" ilanı için: araç buradayken alabileceği yakın yükler (araç tipi uyumlu)
export function loadsForVehicle(arac, all, limit = 3) {
  if (!arac) return [];
  const vIl = routeOf(arac).fromIl;
  if (!vIl) return [];
  return all
    .filter((x) => x.type === "is" && x.status !== "kapali" && x.cat === arac.cat) // ayni arac sinifi
    .map((x) => {
      const xr = routeOf(x);
      const d = ilDistance(vIl, xr.fromIl);
      return { listing: x, fromIl: xr.fromIl, toIl: xr.toIl, dist: d, trips: estimateTrips(x.amount, x.unit, arac.capacity || arac.vehicle) };
    })
    .filter((m) => m.dist <= 2)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((m) => ({ ...m, fit: FIT[m.dist] || "Uygun" }));
}

// Belirli bir il referansıyla yakın iş yükleri (İlanlar 'dönüş yükü' filtresi + ana sayfa widget)
export function loadsNearCity(il, all, { cat = null, maxDist = 2, limit = 20 } = {}) {
  const ref = canonIl(il);
  if (!ref) return [];
  return all
    .filter((x) => x.type === "is" && x.status !== "kapali" && (!cat || x.cat === cat))
    .map((x) => {
      const xr = routeOf(x);
      const d = ilDistance(ref, xr.fromIl);
      return { listing: x, fromIl: xr.fromIl, toIl: xr.toIl, dist: d };
    })
    .filter((m) => m.dist <= maxDist)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((m) => ({ ...m, fit: FIT[m.dist] || "Uygun" }));
}
