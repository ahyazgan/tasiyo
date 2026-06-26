// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET Ödeme & Escrow (emanet) mantığı                            ║
// ║  Para akışı: müteahhit emanete öder → bloke → teslimde nakliyeciye ║
// ║  serbest. Platform komisyonu keser. Oran DİNAMİK (panelden ayar).  ║
// ╚══════════════════════════════════════════════════════════════════╝

// Varsayılan platform komisyonu — nakliyeciden kesilir (Uber Freight modeli).
// Tek bir sabite gömülü değil: ileride üyelik/kampanya ile değişebilir.
export const DEFAULT_FEE_RATE = 0.10; // %10

// Escrow durumları
export const PAYMENT_STATUS = {
  NONE: "yok",          // henüz ödeme başlamadı
  HELD: "bloke",        // müteahhit ödedi, para emanette
  RELEASED: "serbest",  // teslim onaylandı, nakliyeciye ödendi
  REFUNDED: "iade",     // anlaşmazlık → müteahhite iade
};

export const PAYMENT_LABEL = {
  yok: "Ödeme bekleniyor",
  bloke: "Emanette (bloke)",
  serbest: "Nakliyeciye ödendi",
  iade: "İade edildi",
};

// Tutarı komisyona böler. amount = işin toplam bedeli (₺).
export function splitAmount(amount, feeRate = DEFAULT_FEE_RATE) {
  const total = Math.max(0, Math.round(Number(amount) || 0));
  const fee = Math.round(total * feeRate);          // platform payı
  const payout = total - fee;                        // nakliyecinin eline geçen
  return { total, fee, payout, feeRate };
}

// Bir teklif/iş için ödenecek tutarı belirler (kabul edilen teklif > sabit fiyat).
export function payableAmount(listing, acceptedOffer) {
  if (acceptedOffer?.price) return Number(acceptedOffer.price);
  if (listing?.priceType === "sabit" && listing?.price) return Number(listing.price);
  return 0;
}

export const fmtTL = (n) =>
  "₺" + (Math.round(Number(n) || 0)).toLocaleString("tr-TR");

// ── Hızlı Ödeme (erken hakediş / faktoring) ──────────────────────────
// Teslim onaylandıktan sonra nakliyeci, müteahhitin serbest bırakmasını
// beklemeden hakedişini platformdan ANINDA alır. Platform küçük bir
// erken-ödeme ücreti keser ve sonra emanetten tahsil eder (finansman geliri).
export const EARLY_PAY_FEE_RATE = 0.02; // %2

// payout = nakliyecinin normalde eline geçecek tutar (komisyon sonrası).
// Döner: { fee, net } — net = hemen alacağı tutar.
export function earlyPayout(payout, rate = EARLY_PAY_FEE_RATE) {
  const base = Math.max(0, Math.round(Number(payout) || 0));
  const fee = Math.round(base * rate);
  return { fee, net: base - fee, rate };
}
