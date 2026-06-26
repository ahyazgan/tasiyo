// ╔══════════════════════════════════════════════════════════════════╗
// ║  e-İrsaliye (e-Sevk) & e-Fatura belge üreticisi                     ║
// ║  Resmi alanları (ETTN, GTİP, GİB senaryo, KDV) YÜKLET iş verisinden ║
// ║  türetir. Gerçek GİB gönderimi lib/eInvoiceProvider.js'de.          ║
// ╚══════════════════════════════════════════════════════════════════╝

import { splitAmount } from "./payments";

// Taşıma hizmeti KDV oranı (yük taşımacılığı %20)
export const KDV_RATE = 0.20;

// Hafriyat/dökme malzemeye yakın GTİP (Gümrük Tarife) kodları — belge zenginliği için.
const GTIP = {
  hafriyat: "2517.10.10.00.00", // taş kırığı, moloz, çakıl
  silobas: "2523.29.00.00.00",  // çimento (portland) — dökme
};

// Deterministik sahte ETTN (UUID benzeri) — listing+offer+tip'ten. Date/random YOK.
// Gerçek modda entegratör gerçek ETTN döndürür; bu yalnızca mock görünürlük.
function mockEttn(seed) {
  let h = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hex = (n, len) => (n >>> 0).toString(16).padStart(len, "0").slice(-len);
  const a = hex(h, 8);
  const b = hex(h * 7 + 13, 4);
  const c = hex(h * 13 + 7, 4);
  const d = hex(h * 17 + 5, 4);
  const e = hex(h * 19 + 3, 8) + hex(h * 23 + 1, 4);
  return `${a}-${b}-${c}-${d}-${e}`;
}

const pad6 = (n) => String(n).padStart(6, "0");

// ── e-İrsaliye (sevk anında, yük yola çıkarken) ──
// Senaryo: TEMELIRSALIYE / SEVK. KDV yok (irsaliye mal hareketi belgesi).
export function buildEIrsaliye(listing, offer) {
  const seed = `irs-${listing.id}-${offer?.id || 0}`;
  return {
    kind: "e-irsaliye",
    title: "e-İrsaliye (Sevk)",
    no: "HMT-IRS-" + pad6(listing.id),
    ettn: mockEttn(seed),
    senaryo: "TEMELIRSALIYE",
    tip: "SEVK",
    gtip: GTIP[listing.cat] || "",
    gonderen: listing.owner,          // yükü gönderen (iş sahibi)
    tasiyan: offer?.fromUser || "—",  // taşıyan (nakliyeci)
    malzeme: listing.material || listing.cat,
    miktar: listing.amount ? `${listing.amount} ${listing.unit || ""}`.trim() : "—",
    cikis: `${listing.il}${listing.ilce ? " / " + listing.ilce : ""}${listing.yukleme ? " · " + listing.yukleme : ""}`,
    varis: listing.bosaltma || listing.varisIl || "Belirtilen saha",
    arac: listing.vehicle || "—",
  };
}

// ── e-Fatura (iş bitince, taşıma hizmet bedeli) ──
// Nakliyeci -> iş sahibine taşıma hizmeti faturası. KDV %20.
export function buildEFatura(listing, offer) {
  const split = splitAmount(listing.paymentAmount || offer?.price || 0);
  const matrah = split.total;                 // hizmet bedeli (KDV hariç kabul)
  const kdv = Math.round(matrah * KDV_RATE);
  const seed = `fat-${listing.id}-${offer?.id || 0}`;
  return {
    kind: "e-fatura",
    title: "e-Fatura (Taşıma Hizmeti)",
    no: "HMT-FAT-" + pad6(listing.id),
    ettn: mockEttn(seed),
    senaryo: "TEMELFATURA",
    tip: "SATIS",
    saglayan: offer?.fromUser || "—",  // hizmeti veren (nakliyeci)
    alan: listing.owner,                // hizmeti alan (iş sahibi)
    aciklama: `${listing.material || listing.cat} taşıma hizmeti — ${listing.il} → ${listing.bosaltma || listing.varisIl || "saha"}`,
    matrah,
    kdvRate: KDV_RATE,
    kdv,
    toplam: matrah + kdv,
    komisyon: split.fee,                // platform komisyonu (bilgi)
    netNakliyeci: split.payout,
  };
}
