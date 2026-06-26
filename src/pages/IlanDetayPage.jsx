// YÜKLET — Ilan Detay (SAHA visual language).
// Visual: SAHA signature — 2px ink borders, hard offset shadows (no blur),
// Archivo uppercase headings, Space Mono data, stroke icons. Vehicle variant
// gets the dark spec band + "yakın işler" card.
// Functionality preserved 1:1:
// offer submit, owner/closed/guest states, price estimate, backhaul,
// incoming offers list, report modal, share. Bottom tab bar is GLOBAL
// (App.jsx <MobileTabBar>) — this page only leaves bottom padding.

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Share2, Heart, Star, BadgeCheck, ArrowRight, X, Send, AlertTriangle, Truck, TrendingUp, TrendingDown, Boxes, Check, Info, ChevronDown, ShieldCheck } from "lucide-react";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import { computeReliability, reliabilityTier } from "../utils/reliability";
import { backhaulForJob, loadsForVehicle, vehicleClassOf } from "../utils/backhaul";
import { estimatePrice, fmtTL, priceSignal } from "../utils/priceEstimate";
import { loadPricingConfig } from "../utils/storage";
import { newId, nowIso } from "../utils/id";
import { useToast } from "../components/Toast";
import { shareUrl } from "../native/share";
import { hapticTap, hapticSuccess } from "../native/haptics";
import useFavorites from "../hooks/useFavorites";
import ReportModal from "../components/ReportModal";
import ProfitCalc from "../components/ProfitCalc";
import { PAYMENTS_ENABLED } from "../config/features";
import SEO from "../components/SEO";

// ── SAHA tokens (inline) ──────────────────────────────────────────
const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", yellowDeep: "#E0B400",
  green: "#16803C", red: "#DC2626", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  border: "#E3DDD0", line: "#F0ECE3", sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const HEAD = "'Archivo',system-ui,sans-serif";
const SANS = "'Plus Jakarta Sans',system-ui,sans-serif";

const shell = {
  position: "relative", margin: "0 auto", width: "100%", maxWidth: 460,
  minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: SANS,
  display: "flex", flexDirection: "column",
};

// SAHA card: white, 2px ink border, hard offset shadow, no blur.
const card = {
  background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6,
  boxShadow: "3px 3px 0 rgba(10,10,10,0.10)",
};
const headLabel = {
  fontFamily: HEAD, fontSize: 11, fontWeight: 800, textTransform: "uppercase",
  letterSpacing: "0.04em", color: C.ink,
};

const ilanNo = (id) => "HMT-" + String(id).padStart(4, "0");

const CAT_TAG = {
  hafriyat: { label: "HAFRİYAT", bg: C.ink, fg: C.yellow },
  silobas: { label: "SİLOBAS", bg: C.stone, fg: C.ink, bordered: true },
};
const OFFER_STATUS = {
  beklemede: { label: "BEKLEMEDE", fg: C.ink, bg: C.yellow },
  kabul: { label: "KABUL", fg: "#FFFFFF", bg: C.green },
  ret: { label: "RED", fg: "#FFFFFF", bg: C.muted },
};

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

// ── Route card: ink dot + mono place + bold 2px ink line + arrow + ring ─
function RouteCard({ from, to, km }) {
  return (
    <div style={{ ...card, padding: "16px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {/* origin */}
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: C.ink, flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
          {from || "—"}
        </span>
        {/* bold connecting line + arrow */}
        <span style={{ flex: 1, height: 2, background: C.ink, minWidth: 14 }} />
        <ArrowRight size={16} strokeWidth={2.8} color={C.ink} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, height: 2, background: C.ink, minWidth: 14 }} />
        {/* destination */}
        <span style={{ width: 13, height: 13, borderRadius: "50%", background: C.card, border: `2.5px solid ${C.ink}`, flexShrink: 0 }} />
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", textAlign: "right" }}>
          {to || "—"}
        </span>
      </div>
      {km != null && (
        <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.ink, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "3px 8px" }}>
          ~{km} KM MESAFE
        </div>
      )}
    </div>
  );
}

// ── spec grid cell ────────────────────────────────────────────────
function SpecCell({ label, value, mono }) {
  return (
    <div style={{ ...card, padding: "12px 13px" }}>
      <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: mono ? MONO : HEAD, fontSize: mono ? 13 : 14, fontWeight: mono ? 700 : 800, marginTop: 5, color: C.ink, lineHeight: 1.2, textTransform: mono ? "none" : "uppercase", letterSpacing: mono ? 0 : "-0.01em" }}>
        {value}
      </div>
    </div>
  );
}

// ── full-width detail row (overflow specs that don't fit the grid) ─
function DetailRow({ label, value }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "11px 14px", borderBottom: `1px solid ${C.line}` }}>
      <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</span>
      <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink, textAlign: "right" }}>{value}</span>
    </div>
  );
}

