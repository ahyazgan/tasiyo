import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Check, X, MessageSquare, FileText, Phone, RotateCw, Pencil, Lock, Share2, Trash2, ArrowRight, ShieldCheck } from "lucide-react";
import { CATS, STOCK_LEVELS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import { computeReliability, reliabilityTier } from "../utils/reliability";
import { useToast } from "../components/Toast";
import { shareUrl } from "../native/share";
import { hapticTap, hapticSuccess, hapticWarn } from "../native/haptics";
import SEO from "../components/SEO";
import Logo from "../components/Logo";

// ── SAHA İlanlarım — sharp industrial: 2px ink frame, Archivo uppercase, Space Mono data.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#F2C200",
  green: "#16803C",
  red: "#DC2626",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const HEAD = "'Archivo', sans-serif";
const BODY = "'Plus Jakarta Sans', system-ui, sans-serif";

// Tabs map to real listing statuses (project has no draft state).
const TABS = [
  { key: "aktif", label: "Açık İlanlar" },
  { key: "eslesti", label: "Eşleşti" },
  { key: "kapali", label: "Kapalı" },
];

const OFFER_STATUS = {
  beklemede: { label: "BEKLEMEDE", bg: C.yellow, fg: C.ink },
  kabul: { label: "KABUL", bg: C.green, fg: "#fff" },
  ret: { label: "REDDEDİLDİ", bg: C.sub, fg: "#fff" },
};

function fmtDate(iso) {
  try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

function shortId(id) {
  const s = String(id ?? "");
  return "HMT-" + s.slice(-4).toUpperCase().padStart(4, "0");
}

// Onaylanan malzeme siparişinden nakliye (iş) ilanı için ön-doldurma parametreleri.
// Yükleme = tedarikçi konumu; miktar = kabul edilen siparişin qty'si (yoksa ilan miktarı).
function buildHaulParams(l, lOffers = []) {
  const accepted = lOffers.find((o) => o.status === "kabul" && o.kind === "siparis");
  const amount = accepted?.qty != null ? accepted.qty : l.amount;
  const yukleme = [l.il, l.ilce].filter(Boolean).join(" / ");
  const params = new URLSearchParams();
  params.set("type", "is");
  if (l.cat) params.set("cat", l.cat);
  if (l.material || l.title) params.set("title", `${l.material || l.title} Nakliyesi`);
  if (l.il) params.set("il", l.il);
  if (l.ilce) params.set("ilce", l.ilce);
  if (yukleme) params.set("yukleme", yukleme);
  if (l.material) params.set("material", l.material);
  if (amount != null && amount !== "") params.set("amount", String(amount));
  if (l.unit || accepted?.unit) params.set("unit", l.unit || accepted.unit);
  return params.toString();
}

function initial(name) {
  return String(name || "?").trim().charAt(0).toUpperCase() || "?";
}

export default function IlanlarimPage({ listings = [], user, offers = [], reviews = [], onUpdateOffer, onUpdateListing, onDeleteListing, onRequireAuth, getContact }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [tab, setTab] = useState("aktif");
  const [expanded, setExpanded] = useState({}); // listingId -> bool

  if (!user) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 20px", gap: 16, textAlign: "center" }}>
        <SEO title="İlanlarım" description="Açtığınız ilanlar ve gelen teklifler." />
        <Logo size="lg" />
        <h1 style={{ fontFamily: HEAD, fontSize: 21, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.15, margin: 0 }}>İlanlarınızı görmek için giriş yapın</h1>
        <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.sub, margin: 0, maxWidth: 300 }}>Açtığınız ilanları ve gelen teklifleri burada yönetebilirsiniz.</p>
        <button onClick={() => onRequireAuth?.()} style={{ marginTop: 4, cursor: "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", boxShadow: "3px 3px 0 #0A0A0A" }}>
          Giriş yap / Kayıt ol
        </button>
      </div>
    );
  }

  const myListings = listings.filter((l) => l.ownerId && l.ownerId === user.id);
  const counts = {
    aktif: myListings.filter((l) => l.status === "aktif").length,
    eslesti: myListings.filter((l) => l.status === "eslesti").length,
    kapali: myListings.filter((l) => l.status === "kapali").length,
  };
  const visible = myListings.filter((l) => (l.status || "aktif") === tab);

  // ── Actions (functionality preserved 1:1) ──
  const accept = (listing, offer) => {
    onUpdateOffer?.(offer.id, { status: "kabul" });
    onUpdateListing?.(listing.id, { status: "eslesti" });
    hapticSuccess();
    toast("Teklif kabul edildi, ilan eşleşti", "success");
  };
  const reject = (offer) => {
    onUpdateOffer?.(offer.id, { status: "ret" });
    hapticWarn();
    toast("Teklif reddedildi", "info");
  };
  const renew = (l) => {
    onUpdateListing?.(l.id, { status: "aktif", createdText: "az önce" });
    toast("İlan yenilendi ve tekrar yayında", "success");
  };
  const del = (l) => {
    if (window.confirm(`"${l.title}" ilanını silmek istediğinize emin misiniz?`)) {
      onDeleteListing?.(l.id);
      toast("İlan silindi", "info");
    }
  };
  const toggleClose = (l) => onUpdateListing?.(l.id, { status: l.status === "kapali" ? "aktif" : "kapali" });
  const markDelivered = (l) => {
    onUpdateListing?.(l.id, { status: "kapali", delivered: true });
    hapticSuccess();
    toast("Sipariş teslim edildi olarak işaretlendi", "success");
  };
  const toggleExpand = (id) => setExpanded((e) => ({ ...e, [id]: !e[id] }));

  const share = async (l) => {
    hapticTap();
    const url = `${window.location.origin}/ilan/${l.id}`;
    const res = await shareUrl({ title: l.title, text: `${l.title} — YÜKLET`, url });
    if (res === "copied") toast("İlan bağlantısı kopyalandı", "info");
  };

  return (
    <div style={shell}>
      <SEO title="İlanlarım" description="Açtığınız ilanlar ve gelen teklifler. Teklifleri kabul edin veya reddedin." />

      {/* Header */}
      <header style={{ background: C.header, padding: "20px 18px 16px", borderBottom: `2px solid ${C.ink}` }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <h1 style={{ fontFamily: HEAD, fontSize: 27, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, lineHeight: 1, margin: 0 }}>İlanlarım</h1>
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.sub, margin: "6px 0 0" }}>{myListings.length} İLAN · TEKLİFLERİ YÖNET</p>
          </div>
          <button onClick={() => navigate("/ilan-ver")} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 14px", fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", boxShadow: "3px 3px 0 #0A0A0A" }}>
            <Plus size={16} strokeWidth={3} /> Yeni
          </button>
        </div>

        {/* Tabs — 2px framed segmented control, overflow hidden */}
        <div style={{ display: "flex", marginTop: 16, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden" }}>
          {TABS.map((t, i) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1, cursor: "pointer", border: "none",
                  borderLeft: i === 0 ? "none" : `2px solid ${C.ink}`,
                  background: active ? C.ink : "transparent",
                  color: active ? C.yellow : C.sub,
                  padding: "9px 4px", fontFamily: HEAD, fontSize: 11.5, fontWeight: 800,
                  textTransform: "uppercase", letterSpacing: "-0.01em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                {t.label}
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, opacity: active ? 1 : 0.75 }}>· {counts[t.key]}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Content */}
      <main style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 14 }}>
        {myListings.length === 0 ? (
          <EmptyBox text="Henüz ilanınız yok." cta="İlk ilanı verin" onCta={() => navigate("/ilan-ver")} />
        ) : visible.length === 0 ? (
          <EmptyBox text={`Bu sekmede ilan yok (${TABS.find((t) => t.key === tab)?.label}).`} cta="İlan ver" onCta={() => navigate("/ilan-ver")} />
        ) : (
          visible.map((l) => {
            const cat = CATS.find((c) => c.id === l.cat);
            const lOffers = offers.filter((o) => String(o.listingId) === String(l.id));
            const pending = lOffers.filter((o) => o.status === "beklemede");
            const pendingClaims = pending.filter((o) => o.kind === "claim");
            const matched = l.status === "eslesti";
            const closed = l.status === "kapali";
            const isStone = l.cat === "silobas";
            const open = !!expanded[l.id];
            // Lowest offer price (for "En düşük" marker).
            const prices = lOffers.filter((o) => o.kind !== "claim" && o.price != null && o.price !== "").map((o) => Number(o.price));
            const lowest = prices.length ? Math.min(...prices) : null;

            return (
              <article key={l.id} style={{
                background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6,
                overflow: "hidden", boxShadow: "6px 6px 0 rgba(10,10,10,.12)",
                opacity: closed ? 0.78 : 1,
              }}>
                {/* Top block — title + meta, 2px bottom divider */}
                <div style={{ padding: 14, borderBottom: `2px solid ${C.ink}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.faint }}>{shortId(l.id)}</span>
                    {l.type === "urun" && <StatusPill bg={C.card} fg={C.ink} text="ÜRÜN" dot={false} />}
                    {matched && <StatusPill bg={C.green} fg="#fff" text="EŞLEŞTİ" />}
                    {closed && <StatusPill bg={C.sub} fg="#fff" text="KAPALI" />}
                    {!matched && !closed && <StatusPill bg={C.yellow} fg={C.ink} text="AKTİF" />}
                    <span style={{
                      marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 5,
                      borderRadius: 5, padding: "3px 8px", fontFamily: MONO, fontSize: 10.5, fontWeight: 700,
                      background: isStone ? C.ink : C.yellow, color: isStone ? C.yellow : C.ink,
                      border: `2px solid ${C.ink}`, textTransform: "uppercase",
                    }}>
                      <CategoryIcon catId={l.cat} size={13} fallback={cat?.icon} />
                      {cat?.name || l.cat}
                    </span>
                  </div>

                  <h3 onClick={() => navigate(`/ilan/${l.id}`)} style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, margin: "0 0 8px", cursor: "pointer", lineHeight: 1.12 }}>
                    {l.title}
                  </h3>

                  <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                    {(l.type === "urun"
                      ? [
                          l.il ? `${l.il}${l.ilce ? " / " + l.ilce : ""}` : null,
                          l.material || null,
                          l.price ? `₺${Number(l.price).toLocaleString("tr-TR")}${l.priceUnit || "/ton"}` : null,
                          l.stockText || (l.stock ? `${l.stock} stok` : null),
                        ]
                      : [
                          l.il ? `${l.il}${l.ilce ? " / " + l.ilce : ""}` : null,
                          (l.amount != null && l.amount !== "") ? `${l.amount} ${l.unit || ""}`.trim() : null,
                          l.material || null,
                          l.vehicle || null,
                        ]
                    ).filter(Boolean).join(" · ")}
                    {l.type !== "urun" && lOffers.length > 0 && <span style={{ color: C.ink, fontWeight: 700 }}>{" · "}{lOffers.length} TEKLİF</span>}
                  </p>

                  {/* Ürün ilanı: stok kontrolü + gelen sipariş sayısı */}
                  {l.type === "urun" && !closed && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                      <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>Stok:</span>
                      {STOCK_LEVELS.map((s) => {
                        const active = l.stock === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => { onUpdateListing?.(l.id, { stock: s.id, stockText: s.label }); toast(`Stok: ${s.label}`, "success"); }}
                            style={{
                              fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase",
                              padding: "3px 9px", borderRadius: 5, cursor: "pointer",
                              border: `2px solid ${C.ink}`,
                              background: active ? C.ink : C.card,
                              color: active ? C.yellow : C.ink,
                            }}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                      {lOffers.length > 0 && (
                        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", background: C.yellow, color: C.ink, fontFamily: MONO, fontWeight: 700, fontSize: 10.5, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "3px 8px", textTransform: "uppercase" }}>
                          {lOffers.length} SİPARİŞ
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Body */}
                {closed ? (
                  <div style={{ padding: 14, fontFamily: MONO, fontSize: 11.5, color: C.muted }}>
                    İlan kapatıldı · {lOffers.length} teklif alındı
                  </div>
                ) : matched ? (
                  l.type === "urun" ? (
                    l.deliveryIncluded ? (
                      <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ flex: 1, fontFamily: MONO, fontSize: 11.5, color: C.sub }}>Sipariş onaylandı · teslimat sana ait</span>
                        <button onClick={() => markDelivered(l)} style={{ ...btnBase, background: C.green, color: "#fff", borderColor: C.ink }}>
                          <Check size={14} strokeWidth={3} /> Teslim Edildi
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ flex: 1, fontFamily: MONO, fontSize: 11.5, color: C.sub }}>Sipariş onaylandı · nakliyeyi ayarla</span>
                        <button onClick={() => navigate(`/ilan-ver?${buildHaulParams(l, lOffers)}`)} style={{ ...btnBase, background: C.yellow, borderColor: C.ink }}>
                          Nakliye Ayarla <ArrowRight size={14} strokeWidth={2.6} />
                        </button>
                      </div>
                    )
                  ) : (
                    <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ flex: 1, fontFamily: MONO, fontSize: 11.5, color: C.sub }}>İlan eşleşti · iş süreci başladı</span>
                      <button onClick={() => navigate(`/takip/${l.id}`)} style={{ ...btnBase, background: C.card }}>
                        İşi Takip Et <ArrowRight size={14} strokeWidth={2.6} />
                      </button>
                    </div>
                  )
                ) : (
                  <div style={{ padding: 14 }}>
                    {/* Yük kapıldı bandı — kamyoncu Uber usulü yükü aldı, onay bekliyor */}
                    {pendingClaims.length > 0 && (
                      <button
                        onClick={() => { if (!open) toggleExpand(l.id); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, marginBottom: 12, cursor: open ? "default" : "pointer", textAlign: "left", background: C.ink, color: "#fff", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px" }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.yellow, flexShrink: 0 }} />
                        <span style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em" }}>
                          {pendingClaims.length === 1 ? `${pendingClaims[0].fromUser} yükü kaptı` : `${pendingClaims.length} kamyoncu yükü kaptı`}
                        </span>
                        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.yellow }}>
                          {open ? "AŞAĞIDA" : "ONAYLA →"}
                        </span>
                      </button>
                    )}
                    {/* Action row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {pending.length > 0 && (
                        <span style={{ display: "inline-flex", alignItems: "center", background: C.yellow, color: C.ink, fontFamily: MONO, fontWeight: 700, fontSize: 10.5, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "3px 8px" }}>
                          {pending.length} YENİ
                        </span>
                      )}
                      {lOffers.length > 0 ? (
                        <button onClick={() => toggleExpand(l.id)} style={{ ...btnBase, background: C.ink, color: C.yellow, borderColor: C.ink }}>
                          {open ? "Teklifleri Gizle" : "Teklifleri Gör"}
                        </button>
                      ) : (
                        <span style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>Henüz teklif yok</span>
                      )}
                      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                        <IconBtn title="Düzenle" onClick={() => navigate(`/ilan-duzenle/${l.id}`)}><Pencil size={15} strokeWidth={2.2} /></IconBtn>
                        <IconBtn title="Paylaş" onClick={() => share(l)}><Share2 size={15} strokeWidth={2.2} /></IconBtn>
                      </div>
                    </div>

                    {/* Expanded: offers + management */}
                    {open && (
                      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                        {lOffers.length === 0 ? (
                          <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted }}>Bu ilana henüz teklif gelmedi.</div>
                        ) : (
                          lOffers.map((o) => {
                            const s = OFFER_STATUS[o.status] || OFFER_STATUS.beklemede;
                            const contact = getContact?.(o.fromUserId);
                            const oRel = computeReliability(o.fromUserId, { listings, offers, reviews });
                            const isLowest = lowest != null && o.price != null && Number(o.price) === lowest;
                            return (
                              <div key={o.id} style={{ background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 12 }}>
                                {/* Offer header: avatar + name + price */}
                                <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                                  <div style={{ width: 38, height: 38, flexShrink: 0, background: C.ink, color: C.card, border: `2px solid ${C.ink}`, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontSize: 16, fontWeight: 900 }}>
                                    {initial(o.fromUser)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                                      <span style={{ fontFamily: HEAD, fontSize: 13.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>{o.fromUser}</span>
                                      {o.kind === "claim" && o.status === "beklemede" && <StatusPill bg={C.ink} fg={C.yellow} text="YÜK KAPILDI" small />}
                                      <StatusPill bg={s.bg} fg={s.fg} text={s.label} small />
                                      {oRel.score != null && (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: reliabilityTier(oRel.score).color }} title={`Güvenilirlik %${oRel.score} · ${oRel.jobsDone} iş`}>
                                          <ShieldCheck size={11} strokeWidth={2.5} /> %{oRel.score}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ fontFamily: MONO, fontSize: 10.5, color: C.sub, marginTop: 3 }}>
                                      {[
                                        o.fromUserRating != null ? `★ ${o.fromUserRating}` : null,
                                        o.vehicle || (l.vehicle ? l.vehicle : null),
                                      ].filter(Boolean).join(" · ") || fmtDate(o.createdAt)}
                                    </div>
                                  </div>
                                  {o.price != null && o.price !== "" && (
                                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                                      <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.ink }}>
                                        ₺{Number(o.price).toLocaleString("tr-TR")}
                                      </div>
                                      {o.kind === "claim"
                                        ? <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginTop: 1 }}>Sabit fiyat</div>
                                        : isLowest && <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.green, marginTop: 1 }}>En düşük</div>}
                                    </div>
                                  )}
                                </div>

                                {o.qty != null && (
                                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, margin: "9px 0 0", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, background: C.stone, border: `1.5px solid ${C.ink}`, borderRadius: 5, padding: "3px 9px" }}>
                                    İSTENEN: {Number(o.qty).toLocaleString("tr-TR")} {(o.unit || "ton").toUpperCase()}
                                  </div>
                                )}

                                {o.message && <div style={{ fontFamily: BODY, fontSize: 12.5, color: C.sub, margin: "9px 0 0", lineHeight: 1.4 }}>{o.message}</div>}

                                {/* Actions */}
                                {o.status === "beklemede" && !matched && (
                                  <div style={{ display: "flex", gap: 7, marginTop: 11 }}>
                                    <button onClick={() => accept(l, o)} style={{ ...btnBase, flex: 1, background: C.green, color: "#fff", borderColor: C.ink }}>
                                      <Check size={14} strokeWidth={3} /> {o.kind === "siparis" ? "Siparişi Onayla" : o.kind === "claim" ? "Onayla" : "Kabul Et"}
                                    </button>
                                    <button onClick={() => navigate("/mesajlar")} style={{ ...btnBase, background: C.card }}>
                                      <MessageSquare size={14} strokeWidth={2.4} /> Mesaj
                                    </button>
                                    <button onClick={() => reject(o)} style={{ ...btnBase, background: C.card, color: C.red, borderColor: C.ink }}>
                                      <X size={14} strokeWidth={3} /> Ret
                                    </button>
                                  </div>
                                )}

                                {o.status === "kabul" && (
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 11 }}>
                                    {contact?.phone && (
                                      <a href={`tel:${contact.phone}`} style={{ ...btnBase, background: C.card, color: C.green, textDecoration: "none" }}>
                                        <Phone size={13} strokeWidth={2.4} /> {contact.phone}
                                      </a>
                                    )}
                                    <button onClick={() => navigate("/mesajlar")} style={{ ...btnBase, background: C.ink, color: C.yellow, borderColor: C.ink }}>
                                      <MessageSquare size={13} strokeWidth={2.4} /> Mesaj
                                    </button>
                                    <button onClick={() => navigate(`/sozlesme/${o.id}`)} style={{ ...btnBase, background: C.card }}>
                                      <FileText size={13} strokeWidth={2.4} /> Sözleşme
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}

                        {/* Listing management row */}
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7, paddingTop: 2 }}>
                          {!matched && (
                            <button onClick={() => toggleClose(l)} style={{ ...btnBase, background: C.card }}>{closed ? "Tekrar Aç" : "Kapat"}</button>
                          )}
                          {l.recurring && (
                            <button onClick={() => renew(l)} style={{ ...btnBase, background: C.card, color: C.green }}>
                              <RotateCw size={13} strokeWidth={2.4} /> Yenile
                            </button>
                          )}
                          <button onClick={() => del(l)} style={{ ...btnBase, background: C.card, color: C.red, marginLeft: "auto" }}>
                            <Trash2 size={13} strokeWidth={2.4} /> Sil
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}

// ── Shared inline styles ──
const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, display: "flex", flexDirection: "column",
  color: C.ink, fontFamily: BODY,
};

// Base button: 2px ink frame, Archivo uppercase, no soft shadow.
const btnBase = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
  cursor: "pointer", background: C.card, color: C.ink,
  border: `2px solid ${C.ink}`, borderRadius: 6, padding: "8px 12px",
  fontFamily: HEAD, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em",
};

// ── Small components ──
function StatusPill({ bg, fg, text, dot = true, small }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, borderRadius: 5,
      padding: small ? "1px 6px" : "2px 8px", fontFamily: MONO,
      fontSize: small ? 9.5 : 10, fontWeight: 700, letterSpacing: "0.02em",
      background: bg, color: fg, border: `2px solid ${C.ink}`, textTransform: "uppercase",
    }}>
      {dot && <span style={{ width: 5, height: 5, borderRadius: 999, background: fg }} />}
      {text}
    </span>
  );
}

function IconBtn({ children, onClick, title }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 34, height: 34, borderRadius: 6, cursor: "pointer",
      background: C.card, border: `2px solid ${C.ink}`, color: C.ink,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>{children}</button>
  );
}

function EmptyBox({ text, cta, onCta }) {
  return (
    <div style={{
      background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6,
      padding: "48px 24px", textAlign: "center", boxShadow: "6px 6px 0 rgba(10,10,10,.12)",
    }}>
      <p style={{ fontFamily: MONO, fontSize: 12.5, color: C.muted, margin: "0 0 14px" }}>{text}</p>
      <button onClick={onCta} style={{ cursor: "pointer", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 18px", fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", boxShadow: "3px 3px 0 #0A0A0A" }}>
        {cta}
      </button>
    </div>
  );
}
