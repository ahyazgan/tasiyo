// ╔══════════════════════════════════════════════════════════════════╗
// ║  Bildirim üretici — mevcut teklif/mesaj/ilan state'inden            ║
// ║  kullanıcıya özel bildirim listesi türetir (ekstra depolama yok).   ║
// ╚══════════════════════════════════════════════════════════════════╝

function fmt(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

import { listingMatchesSearch } from "./searchMatch";

export function buildNotifications(user, { listings = [], offers = [], messages = [], reviews = [], savedSearches = [] }, seenIso) {
  if (!user) return { items: [], unread: 0 };
  const uid = String(user.id);
  const myListingIds = new Set(listings.filter((l) => String(l.ownerId) === uid).map((l) => String(l.id)));
  const titleOf = (lid) => listings.find((l) => String(l.id) === String(lid))?.title || "ilan";

  const items = [];

  for (const o of offers) {
    // İlan sahibine: gelen teklif veya yük kapma (claim)
    if (myListingIds.has(String(o.listingId)) && String(o.fromUserId) !== uid) {
      const claim = o.kind === "claim";
      items.push({
        id: `off-${o.id}`, icon: claim ? "🚚" : "📨",
        text: claim
          ? `${o.fromUser}, "${titleOf(o.listingId)}" yükünü kaptı — onayını bekliyor`
          : `${o.fromUser}, "${titleOf(o.listingId)}" ilanınıza ${o.price ? `₺${o.price.toLocaleString("tr-TR")} ` : ""}teklif verdi`,
        time: o.createdAt, link: "/ilanlarim",
      });
    }
    // Teklifi verene: sonuç (kabul/ret)
    if (String(o.fromUserId) === uid && o.status !== "beklemede") {
      items.push({
        id: `res-${o.id}`, icon: o.status === "kabul" ? "✅" : "❌",
        text: `"${titleOf(o.listingId)}" için teklifin ${o.status === "kabul" ? "kabul edildi 🎉" : "reddedildi"}`,
        time: o.updatedAt || o.createdAt, link: o.status === "kabul" ? "/mesajlar" : `/ilan/${o.listingId}`,
      });
    }
  }

  for (const m of messages) {
    if (String(m.toId) === uid) {
      items.push({
        id: `msg-${m.id}`, icon: "💬",
        text: `${m.fromName}: ${m.text.slice(0, 48)}${m.text.length > 48 ? "…" : ""}`,
        time: m.createdAt, link: "/mesajlar",
      });
    }
  }

  // Değerlendirme hatırlatması: tamamlanan işte karşı tarafı henüz puanlamadıysan.
  for (const l of listings) {
    const done = l.status === "kapali" || l.phase === "teslim";
    if (!done) continue;
    const accepted = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
    if (!accepted) continue;
    const ownerId = String(l.ownerId);
    const nakliyeciId = String(accepted.fromUserId);
    // Sadece işin iki tarafına; karşı tarafı belirle.
    let counterpartId = null;
    if (uid === ownerId) counterpartId = nakliyeciId;
    else if (uid === nakliyeciId) counterpartId = ownerId;
    if (!counterpartId || counterpartId === uid) continue;
    const reviewed = reviews.some(
      (r) => String(r.fromId) === uid && String(r.toId) === counterpartId && String(r.listingId) === String(l.id)
    );
    if (reviewed) continue;
    items.push({
      id: `rev-${l.id}`, icon: "⭐",
      text: `"${l.title}" işini değerlendir — deneyimini puanla`,
      time: l.deliveryProof?.reviewedAt || accepted.updatedAt || accepted.createdAt,
      link: `/takip/${l.id}`,
    });
  }

  // Kaydedilmiş arama bildirimi: zaman damgalı (yeni) ilanlar bir aramaya uyarsa.
  // Sadece createdAt'i olan ilanlar (gerçek yeni ilanlar) tetikler; seed veriler değil.
  // Kendi ilanın hariç. Aynı ilan birden çok aramaya uysa tek bildirim.
  if (savedSearches.length) {
    const seenListing = new Set();
    for (const l of listings) {
      if (!l.createdAt || String(l.ownerId) === uid || l.status === "kapali") continue;
      if (seenListing.has(String(l.id))) continue;
      const hit = savedSearches.find((s) => listingMatchesSearch(l, s));
      if (!hit) continue;
      seenListing.add(String(l.id));
      items.push({
        id: `find-${l.id}`, icon: "📨",
        text: `"${hit.label || "kayıtlı arama"}" aramana uygun yeni ilan: ${l.title}`,
        time: l.createdAt, link: `/ilan/${l.id}`,
      });
    }
  }

  items.sort((a, b) => (b.time || "").localeCompare(a.time || ""));
  const withRead = items.slice(0, 25).map((n) => ({
    ...n, read: seenIso ? (n.time || "") <= seenIso : false, fmtTime: fmt(n.time),
  }));
  const unread = withRead.filter((n) => !n.read).length;
  return { items: withRead, unread };
}