export default function IlanDetayPage({ listings = LISTINGS, user, onRequireAuth, offers = [], reviews = [], onAddOffer, onReport, isBlocked, onToggleBlock }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isFav, toggle: toggleFav } = useFavorites();
  const [price, setPrice] = useState("");
  const [qty, setQty] = useState("");
  const [message, setMessage] = useState("");
  const [showReport, setShowReport] = useState(false);
  const [showSheet, setShowSheet] = useState(false);
  const [sent, setSent] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const l = listings.find((x) => String(x.id) === String(id));

  // ── empty state ──────────────────────────────────────────────────
  if (!l) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 24px 96px" }}>
        <SEO title="İlan bulunamadı" description="Aradığınız ilan bulunamadı." />
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.muted, letterSpacing: "0.08em" }}>404 · KAYIT YOK</div>
        <h1 style={{ fontFamily: HEAD, fontSize: 24, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginTop: 8 }}>İlan bulunamadı</h1>
        <p style={{ fontSize: 13, color: C.sub, marginTop: 6, maxWidth: 280 }}>
          Bu ilan kaldırılmış veya hiç var olmamış olabilir.
        </p>
        <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
          <button onClick={() => navigate(-1)} style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 18px", fontFamily: HEAD, fontWeight: 800, fontSize: 13, textTransform: "uppercase", cursor: "pointer" }}>
            Geri
          </button>
          <button onClick={() => navigate("/ilanlar")} style={{ background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 18px", fontFamily: HEAD, fontWeight: 800, fontSize: 13, textTransform: "uppercase", cursor: "pointer" }}>
            Tüm ilanlar
          </button>
        </div>
      </div>
    );
  }

  // ── derived state (real listing fields) ──────────────────────────
  const cat = CATS.find((c) => c.id === l.cat);
  const tag = CAT_TAG[l.cat] || CAT_TAG.hafriyat;
  const isVehicle = l.type === "arac";
  const isProduct = l.type === "urun";
  const listingOffers = offers.filter((o) => String(o.listingId) === String(l.id));
  const ownerRel = l.ownerId != null ? computeReliability(l.ownerId, { listings, offers, reviews }) : null;
  const isOwner = user && l.ownerId && l.ownerId === user.id;
  const isFixed = l.priceType === "sabit" && l.price;
  const closed = l.status === "kapali" || l.status === "eslesti";
  const backhaul = isProduct ? [] : isVehicle ? loadsForVehicle(l, listings) : backhaulForJob(l, listings);
  // Benzer ilanlar — aynı kategori + tür; aynı il/malzeme öne çıkar. En çok 4.
  const similar = listings
    .filter((x) => String(x.id) !== String(l.id) && x.status !== "kapali" && x.cat === l.cat && x.type === l.type)
    .map((x) => ({ x, score: (x.il === l.il ? 2 : 0) + (x.material && x.material === l.material ? 1 : 0) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.x);
  const est = !isFixed && l.type === "is" && l.amount
    ? estimatePrice({ cat: l.cat, amount: l.amount, unit: l.unit, fromIl: l.il, toIl: l.varisIl, material: l.material, vehicle: l.vehicle, dateText: l.dateText, recurring: l.recurring, kmOverride: l.km, history: { listings, offers }, config: loadPricingConfig() })
    : null;

  // route endpoints (mono labels)
  const fromPlace = `${l.il || "—"}${l.ilce ? ", " + l.ilce : ""}`;
  const toPlace = isVehicle ? (l.il || "—") : (l.varisIl || l.bosaltma || "—");

  // lowest offer for the sticky bar
  const offerPrices = listingOffers.map((o) => o.price).filter((p) => p != null);
  const lowest = offerPrices.length ? Math.min(...offerPrices) : null;

  // ── offer submit (identical logic) ──────────────────────────────
  const submitOffer = () => {
    if (!user) { onRequireAuth?.(); return; }
    if (isProduct) {
      if (!qty && !message.trim()) { toast("Miktar veya mesaj girin", "error"); return; }
    } else if (!price && !message.trim()) {
      toast("Fiyat veya mesaj girin", "error"); return;
    }
    onAddOffer?.({
      id: newId(), listingId: l.id, fromUser: user.name, fromUserId: user.id,
      price: price ? Number(price) : null, message: message.trim(),
      ...(isProduct ? { qty: qty ? Number(qty) : null, unit: l.unit || "ton", kind: "siparis" } : {}),
      status: "beklemede", createdAt: nowIso(),
    });
    setPrice(""); setQty(""); setMessage("");
    setSent(true);
    hapticSuccess();
    toast(isProduct ? "Talebin iletildi" : "Teklifiniz iletildi", "success");
  };

  // open the offer sheet OR route to auth, depending on user
  const openSheet = () => {
    if (!user) { onRequireAuth?.(); return; }
    setSent(false);
    setShowSheet(true);
  };

  const closeSheet = () => { setShowSheet(false); setSent(false); };

  // Paylaş — native paylaşım sayfası (iOS/Android), web'de Web Share / panoya kopyala.
  const onShare = async () => {
    hapticTap();
    const url = typeof window !== "undefined" ? window.location.href : "";
    const res = await shareUrl({ title: l.title, text: `${l.title} — YÜKLET`, url });
    if (res === "copied") toast("Bağlantı kopyalandı", "success");
  };

  // Engelleme durumu (ilan sahibi).
  const blocked = isBlocked ? isBlocked(l.ownerId) : false;
  // Favori (kaydedilen ilan) — kalp ile ekle/çıkar.
  const fav = isFav(l.id);
  const onToggleFav = () => {
    const added = toggleFav(l.id);
    toast(added ? "Favorilere eklendi" : "Favorilerden çıkarıldı", added ? "success" : "info");
  };

  const sheetInput = {
    width: "100%", border: `2px solid ${C.ink}`, borderRadius: 6, background: C.card,
    padding: "12px 14px", fontSize: 14, color: C.ink, fontFamily: SANS, outline: "none", boxSizing: "border-box",
  };

  const iconBtn = {
    width: 38, height: 38, border: `2px solid ${C.ink}`, borderRadius: 6, background: C.card,
    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
  };

  return (
    <div style={{ ...shell, paddingBottom: 120 }}>
      <SEO title={l.title} description={l.desc || `${cat?.name || ""} ilanı - ${l.il}${l.ilce ? " / " + l.ilce : ""}`} />

      {/* ── APP BAR (manila header, 2px bottom rule) ──────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "12px 16px", background: C.header, borderBottom: `2px solid ${C.ink}`, position: "sticky", top: 0, zIndex: 40 }}>
        <button onClick={() => navigate(-1)} aria-label="Geri" style={iconBtn}>
          <ChevronLeft size={20} strokeWidth={2.6} color={C.ink} />
        </button>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.04em", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {ilanNo(l.id)} · İLAN DETAYI
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={onToggleFav} aria-label={fav ? "Favorilerden çıkar" : "Favorilere ekle"} aria-pressed={fav} style={iconBtn}>
            <Heart size={17} strokeWidth={2.4} color={fav ? C.red : C.ink} fill={fav ? C.red : "none"} />
          </button>
          <button onClick={onShare} aria-label="Paylaş" style={iconBtn}>
            <Share2 size={17} strokeWidth={2.4} color={C.ink} />
          </button>
        </div>
      </div>

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 16px 0" }}>

        {/* category badge + status badge + age */}
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
          <span style={{ background: tag.bg, color: tag.fg, border: tag.bordered ? `2px solid ${C.ink}` : "none", fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", padding: tag.bordered ? "3px 8px" : "5px 10px", borderRadius: 5 }}>
            {tag.label}
          </span>
          {l.status === "eslesti" ? (
            <span style={{ background: C.green, color: "#fff", border: `2px solid ${C.ink}`, fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>● EŞLEŞTİ</span>
          ) : l.status === "kapali" ? (
            <span style={{ background: C.muted, color: "#fff", border: `2px solid ${C.ink}`, fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>● KAPALI</span>
          ) : (
            <span style={{ background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, fontFamily: MONO, fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 5 }}>● AKTİF</span>
          )}
          {l.createdText && (
            <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, color: C.faint }}>{l.createdText}</span>
          )}
        </div>

        {/* title */}
        <h1 style={{ fontFamily: HEAD, fontSize: 23, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.12, letterSpacing: "-0.02em", margin: 0 }}>
          {l.title}
        </h1>

        {/* ── PRODUCT: yellow icon band + price/ton + stock ───────── */}
        {isProduct && (
          <div style={{ background: C.ink, borderRadius: 6, border: `2px solid ${C.ink}`, padding: 14, boxShadow: "3px 3px 0 rgba(10,10,10,0.18)", display: "flex", alignItems: "center", gap: 13 }}>
            <span style={{ width: 46, height: 46, borderRadius: 6, background: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Boxes size={24} strokeWidth={2.4} color={C.ink} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: "#9A988E", letterSpacing: "0.06em", textTransform: "uppercase" }}>OCAK / SANTRAL · BİRİM FİYAT</div>
              <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.yellow, marginTop: 3 }}>
                {l.price ? `₺${l.price.toLocaleString("tr-TR")}` : "—"}<span style={{ fontSize: 12, color: "#fff" }}> {l.priceUnit || "/ton"}</span>
              </div>
            </div>
            {l.stock && (
              <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 9, fontWeight: 700, background: l.stock === "az" ? C.red : C.green, color: "#fff", border: `2px solid ${C.ink}`, borderRadius: 5, padding: "4px 8px", textTransform: "uppercase" }}>
                ● {l.stockText || l.stock} STOK
              </span>
            )}
          </div>
        )}

        {/* ── VEHICLE: dark spec band (variant) ───────────────────── */}
        {isVehicle && (
          <div style={{ background: C.ink, borderRadius: 6, border: `2px solid ${C.ink}`, padding: 14, boxShadow: "3px 3px 0 rgba(10,10,10,0.18)", display: "flex", alignItems: "center", gap: 13 }}>
            <span style={{ width: 46, height: 46, borderRadius: 6, background: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Truck size={24} strokeWidth={2.4} color={C.ink} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#fff", lineHeight: 1.15 }}>
                {vehicleClassOf(l)}{l.capacity ? ` · ${l.capacity}` : ""}
              </div>
              {l.plate && (
                <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.yellow, marginTop: 5, letterSpacing: "0.06em" }}>
                  {String(l.plate).toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* route card (ürün ilanında güzergah yok) */}
        {!isProduct && <RouteCard from={fromPlace} to={toPlace} km={l.km != null ? l.km : null} />}

        {/* price estimate badge (teklife açık iş ilanı) */}
        {est && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, alignSelf: "flex-start", background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "7px 12px", boxShadow: "3px 3px 0 rgba(10,10,10,0.10)" }}>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em" }}>TAHMİNİ BÜTÇE</span>
            <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{fmtTL(est.min)} – {fmtTL(est.max)}</span>
          </div>
        )}

        {/* Sefer kâr hesabı (nakliyeci) — iş ilanlarında, mesafe biliniyorsa (PAYMENTS_ENABLED ile gizli) */}
        {PAYMENTS_ENABLED && l.type === "is" && (l.km || est?.km) && (
          <ProfitCalc basePrice={isFixed ? l.price : (est?.mid || 0)} km={l.km || est?.km || 0} vehicle={l.vehicle} />
        )}

        {/* 2x2 spec grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {isProduct ? (
            <>
              <SpecCell label="MALZEME" value={l.material || (cat?.name || "—")} />
              <SpecCell label="BİRİM FİYAT" value={l.price ? `₺${l.price.toLocaleString("tr-TR")} ${l.priceUnit || "/ton"}` : "—"} mono />
              <SpecCell label="STOK" value={l.stockText || l.stock || "—"} />
              <SpecCell label="NAKLİYE" value={l.deliveryIncluded ? "Dahil" : "Hariç"} />
            </>
          ) : isVehicle ? (
            <>
              <SpecCell label="ARAÇ TİPİ" value={l.vehicle || vehicleClassOf(l)} />
              <SpecCell label="KAPASİTE" value={l.capacity || "—"} mono />
              <SpecCell label="MÜSAİTLİK" value={l.dateText || "Belirtilmedi"} mono />
              <SpecCell label="KATEGORİ" value={cat?.name || "—"} />
            </>
          ) : (
            <>
              <SpecCell label="MALZEME" value={l.material || (cat?.name || "—")} />
              <SpecCell label="MİKTAR" value={l.amount ? `${l.amount} ${l.unit || ""}`.trim() : "—"} mono />
              <SpecCell label="TARİH" value={l.dateText || "Belirtilmedi"} mono />
              <SpecCell label="SEFER" value={l.recurring ? (l.recurringText || "Tekrarlı") : "Tek sefer"} />
            </>
          )}
        </div>

        {/* overflow details (only render rows that exist) */}
        <div style={{ ...card, overflow: "hidden", padding: 0 }}>
          <DetailRow label="KONUM" value={`${l.il}${l.ilce ? " / " + l.ilce : ""}`} />
          <DetailRow label="YÜKLEME" value={l.yukleme} />
          <DetailRow label="BOŞALTMA" value={l.bosaltma} />
          {l.type === "is" && <DetailRow label="VARIŞ İLİ" value={l.varisIl} />}
          {l.km != null && <DetailRow label="MESAFE" value={`~${l.km} km`} />}
          <DetailRow label="KAPASİTE" value={l.capacity} />
          {l.recurring && <DetailRow label="TEKRAR" value={l.recurringText} />}
        </div>

        {/* description */}
        {l.desc && (
          <div style={{ ...card, padding: "16px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
              <span style={{ width: 4, height: 14, background: C.yellow, borderRadius: 1 }} />
              <span style={headLabel}>AÇIKLAMA</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: C.sub, margin: 0 }}>{l.desc}</p>
          </div>
        )}

        {/* ── İLAN SAHİBİ ────────────────────────────────────────── */}
        <div style={{ ...card, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 4, height: 14, background: C.yellow, borderRadius: 1 }} />
            <span style={headLabel}>İLAN SAHİBİ</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 6, background: C.ink, color: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: HEAD, fontWeight: 900, fontSize: 19, flexShrink: 0 }}>
              {String(l.owner || "?").charAt(0).toUpperCase()}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: HEAD, fontSize: 15, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.owner || "—"}</span>
                {l.ownerVerified && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.green }}>
                    <BadgeCheck size={13} strokeWidth={2.6} color={C.green} /> ● ONAYLI
                  </span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4, flexWrap: "wrap" }}>
                {l.ownerRating != null && (
                  <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub, display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={12} strokeWidth={2.4} color={C.yellowDeep} fill={C.yellow} />
                    {l.ownerRating}{l.ownerJobs != null ? ` · ${l.ownerJobs} İŞ` : ""}
                  </div>
                )}
                {ownerRel?.score != null && (
                  <div title={`Güvenilirlik %${ownerRel.score} · ${ownerRel.jobsDone} tamamlanan iş`} style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: reliabilityTier(ownerRel.score).color, display: "flex", alignItems: "center", gap: 4 }}>
                    <ShieldCheck size={12} strokeWidth={2.5} /> %{ownerRel.score} · {reliabilityTier(ownerRel.score).label}
                  </div>
                )}
              </div>
            </div>
            <button onClick={() => navigate("/mesajlar")}
              style={{ display: "flex", alignItems: "center", gap: 6, border: `2px solid ${C.ink}`, borderRadius: 6, background: C.yellow, padding: "9px 12px", fontFamily: HEAD, fontWeight: 800, fontSize: 12, textTransform: "uppercase", flexShrink: 0, cursor: "pointer" }}>
              Mesaj
            </button>
          </div>
        </div>

        {/* ── Backhaul / dönüş yükü ──────────────────────────────── */}
        {backhaul.length > 0 && (
          <div style={{ ...card, padding: 15 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ width: 4, height: 14, background: C.yellow, borderRadius: 1 }} />
              <span style={headLabel}>
                {isVehicle ? "BU ARACA UYGUN YAKIN İŞLER" : "DÖNÜŞ YÜKÜ FIRSATI"}
              </span>
              <span style={{ marginLeft: "auto", background: C.yellow, border: `2px solid ${C.ink}`, fontFamily: MONO, fontSize: 8, fontWeight: 700, padding: "1px 6px", borderRadius: 4 }}>YENİ</span>
            </div>
            <p style={{ fontSize: 12, color: C.sub, margin: "0 0 12px", lineHeight: 1.5 }}>
              {isVehicle
                ? `${vehicleClassOf(l)} aracınıza uygun yakın işler (sefer tahmini dahil).`
                : "Bu işi alan araç dönüşte boş gitmesin — güzergaha uygun yükler."}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {backhaul.map((m) => (
                <button key={m.listing.id} onClick={() => navigate(`/ilan/${m.listing.id}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 12, background: C.stone, textAlign: "left", cursor: "pointer", width: "100%" }}>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 5 }}>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, background: C.card, border: `2px solid ${C.ink}`, padding: "1px 6px", borderRadius: 4 }}>
                        {(m.fromIl || "—")} → {(m.toIl || "—")}
                      </span>
                      {m.roundTrip && (
                        <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, background: C.green, color: "#fff", border: `2px solid ${C.ink}`, padding: "1px 6px", borderRadius: 4 }}>TAM TUR ↺</span>
                      )}
                    </span>
                    <span style={{ display: "block", fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.listing.title}</span>
                    <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 3 }}>
                      {m.listing.il}{m.listing.amount ? ` · ${m.listing.amount} ${m.listing.unit || ""}` : ""}{m.trips ? ` · ~${m.trips} sefer` : ""}
                    </span>
                  </span>
                  <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 9, fontWeight: 700, background: C.yellow, border: `2px solid ${C.ink}`, padding: "4px 8px", borderRadius: 5 }}>{m.fit}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Owner / closed banner (in-flow; replaces sticky CTA logic) ── */}
        {isOwner && (
          <div style={{ background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 16, textAlign: "center", boxShadow: "3px 3px 0 rgba(10,10,10,0.18)" }}>
            <div style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: C.yellow }}>Bu sizin ilanınız.</div>
            <button onClick={() => navigate("/ilanlarim")}
              style={{ marginTop: 12, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 18px", fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", cursor: "pointer" }}>
              Teklifleri yönet
            </button>
          </div>
        )}
        {!isOwner && closed && (
          <div style={{ background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 16, textAlign: "center", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.02em" }}>
            {l.status === "eslesti" ? "Bu ilan eşleşti, yeni teklif alınmıyor." : "Bu ilan kapatıldı, yeni teklif alınmıyor."}
          </div>
        )}

        {/* ── Gelen teklifler ────────────────────────────────────── */}
        <div style={{ ...card, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ width: 4, height: 14, background: C.yellow, borderRadius: 1 }} />
            <span style={headLabel}>GELEN TEKLİFLER ({listingOffers.length})</span>
          </div>
          {listingOffers.length === 0 ? (
            <p style={{ fontSize: 13, color: C.faint, margin: 0 }}>Henüz teklif yok. İlk teklifi siz verin.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {listingOffers.map((o) => {
                const s = OFFER_STATUS[o.status] || OFFER_STATUS.beklemede;
                return (
                  <div key={o.id} style={{ border: `2px solid ${C.ink}`, borderRadius: 6, padding: 13, background: C.stone }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <span style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>{o.fromUser}</span>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, background: s.bg, color: s.fg, border: `2px solid ${C.ink}`, padding: "1px 7px", borderRadius: 4 }}>{s.label}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <span style={{ fontSize: 13, color: C.sub, minWidth: 0 }}>{o.message || "—"}</span>
                      {o.price != null && (
                        <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700, color: C.ink, whiteSpace: "nowrap" }}>₺{o.price.toLocaleString("tr-TR")}</span>
                      )}
                    </div>
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, marginTop: 6 }}>{fmtDate(o.createdAt)}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* report button — full-width white 2px, red mono uppercase */}
        {/* ── Benzer ilanlar ─────────────────────────────────────── */}
        {similar.length > 0 && (
          <div style={{ marginTop: 4 }}>
            <div style={{ ...headLabel, marginBottom: 10 }}>BENZER İLANLAR</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {similar.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { navigate(`/ilan/${s.id}`); window.scrollTo(0, 0); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px", cursor: "pointer" }}
                >
                  <span style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 6, border: `2px solid ${C.ink}`, background: s.cat === "hafriyat" ? C.ink : C.stone, color: s.cat === "hafriyat" ? C.yellow : C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 10, fontWeight: 700 }}>{s.cat === "hafriyat" ? "HF" : "SB"}</span>
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span style={{ display: "block", fontFamily: HEAD, fontSize: 12.5, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.title}</span>
                    <span style={{ display: "block", marginTop: 2, fontFamily: MONO, fontSize: 10, color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {s.il || "—"}{s.material ? ` · ${s.material}` : ""}{s.amount ? ` · ${s.amount} ${(s.unit || "").toUpperCase()}` : ""}
                    </span>
                  </span>
                  <ArrowRight size={15} strokeWidth={2.6} color={C.muted} style={{ flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowReport(true)}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
            <AlertTriangle size={15} strokeWidth={2.4} color={C.red} /> Şikayet et
          </button>
          {!isOwner && onToggleBlock && l.ownerId && (
            <button
              onClick={() => { const willBlock = !blocked; onToggleBlock(l.ownerId); toast(willBlock ? "Kullanıcı engellendi" : "Engel kaldırıldı", willBlock ? "info" : "success"); if (willBlock) navigate("/ilanlar"); }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flex: 1, background: blocked ? C.ink : C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: blocked ? C.yellow : C.ink, letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer" }}>
              <X size={15} strokeWidth={2.6} color={blocked ? C.yellow : C.ink} /> {blocked ? "Engeli kaldır" : "Engelle"}
            </button>
          )}
        </div>
      </div>

      {/* ── STICKY BOTTOM "Teklif ver" BAR (white, 2px top rule) ──── */}
      {!isOwner && !closed && (
        <div style={{ position: "sticky", bottom: 0, marginTop: 16, zIndex: 30, background: C.card, borderTop: `2px solid ${C.ink}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.muted, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              {isProduct ? "BİRİM FİYAT" : "FİYATLANDIRMA"}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
              {isProduct ? (
                <span style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.ink }}>
                  {l.price ? `₺${l.price.toLocaleString("tr-TR")}` : "—"}<span style={{ fontSize: 12, color: C.sub }}> {l.priceUnit || "/ton"}</span>
                </span>
              ) : (
                <span style={{ fontFamily: isFixed || lowest != null ? MONO : HEAD, fontSize: isFixed || lowest != null ? 18 : 16, fontWeight: isFixed || lowest != null ? 700 : 800, color: C.ink, textTransform: isFixed || lowest != null ? "none" : "uppercase", letterSpacing: isFixed || lowest != null ? 0 : "-0.01em" }}>
                  {isFixed ? `₺${l.price.toLocaleString("tr-TR")}` : lowest != null ? `₺${lowest.toLocaleString("tr-TR")}` : "Teklife Açık"}
                </span>
              )}
              {!isProduct && listingOffers.length > 0 && (
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{listingOffers.length} teklif</span>
              )}
            </div>
          </div>
          <button onClick={openSheet}
            style={{ display: "flex", alignItems: "center", gap: 7, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 16px", fontFamily: HEAD, fontWeight: 800, fontSize: 14, textTransform: "uppercase", cursor: "pointer", whiteSpace: "nowrap", boxShadow: "3px 3px 0 rgba(10,10,10,0.18)" }}>
            {!user ? "Giriş Yap" : isProduct ? "Sipariş Ver" : "Teklif Ver"} <ArrowRight size={16} strokeWidth={2.8} />
          </button>
        </div>
      )}

      {/* ── OFFER SHEET (bottom sheet) ───────────────────────────── */}
      {showSheet && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(10,10,10,0.45)" }} onClick={closeSheet}>
          <div onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, background: C.bg, borderTopLeftRadius: 10, borderTopRightRadius: 10, border: `2px solid ${C.ink}`, borderBottom: "none", padding: "10px 16px 28px", maxHeight: "88vh", overflowY: "auto" }}>

            {/* drag handle */}
            <div style={{ width: 44, height: 5, margin: "0 auto 14px", borderRadius: 3, background: C.ink, opacity: 0.25 }} />

            {sent ? (
              // ── Sent confirmation screen ──
              <div style={{ textAlign: "center", padding: "20px 8px 8px" }}>
                <div style={{ width: 60, height: 60, margin: "0 auto", borderRadius: 6, background: C.green, color: "#fff", border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Send size={26} strokeWidth={2.4} />
                </div>
                <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginTop: 16 }}>{isProduct ? "Talep gönderildi" : "Teklif gönderildi"}</div>
                <p style={{ fontSize: 13, color: C.sub, marginTop: 6, lineHeight: 1.5 }}>
                  {isProduct
                    ? "Talebin tedarikçiye iletildi. Onaylandığında iletişim açılır ve nakliyeyi platformdan ayarlayabilirsin."
                    : "Teklifiniz ilan sahibine iletildi. Yanıt geldiğinde mesajlardan haberdar olursunuz."}
                </p>
                <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                  <button onClick={() => navigate("/mesajlar")}
                    style={{ flex: 1, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: HEAD, fontWeight: 800, fontSize: 14, textTransform: "uppercase", cursor: "pointer" }}>
                    Mesajlar
                  </button>
                  <button onClick={closeSheet}
                    style={{ flex: 1, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: HEAD, fontWeight: 800, fontSize: 14, textTransform: "uppercase", cursor: "pointer" }}>
                    Kapat
                  </button>
                </div>
              </div>
            ) : (
              // ── Offer form ──
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, letterSpacing: "0.04em", textTransform: "uppercase" }}>{ilanNo(l.id)} · {isProduct ? "SİPARİŞ / TALEP" : "TEKLİF VER"}</div>
                  <button onClick={closeSheet} aria-label="Kapat" style={{ ...iconBtn, width: 34, height: 34 }}>
                    <X size={16} strokeWidth={2.6} color={C.ink} />
                  </button>
                </div>
                <h2 style={{ fontFamily: HEAD, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", margin: "8px 0 2px", lineHeight: 1.18 }}>{l.title}</h2>
                <div style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>{l.il}{l.ilce ? `, ${l.ilce}` : ""}</div>

                {/* YÜKLET Akıllı Fiyat — önerilen fiyat + tek-tık doldur + güven */}
                {est && (
                  <div style={{ marginTop: 14, background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden", boxShadow: "3px 3px 0 rgba(10,10,10,0.18)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 13px", borderBottom: `2px solid ${C.yellow}` }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: HEAD, fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.04em", color: C.yellow }}>
                        <TrendingUp size={15} strokeWidth={2.6} /> YÜKLET Akıllı Fiyat
                      </span>
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.ink, background: C.yellow, borderRadius: 4, padding: "2px 7px" }}>
                        GÜVEN: {est.confidence}
                      </span>
                    </div>
                    <div style={{ padding: "12px 13px 13px" }}>
                      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#9A988E", letterSpacing: "0.06em", textTransform: "uppercase" }}>ÖNERİLEN FİYAT</div>
                          <div style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: "#fff", marginTop: 2, lineHeight: 1 }}>{fmtTL(est.mid)}</div>
                        </div>
                        <button onClick={() => setPrice(String(est.mid))}
                          style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, background: C.yellow, color: C.ink, border: `2px solid ${C.yellow}`, borderRadius: 6, padding: "8px 12px", fontFamily: HEAD, fontWeight: 800, fontSize: 12, textTransform: "uppercase", cursor: "pointer" }}>
                          <Check size={14} strokeWidth={3} /> Bu fiyata ver
                        </button>
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 10, color: "#9A988E", marginTop: 8 }}>
                        Aralık {fmtTL(est.min)} – {fmtTL(est.max)} · ~{est.km} km
                        {est.dataDriven
                          ? ` · ${est.sampleSize} benzer işten${est.accepted ? ` (${est.accepted} gerçekleşen)` : ""}`
                          : " · henüz işlem verisi yok, sezgisel tahmin"}
                      </div>
                      {est.laneCalibrated && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8, background: "rgba(74,222,128,0.12)", border: "1.5px solid #4ADE80", borderRadius: 5, padding: "4px 9px" }}>
                          <Check size={12} color="#4ADE80" strokeWidth={3} />
                          <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: "#fff" }}>
                            BU GÜZERGAH {est.laneSamples} İŞTEN KALİBRELİ{est.laneAccepted ? ` · ${est.laneAccepted} GERÇEK` : ""}
                          </span>
                        </div>
                      )}

                      {/* arz/talep sinyali */}
                      {est.supplyDemand && est.supplyDemand.tone !== "ok" && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, background: "rgba(255,255,255,0.06)", border: `1.5px solid ${est.supplyDemand.tone === "up" ? "#F59E0B" : "#4ADE80"}`, borderRadius: 5, padding: "5px 9px" }}>
                          {est.supplyDemand.tone === "up" ? <TrendingUp size={13} color="#F59E0B" /> : <TrendingDown size={13} color="#4ADE80" />}
                          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#fff" }}>
                            {est.supplyDemand.label} · {est.supplyDemand.demand} iş / {est.supplyDemand.supply} araç
                          </span>
                        </div>
                      )}

                      {/* "Fiyat neden bu?" döküm */}
                      {est.breakdown?.length > 0 && (
                        <div style={{ marginTop: 11, borderTop: "1.5px solid #2A2A2A", paddingTop: 10 }}>
                          <button onClick={() => setShowWhy((s) => !s)}
                            style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.yellow, letterSpacing: "0.03em" }}>
                            <Info size={13} /> Fiyat neden bu?
                            <ChevronDown size={13} style={{ transform: showWhy ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                          </button>
                          {showWhy && (
                            <div style={{ marginTop: 9, display: "flex", flexDirection: "column", gap: 6 }}>
                              {est.breakdown.map((b) => (
                                <div key={b.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#C9C6BD" }}>{b.label}</span>
                                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: b.value < 0 ? "#4ADE80" : "#fff", whiteSpace: "nowrap" }}>
                                    {b.value < 0 ? "−" : "+"}{fmtTL(Math.abs(b.value))}
                                  </span>
                                </div>
                              ))}
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderTop: "1.5px solid #2A2A2A", paddingTop: 7, marginTop: 1 }}>
                                <span style={{ fontFamily: HEAD, fontSize: 11, fontWeight: 800, textTransform: "uppercase", color: C.yellow }}>Önerilen</span>
                                <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: "#fff" }}>{fmtTL(est.mid)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ürün siparişi: miktar alanı */}
                {isProduct && (
                  <>
                    <label style={{ display: "block", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "18px 0 7px" }}>İSTENEN MİKTAR ({(l.unit || "ton").toUpperCase()})</label>
                    <input type="number" min="0" value={qty} onChange={(e) => setQty(e.target.value)}
                      placeholder="0" style={{ ...sheetInput, fontFamily: MONO, fontWeight: 700, fontSize: 26, padding: "12px 14px" }} />
                    {l.price && qty && (
                      <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.green, marginTop: 7 }}>
                        Tahmini tutar: ₺{(Number(qty) * Number(l.price)).toLocaleString("tr-TR")} <span style={{ color: C.muted, fontWeight: 400 }}>({Number(l.price).toLocaleString("tr-TR")} {l.priceUnit || "/" + (l.unit || "ton")})</span>
                      </div>
                    )}
                    {/* nakliye dahil/hariç bilgisi — alıcı taşımayı bilsin */}
                    <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 6, border: `2px solid ${l.deliveryIncluded ? C.green : C.ink}`, background: l.deliveryIncluded ? "#F0FBF3" : C.card, fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: l.deliveryIncluded ? C.green : C.sub, lineHeight: 1.5 }}>
                      {l.deliveryIncluded
                        ? "✓ NAKLİYE DAHİL — teslimat tedarikçiye ait, ayrıca taşıma ayarlamana gerek yok."
                        : "NAKLİYE HARİÇ — sipariş onaylanınca taşımayı platformdan ayarlarsın."}
                    </div>
                  </>
                )}

                {/* price input — big mono 26px, 2px ink frame */}
                <label style={{ display: "block", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "18px 0 7px" }}>{isProduct ? "BİRİM FİYAT TEKLİFİN (₺, opsiyonel)" : "TEKLİF FİYATINIZ (₺)"}</label>
                <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="0" style={{ ...sheetInput, fontFamily: MONO, fontWeight: 700, fontSize: 26, padding: "12px 14px" }} />

                {/* canlı rekabet sinyali — sen yazarken fiyatın piyasaya göre konumu */}
                {est && (() => {
                  const sig = priceSignal(price, est);
                  if (!sig) return null;
                  const TONE = {
                    win: { bg: "#F0FBF3", bd: C.green, fg: C.green, Icon: Check },
                    ok: { bg: C.stone, bd: C.ink, fg: C.ink, Icon: TrendingUp },
                    high: { bg: "#FEF7E6", bd: C.yellowDeep, fg: "#8A6D00", Icon: AlertTriangle },
                    low: { bg: "#FEF2F2", bd: C.red, fg: C.red, Icon: AlertTriangle },
                  }[sig.tone];
                  return (
                    <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 9, background: TONE.bg, border: `2px solid ${TONE.bd}`, borderRadius: 6, padding: "9px 12px" }}>
                      <TONE.Icon size={16} strokeWidth={2.6} color={TONE.fg} style={{ flexShrink: 0 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={{ fontFamily: HEAD, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", color: TONE.fg }}>{sig.label}</span>
                        <span style={{ display: "block", fontFamily: MONO, fontSize: 10.5, color: C.sub, marginTop: 1 }}>{sig.hint}</span>
                      </span>
                    </div>
                  );
                })()}

                {/* listing price type chip (informational, real l.priceType) */}
                <div style={{ display: "flex", gap: 8, marginTop: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 5, border: `2px solid ${C.ink}`, background: l.priceType === "sabit" ? C.yellow : C.card, textTransform: "uppercase" }}>
                    {l.priceType === "sabit" ? "SABİT FİYAT İLANI" : "TEKLİFE AÇIK İLAN"}
                  </span>
                  {isFixed && (
                    <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>İlan fiyatı: ₺{l.price.toLocaleString("tr-TR")}</span>
                  )}
                </div>

                {/* message */}
                <label style={{ display: "block", fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", margin: "16px 0 7px" }}>MESAJINIZ</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="Müsaitlik, araç, koşullar…" rows={3}
                  style={{ ...sheetInput, minHeight: 84, resize: "vertical" }} />

                {/* submit */}
                <button onClick={submitOffer}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", marginTop: 18, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px", fontFamily: HEAD, fontWeight: 800, fontSize: 15, textTransform: "uppercase", cursor: "pointer", boxShadow: "3px 3px 0 rgba(10,10,10,0.18)" }}>
                  {isProduct ? "Siparişi Gönder" : "Teklifi Gönder"} <ArrowRight size={17} strokeWidth={2.6} />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── REPORT MODAL ─────────────────────────────────────────── */}
      {showReport && (
        <ReportModal
          targetLabel={`İlan: ${l.title}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => { onReport?.({ type: "listing", targetId: l.id, listingId: l.id, fromId: user?.id || null, fromName: user?.name || "misafir", ...p }); }}
        />
      )}
    </div>
  );
}
