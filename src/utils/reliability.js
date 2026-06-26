// ╔══════════════════════════════════════════════════════════════════╗
// ║  Güvenilirlik skoru — tamamlanan iş, teslim onay oranı, puan ve     ║
// ║  sefer hacminden türetilir. Veri moat'ının görünür yüzü.           ║
// ║  Saf fonksiyon; listings/offers/reviews'ten hesaplar.              ║
// ╚══════════════════════════════════════════════════════════════════╝

// Dönüş: { score(0-100|null), jobsDone, approvalRate(0-1|null), avgRating,
//          ratingCount, totalTrips, disputes }
export function computeReliability(userId, { listings = [], offers = [], reviews = [] }) {
  if (!userId) return { score: null, jobsDone: 0, approvalRate: null, avgRating: null, ratingCount: 0, totalTrips: 0, disputes: 0 };
  const uid = String(userId);

  // Kullanıcının taraf olduğu işler (sahip veya sürücü).
  const involved = listings.filter((l) => {
    const acc = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
    return String(l.ownerId) === uid || (acc && String(acc.fromUserId) === uid);
  });

  const done = involved.filter((l) => l.status === "kapali" || l.phase === "teslim");
  const withProof = involved.filter((l) => l.deliveryProof);
  const approved = withProof.filter((l) => l.deliveryProof.status === "onay").length;
  const disputed = withProof.filter((l) => l.deliveryProof.status === "itiraz").length;
  const totalTrips = involved.reduce((s, l) => s + (l.tripsDone || 0), 0);

  const rs = reviews.filter((r) => String(r.toId) === uid);
  const avgRating = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : null;

  const jobsDone = done.length;
  const decided = approved + disputed;
  const approvalRate = decided > 0 ? approved / decided : null;

  // Skor: puan %45 · teslim onayı %40 · hacim güveni %15.
  let score = null;
  if (jobsDone > 0 || rs.length > 0) {
    const rPart = avgRating != null ? avgRating / 5 : 0.85;     // veri yoksa nötr-iyi
    const aPart = approvalRate != null ? approvalRate : 0.9;
    const vPart = Math.min(1, jobsDone / 10);                   // 10 işte tam hacim güveni
    score = Math.round((rPart * 0.45 + aPart * 0.4 + vPart * 0.15) * 100);
  }

  return { score, jobsDone, approvalRate, avgRating, ratingCount: rs.length, totalTrips, disputes: disputed };
}

// Skora göre etiket + renk.
export function reliabilityTier(score) {
  if (score == null) return { label: "Yeni", color: "#9A968D" };
  if (score >= 90) return { label: "Mükemmel", color: "#16803C" };
  if (score >= 75) return { label: "Güvenilir", color: "#16803C" };
  if (score >= 55) return { label: "Orta", color: "#92600A" };
  return { label: "Düşük", color: "#DC2626" };
}
