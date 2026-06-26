// YÜKLET — İlanlar (SAHA marka dili)
// Endüstriyel/şantiye · manila zemin · 2px siyah çerçeve · Archivo başlık · Space Mono rakamlar.
// TÜM filtreleme/işlevsellik korunur: URL params, kaydedilmiş aramalar,
// gelişmiş filtreler (malzeme/fiyat/sıralama), dönüş yükü (backhaul), harita.

import { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  RotateCw,
  MapPin,
  Bookmark,
  Star,
  Plus,
  Minus,
  Compass,
  Inbox,
  Activity,
  TrendingUp,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { LISTINGS, IL_LIST } from "../data/listings";
import { CATS, MATERIALS } from "../data/categories";
import { loadsNearCity } from "../utils/backhaul";
import { estimatePrice, priceSignal, fmtTL } from "../utils/priceEstimate";
import { loadSavedSearches, saveSavedSearches, loadOffers, loadPricingConfig, loadRecentSearches, saveRecentSearches } from "../utils/storage";
import usePullToRefresh from "../hooks/usePullToRefresh";
import useFavorites from "../hooks/useFavorites";
import { computeReliability, reliabilityTier } from "../utils/reliability";
import SEO from "../components/SEO";

const ListingsMap = lazy(() => import("../components/ListingsMap"));

// ── SAHA token'ları (inline) ──
const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  yellowDeep: "#8A6D00",
  green: "#16803C",
  red: "#DC2626",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  sheet: "#F1EDE5",
  border: "#E3DDD0",
  line: "#F0ECE3",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
};
const MONO = { fontFamily: "'Space Mono', ui-monospace, monospace" };
const HEAD = { fontFamily: "'Archivo', sans-serif", textTransform: "uppercase", letterSpacing: "-0.02em" };

const shell = {
  maxWidth: 460,
  margin: "0 auto",
  width: "100%",
  minHeight: "100vh",
  background: C.bg,
  color: C.ink,
  display: "flex",
  flexDirection: "column",
};

const fmtPrice = (l) =>
  l.priceType === "sabit" && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : null;

// Dönüş yükü güzergah uyumu (ilDistance: 0 aynı · 1 komşu · 2 bölge) → gösterimsel sapma km.
// loadsNearCity dist döndürür; backhaul.js'i bozmadan kullanıcıya "X km sapma" gösteririz.
const DEVIATION_KM = { 0: 0, 1: 12, 2: 45 };
const deviationOf = (dist) => DEVIATION_KM[dist] ?? 60;

// İş ilanı için YÜKLET Akıllı Fiyat etiketi:
// teklife açık → önerilen fiyat ipucu · sabit fiyat → piyasa altı/üstü rozeti.
function marketTagOf(l, history, config) {
  if (l.type !== "is" || !l.amount) return null;
  const est = estimatePrice({ cat: l.cat, amount: l.amount, unit: l.unit, fromIl: l.il, toIl: l.varisIl, material: l.material, vehicle: l.vehicle, kmOverride: l.km, history, config });
  if (!est) return null;
  if (l.priceType === "sabit" && l.price) {
    const sig = priceSignal(l.price, est);
    if (!sig) return null;
    if (sig.tone === "win" || sig.tone === "low") return { text: "PİYASA ALTI", color: C.green };
    if (sig.tone === "high") return { text: "PİYASA ÜSTÜ", color: C.yellowDeep };
    return { text: "PİYASA SEVİYESİ", color: C.sub };
  }
  return { suggest: `~${fmtTL(est.mid)}` };
}

// Türkçe-duyarlı küçük harfe çevir (İ→i, I→ı) — arama eşleştirme için.
const norm = (s) => String(s ?? "").toLocaleLowerCase("tr");

// ── İlan kartı ──
function ListingCard({ l, history, config, isFav = false, onToggleFav, rel }) {
  const isH = l.cat === "hafriyat";
  const isProduct = l.type === "urun";
  const market = marketTagOf(l, history, config);
  const fixed = isProduct
    ? (l.price ? `₺${l.price.toLocaleString("tr-TR")}${l.priceUnit || "/ton"}` : null)
    : fmtPrice(l);
  const fromTxt = l.il || "—";
  const toTxt = isProduct ? (l.ilce || "Ocak/Santral") : (l.bosaltma || l.ilce || "Belirtilmemiş");
  const chips = [];
  if (isProduct) {
    if (l.material) chips.push(l.material);
    if (l.deliveryIncluded) chips.push("NAKLİYE DAHİL");
  } else {
    if (l.amount) chips.push(`${l.amount} ${(l.unit || "").toUpperCase()}`);
    if (l.vehicle) chips.push(l.vehicle);
  }

  return (
    <div
      style={{
        background: C.card,
        border: `2px solid ${l.featured ? C.yellow : C.ink}`,
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: l.featured ? "3px 3px 0 #FACC15" : "none",
      }}
    >
      {l.featured && (
        <div style={{ ...MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", background: C.yellow, color: C.ink, padding: "3px 12px", borderBottom: `1.5px solid ${C.ink}` }}>
          ★ Sponsorlu / Öne çıkan
        </div>
      )}
      {/* üst satır: kategori rozeti + zaman */}
      <div
        className="flex items-center justify-between"
        style={{ padding: "10px 12px 0 12px" }}
      >
        <span
          style={{
            ...MONO,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "2px 7px",
            border: `1.5px solid ${C.ink}`,
            borderRadius: 4,
            background: isH ? C.ink : C.stone,
            color: isH ? C.yellow : C.ink,
          }}
        >
          {isH ? "HAFRİYAT" : "SİLOBAS"}
        </span>
        <div className="flex items-center gap-1.5">
          {onToggleFav && (
            <span
              role="button"
              tabIndex={0}
              aria-label={isFav ? "Favorilerden çıkar" : "Favorilere ekle"}
              aria-pressed={isFav}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFav(l.id); }}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); onToggleFav(l.id); } }}
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, cursor: "pointer", marginRight: 2 }}
            >
              <Heart size={16} strokeWidth={2.4} color={isFav ? C.red : C.muted} fill={isFav ? C.red : "none"} />
            </span>
          )}
          {l.status === "eslesti" && (
            <span
              style={{
                ...MONO,
                fontSize: 8.5,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: C.green,
                color: "#fff",
                border: `1.5px solid ${C.ink}`,
              }}
            >
              ● EŞLEŞTİ
            </span>
          )}
          {isProduct && (
            <span
              style={{
                ...MONO,
                fontSize: 8.5,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: l.stock === "az" ? C.red : C.green,
                color: "#fff",
                border: `1.5px solid ${C.ink}`,
                textTransform: "uppercase",
              }}
            >
              ● {l.stockText || l.stock || "STOK"}
            </span>
          )}
          <span style={{ ...MONO, fontSize: 9.5, color: C.muted }}>
            {isProduct ? "ÜRÜN" : l.type === "arac" ? "ARAÇ" : "İŞ"} · {l.createdText}
          </span>
        </div>
      </div>

      {/* başlık */}
      <div
        style={{
          ...HEAD,
          fontSize: 15,
          fontWeight: 800,
          lineHeight: 1.18,
          padding: "8px 12px 0 12px",
        }}
      >
        {l.title}
      </div>

      {/* güzergah: from ● —— to ○ */}
      <div
        className="flex items-center gap-2"
        style={{ padding: "8px 12px 0 12px" }}
      >
        <span
          style={{ width: 8, height: 8, borderRadius: "50%", background: C.ink, flexShrink: 0 }}
        />
        <span style={{ ...MONO, fontSize: 10.5, fontWeight: 700 }}>{fromTxt}</span>
        <span style={{ flex: 1, height: 2, background: C.border, borderRadius: 1 }} />
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            border: `2px solid ${C.ink}`,
            background: C.card,
            flexShrink: 0,
          }}
        />
        <span
          style={{ ...MONO, fontSize: 10.5, fontWeight: 700, maxWidth: 130 }}
          className="truncate"
        >
          {toTxt}
        </span>
      </div>

      {/* sahip + onaylı + puan */}
      <div
        className="flex items-center gap-2"
        style={{ ...MONO, padding: "8px 12px 0 12px", fontSize: 9.5, color: C.sub }}
      >
        <span style={{ fontWeight: 700, color: C.ink }} className="truncate">
          {l.owner}
        </span>
        {l.ownerVerified && (
          <span className="flex items-center gap-0.5" style={{ color: C.green, fontWeight: 700, flexShrink: 0 }}>
            ● ONAYLI
          </span>
        )}
        {l.ownerRating && (
          <span className="flex items-center gap-0.5" style={{ flexShrink: 0 }}>
            <Star size={9} color={C.ink} fill={C.yellow} strokeWidth={2} /> {l.ownerRating}
          </span>
        )}
        {rel?.score != null && (
          <span className="flex items-center gap-0.5" style={{ flexShrink: 0, color: reliabilityTier(rel.score).color, fontWeight: 700 }} title={`Güvenilirlik %${rel.score} · ${rel.jobsDone} iş`}>
            <ShieldCheck size={10} strokeWidth={2.5} /> %{rel.score}
          </span>
        )}
      </div>

      {/* alt: etiket chip'leri + fiyat + aksiyon */}
      <div
        className="flex items-center justify-between gap-2"
        style={{ padding: "10px 12px 12px 12px", marginTop: 8 }}
      >
        <div className="flex flex-wrap items-center gap-1.5" style={{ minWidth: 0 }}>
          {chips.map((c) => (
            <span
              key={c}
              style={{
                ...MONO,
                fontSize: 9,
                fontWeight: 700,
                padding: "2px 6px",
                borderRadius: 4,
                background: C.stone,
                border: `1.5px solid ${C.border}`,
                color: C.sub,
                whiteSpace: "nowrap",
              }}
            >
              {c}
            </span>
          ))}
        </div>
        <div className="flex flex-shrink-0 items-center gap-2.5">
          {market?.text && (
            <span style={{ ...MONO, fontSize: 8.5, fontWeight: 700, padding: "2px 6px", borderRadius: 4, color: market.color, border: `1.5px solid ${market.color}`, background: C.card, whiteSpace: "nowrap" }}>
              {market.text}
            </span>
          )}
          {fixed ? (
            <span style={{ ...MONO, fontSize: isProduct ? 12.5 : 14, fontWeight: 700, color: C.green }}>
              {fixed}
            </span>
          ) : market?.suggest ? (
            <span className="flex flex-col items-end" style={{ lineHeight: 1.05 }}>
              <span style={{ ...MONO, fontSize: 8, fontWeight: 700, color: C.muted, letterSpacing: "0.04em" }}>YÜKLET ÖNERİ</span>
              <span style={{ ...MONO, fontSize: 13, fontWeight: 700, color: C.ink }}>{market.suggest}</span>
            </span>
          ) : (
            <span style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub }}>
              TEKLİFE AÇIK
            </span>
          )}
          <span
            style={{
              ...MONO,
              fontSize: 10,
              fontWeight: 700,
              color: C.ink,
              whiteSpace: "nowrap",
            }}
          >
            {isProduct ? "İLETİŞİME GEÇ →" : l.offers > 0 ? `${l.offers} TEKLİF →` : "TEKLİF VER →"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Boş durum kutusu (2px DASHED çerçeve + ikon kutusu) ──
function EmptyBox({ icon, title, sub, action }) {
  const Icon = icon;
  return (
    <div
      className="flex flex-col items-center gap-3 text-center"
      style={{
        background: C.card,
        border: `2px dashed ${C.ink}`,
        borderRadius: 6,
        padding: "44px 24px",
      }}
    >
      <div
        className="flex items-center justify-center"
        style={{
          width: 52,
          height: 52,
          background: C.stone,
          border: `2px solid ${C.ink}`,
          borderRadius: 6,
        }}
      >
        <Icon size={24} color={C.ink} strokeWidth={2.25} />
      </div>
      <div style={{ ...HEAD, fontSize: 16, fontWeight: 900 }}>{title}</div>
      <div style={{ ...MONO, fontSize: 10.5, color: C.sub, lineHeight: 1.5, maxWidth: 240 }}>{sub}</div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            ...HEAD,
            ...MONO,
            fontSize: 11,
            fontWeight: 700,
            marginTop: 4,
            padding: "10px 16px",
            background: C.ink,
            color: C.yellow,
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default function ListingsPage({ listings = LISTINGS, onRefresh, blockedIds = [], offers = [], reviews = [] }) {
  const navigate = useNavigate();
  // İlan sahibi başına güvenilirlik (kart rozeti için, bir kez hesapla).
  const ownerRel = useMemo(() => {
    const map = {};
    for (const l of listings) {
      const oid = String(l.ownerId);
      if (l.ownerId != null && !(oid in map)) map[oid] = computeReliability(oid, { listings, offers, reviews });
    }
    return map;
  }, [listings, offers, reviews]);
  const [sp] = useSearchParams();
  // Aşağı-çekip-yenile (dokunmatik). onRefresh yoksa kısa görsel geri bildirim.
  const ptrRefresh = onRefresh || (() => new Promise((r) => setTimeout(r, 500)));
  const { distance, refreshing, pull } = usePullToRefresh(ptrRefresh);
  // YÜKLET Akıllı Fiyat: kartlardaki piyasa etiketleri için geçmiş veri (bir kez).
  const priceHistory = useMemo(() => ({ listings, offers: loadOffers() }), [listings]);
  const pricingConfig = useMemo(() => loadPricingConfig(), []);
  const [type, setType] = useState(["arac", "is", "urun"].includes(sp.get("type")) ? sp.get("type") : "all");
  const [cat, setCat] = useState(
    ["hafriyat", "silobas"].includes(sp.get("cat")) ? sp.get("cat") : "all"
  );
  const [il, setIl] = useState("all");
  const [q, setQ] = useState("");
  const [mode, setMode] = useState(sp.get("mode") === "backhaul" ? "backhaul" : "normal"); // normal | backhaul
  const [material, setMaterial] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState("yeni"); // yeni | teklif | ucuz | pahali | onayli
  const [verifiedOnly, setVerifiedOnly] = useState(false); // sadece onaylı ilan sahibi
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState(sp.get("view") === "map" ? "map" : "list"); // list | map
  // Favori (kaydedilen) ilanlar
  const { isFav, toggle: toggleFav, count: favCount } = useFavorites();
  const [favOnly, setFavOnly] = useState(sp.get("fav") === "1"); // sadece favorileri göster
  // Son aramalar — kullanıcı yazmayı bırakınca (debounce) geçmişe eklenir.
  const [recent, setRecent] = useState(() => loadRecentSearches());

  // ── Kaydedilmiş aramalar (mantık birebir korunur) ──
  const [saved, setSaved] = useState(() => loadSavedSearches());
  const persistSaved = (next) => {
    setSaved(next);
    saveSavedSearches(next);
  };
  const currentSearch = { type, cat, il, q, material, priceMin, priceMax, sort, verifiedOnly };
  const isDefaultSearch =
    type === "all" &&
    cat === "all" &&
    il === "all" &&
    !q &&
    material === "all" &&
    !priceMin &&
    !priceMax &&
    !verifiedOnly &&
    sort === "yeni";
  const labelFor = (s) => {
    const parts = [];
    if (s.cat !== "all") parts.push(s.cat === "hafriyat" ? "Hafriyat" : "Silobas");
    if (s.type !== "all") parts.push(s.type === "arac" ? "Araç" : s.type === "urun" ? "Ürün" : "İş");
    if (s.il !== "all") parts.push(s.il);
    if (s.material !== "all") parts.push(s.material);
    if (s.q) parts.push(`"${s.q}"`);
    return parts.join(" · ") || "Tüm ilanlar";
  };
  const saveCurrent = () => {
    const key = JSON.stringify(currentSearch);
    if (
      saved.some(
        (s) =>
          JSON.stringify({
            type: s.type,
            cat: s.cat,
            il: s.il,
            q: s.q,
            material: s.material,
            priceMin: s.priceMin,
            priceMax: s.priceMax,
            sort: s.sort,
          }) === key
      )
    )
      return;
    persistSaved([{ id: key, ...currentSearch, label: labelFor(currentSearch) }, ...saved].slice(0, 8));
  };
  const applySearch = (s) => {
    setType(s.type);
    setCat(s.cat);
    setIl(s.il);
    setQ(s.q);
    setMaterial(s.material);
    setPriceMin(s.priceMin);
    setPriceMax(s.priceMax);
    setSort(s.sort);
    setVerifiedOnly(Boolean(s.verifiedOnly));
    setMode("normal");
  };
  const removeSearch = (id) => persistSaved(saved.filter((s) => s.id !== id));

  const clearAll = () => {
    setType("all");
    setCat("all");
    setIl("all");
    setQ("");
    setMaterial("all");
    setPriceMin("");
    setPriceMax("");
    setSort("yeni");
    setVerifiedOnly(false);
  };

  const materialOpts =
    cat === "all"
      ? [...(MATERIALS.hafriyat || []), ...(MATERIALS.silobas || [])]
      : MATERIALS[cat] || [];

  const filtered = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    // Türkçe-duyarlı, çok kelimeli arama: her kelime ilanın herhangi bir alanında geçmeli.
    const qTokens = norm(q).split(/\s+/).filter(Boolean);
    const matchesQ = (l) => {
      if (qTokens.length === 0) return true;
      const hay = norm([l.title, l.il, l.ilce, l.material, l.vehicle, l.yukleme, l.bosaltma, l.desc, l.owner].filter(Boolean).join(" "));
      return qTokens.every((t) => hay.includes(t));
    };
    const blockedSet = new Set((blockedIds || []).map(String));
    let out = listings.filter(
      (l) =>
        l.status !== "kapali" &&
        !blockedSet.has(String(l.ownerId)) &&
        (!favOnly || isFav(l.id)) &&
        (!verifiedOnly || l.ownerVerified) &&
        (type === "all" || l.type === type) &&
        (cat === "all" || l.cat === cat) &&
        (il === "all" || l.il === il) &&
        (material === "all" || l.material === material) &&
        (min == null || (l.price != null && l.price >= min)) &&
        (max == null || (l.price != null && l.price <= max)) &&
        matchesQ(l)
    );
    if (sort === "teklif") out = [...out].sort((a, b) => (b.offers || 0) - (a.offers || 0));
    else if (sort === "ucuz") out = [...out].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    else if (sort === "pahali") out = [...out].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    else if (sort === "onayli") out = [...out].sort((a, b) => (b.ownerVerified ? 1 : 0) - (a.ownerVerified ? 1 : 0));
    // Sponsorlu (öne çıkan) ilanlar her zaman üstte (mevcut sıra korunur)
    out = [...out].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return out;
  }, [listings, type, cat, il, q, material, priceMin, priceMax, sort, verifiedOnly, favOnly, isFav, blockedIds]);

  const activeFilters =
    (material !== "all" ? 1 : 0) + (priceMin || priceMax ? 1 : 0) + (sort !== "yeni" ? 1 : 0) + (verifiedOnly ? 1 : 0);

  // Son aramalar: kullanıcı yazmayı bırakınca (700ms) geçmişe ekle (dedupe, maks 6).
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return undefined;
    const id = setTimeout(() => {
      setRecent((prev) => {
        const next = [term, ...prev.filter((r) => norm(r) !== norm(term))].slice(0, 6);
        saveRecentSearches(next);
        return next;
      });
    }, 700);
    return () => clearTimeout(id);
  }, [q]);

  const removeRecent = (term) => {
    setRecent((prev) => {
      const next = prev.filter((r) => r !== term);
      saveRecentSearches(next);
      return next;
    });
  };

  // Dönüş yükü: referans il'e yakın açık iş yükleri
  const backhaul = useMemo(() => {
    if (mode !== "backhaul" || il === "all") return [];
    return loadsNearCity(il, listings, { cat: cat === "all" ? null : cat, limit: 30 });
  }, [mode, il, cat, listings]);

  const openCount = mode === "backhaul" ? backhaul.length : filtered.length;

  // ── Sekme yardımcı: tab tasarımı ──
  const tabStyle = (active) => ({
    ...MONO,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
    padding: "8px 12px",
    borderRadius: 6,
    border: `2px solid ${C.ink}`,
    background: active ? C.ink : C.card,
    color: active ? C.yellow : C.ink,
    whiteSpace: "nowrap",
    display: "flex",
    alignItems: "center",
    gap: 5,
  });

  const chip = (active) => ({
    ...MONO,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.02em",
    padding: "6px 11px",
    borderRadius: 5,
    border: `2px solid ${active ? C.ink : C.border}`,
    background: active ? C.ink : C.card,
    color: active ? C.yellow : C.sub,
    whiteSpace: "nowrap",
    flexShrink: 0,
    textTransform: "uppercase",
  });

  return (
    <div style={shell}>
      <SEO
        title="İlanlar"
        description="Hafriyat ve silobas iş ve araç ilanları. Konuma, kategoriye ve türüne göre filtreleyin."
      />

      {/* Aşağı-çekip-yenile göstergesi */}
      {(distance > 0 || refreshing) && (
        <div style={{ position: "fixed", top: 0, left: "50%", transform: `translateX(-50%) translateY(${Math.max(0, distance - 34)}px)`, zIndex: 55, width: 34, height: 34, borderRadius: "50%", background: "#0A0A0A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0 rgba(10,10,10,0.2)", pointerEvents: "none" }}>
          <RotateCw size={18} strokeWidth={2.6} color="#FACC15" style={{ transform: `rotate(${refreshing ? 0 : pull * 270}deg)`, animation: refreshing ? "ptr-spin 0.7s linear infinite" : "none" }} />
        </div>
      )}

      {/* ── HEADER ── */}
      <div style={{ background: C.header, borderBottom: `2px solid ${C.ink}` }}>
        <div style={{ padding: "14px 16px 12px 16px" }}>
          {/* başlık + sayaç */}
          <div className="flex items-end justify-between">
            <div className="flex items-baseline gap-2.5">
              {mode === "backhaul" ? (
                <h1 className="flex items-center gap-2" style={{ ...HEAD, fontSize: 24, fontWeight: 900, lineHeight: 1 }}>
                  <RotateCw size={22} strokeWidth={2.75} color={C.ink} />
                  Dönüş Yükü
                </h1>
              ) : (
                <h1 style={{ ...HEAD, fontSize: 26, fontWeight: 900, lineHeight: 1 }}>İlanlar</h1>
              )}
              <span style={{ ...MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>
                {openCount} {mode === "backhaul" ? "YAKIN YÜK" : "AÇIK İŞ"}
              </span>
            </div>
            {/* Liste / Harita toggle — sadece normal modda */}
            {mode === "normal" && (
              <div className="flex" style={{ border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden" }}>
                <button
                  onClick={() => setView("list")}
                  style={{
                    ...MONO,
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "5px 9px",
                    background: view === "list" ? C.ink : C.card,
                    color: view === "list" ? C.yellow : C.ink,
                  }}
                >
                  LİSTE
                </button>
                <button
                  onClick={() => setView("map")}
                  style={{
                    ...MONO,
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "5px 9px",
                    borderLeft: `2px solid ${C.ink}`,
                    background: view === "map" ? C.ink : C.card,
                    color: view === "map" ? C.yellow : C.ink,
                  }}
                >
                  HARİTA
                </button>
              </div>
            )}
          </div>

          {/* Favoriler filtresi — kaydedilen ilanları göster/gizle */}
          {mode === "normal" && (
            <button
              onClick={() => setFavOnly((v) => !v)}
              aria-pressed={favOnly}
              className="flex items-center gap-1.5"
              style={{ marginTop: 12, background: favOnly ? C.red : C.card, border: `2px solid ${favOnly ? C.red : C.ink}`, borderRadius: 6, padding: "6px 11px", cursor: "pointer" }}
            >
              <Heart size={14} strokeWidth={2.5} color={favOnly ? "#fff" : C.red} fill={favOnly ? "#fff" : "none"} />
              <span style={{ ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", color: favOnly ? "#fff" : C.ink }}>
                FAVORİLER{favCount > 0 ? ` · ${favCount}` : ""}
              </span>
            </button>
          )}

          {/* Piyasa Nabzı girişi — YÜKLET Akıllı Fiyat referansı */}
          {mode === "normal" && (
            <button
              onClick={() => navigate("/piyasa")}
              className="flex items-center justify-between"
              style={{ width: "100%", marginTop: 12, background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "9px 12px", cursor: "pointer", boxShadow: "3px 3px 0 rgba(10,10,10,0.12)" }}
            >
              <span className="flex items-center gap-2" style={{ minWidth: 0 }}>
                <Activity size={16} color={C.yellow} strokeWidth={2.6} />
                <span style={{ ...HEAD, fontSize: 12.5, fontWeight: 800, color: "#fff" }}>Piyasa Nabzı</span>
                <span style={{ ...MONO, fontSize: 9.5, color: "#9A988E" }} className="truncate">₺/ton-km fiyat referansı</span>
              </span>
              <TrendingUp size={15} color={C.yellow} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            </button>
          )}

          {/* arama + filtre */}
          <div className="flex items-center gap-2" style={{ marginTop: 12 }}>
            <div
              className="flex flex-1 items-center gap-2"
              style={{
                background: C.card,
                border: `2px solid ${C.ink}`,
                borderRadius: 6,
                padding: "0 11px",
                height: 42,
              }}
            >
              <Search size={16} color={C.sub} strokeWidth={2.5} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="İL · MALZEME · GÜZERGAH ARA"
                aria-label="İlan ara"
                style={{
                  ...MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  width: "100%",
                  color: C.ink,
                }}
              />
              {q && (
                <button onClick={() => setQ("")} aria-label="Aramayı temizle" style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, cursor: "pointer", background: "transparent", border: "none" }}>
                  <X size={15} color={C.sub} strokeWidth={2.6} />
                </button>
              )}
            </div>
            {mode === "normal" && (
              <button
                onClick={() => setShowFilters(true)}
                aria-label="Filtreler"
                style={{
                  position: "relative",
                  width: 42,
                  height: 42,
                  borderRadius: 6,
                  border: `2px solid ${C.ink}`,
                  background: C.yellow,
                  flexShrink: 0,
                }}
                className="flex items-center justify-center"
              >
                <SlidersHorizontal size={17} color={C.ink} strokeWidth={2.5} />
                {activeFilters > 0 && (
                  <span
                    style={{
                      ...MONO,
                      position: "absolute",
                      top: -6,
                      right: -6,
                      background: C.red,
                      color: "#fff",
                      fontSize: 9,
                      fontWeight: 700,
                      border: `1.5px solid ${C.ink}`,
                      borderRadius: 4,
                      padding: "0 4px",
                      minWidth: 16,
                      textAlign: "center",
                    }}
                  >
                    {activeFilters}
                  </span>
                )}
              </button>
            )}
          </div>

          {/* SON ARAMALAR — yalnızca arama boşken */}
          {mode === "normal" && q === "" && recent.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto" style={{ marginTop: 10, paddingBottom: 2 }}>
              <span style={{ ...MONO, fontSize: 8.5, fontWeight: 700, color: C.sub, letterSpacing: "0.06em", flexShrink: 0 }}>SON ARAMALAR</span>
              {recent.map((r) => (
                <span key={r} className="flex items-center gap-1" style={{ flexShrink: 0, background: C.card, border: `1.5px solid ${C.ink}`, borderRadius: 5, padding: "3px 4px 3px 8px" }}>
                  <button onClick={() => setQ(r)} style={{ ...MONO, fontSize: 9.5, fontWeight: 700, color: C.ink, background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>{r}</button>
                  <button onClick={() => removeRecent(r)} aria-label={`${r} aramasını kaldır`} style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
                    <X size={11} color={C.sub} strokeWidth={2.6} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* SEKMELER: Tümü / Hafriyat / Silobas / Dönüş */}
          <div className="flex gap-2 overflow-x-auto" style={{ marginTop: 12, paddingBottom: 2 }}>
            <button
              style={tabStyle(mode === "normal" && cat === "all")}
              onClick={() => {
                setMode("normal");
                setCat("all");
              }}
            >
              TÜMÜ
            </button>
            {CATS.map((c) => {
              const active = mode === "normal" && cat === c.id;
              return (
                <button
                  key={c.id}
                  style={tabStyle(active)}
                  onClick={() => {
                    setMode("normal");
                    setCat(c.id);
                  }}
                >
                  {c.id === "hafriyat" && (
                    <span
                      style={{
                        width: 9,
                        height: 9,
                        background: C.yellow,
                        border: `1.5px solid ${active ? C.yellow : C.ink}`,
                        borderRadius: 2,
                      }}
                    />
                  )}
                  {c.id === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
                </button>
              );
            })}
            <button style={tabStyle(mode === "backhaul")} onClick={() => setMode("backhaul")}>
              <RotateCw size={13} strokeWidth={2.5} color={mode === "backhaul" ? C.yellow : C.ink} />
              DÖNÜŞ
            </button>
          </div>
        </div>
      </div>

      {/* ── GÖVDE ── */}
      <div
        style={{ flex: 1, padding: "12px 16px 110px 16px", display: "flex", flexDirection: "column", gap: 12 }}
      >
        {/* İL filtresi (kaydırılabilir chip'ler) */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ paddingBottom: 2 }}>
          <button style={chip(il === "all")} onClick={() => setIl("all")}>
            TÜM İLLER
          </button>
          {IL_LIST.map((i) => (
            <button key={i} style={chip(il === i)} onClick={() => setIl(i)}>
              {i}
            </button>
          ))}
        </div>

        {/* İş / Araç türü (sadece normal modda) */}
        {mode === "normal" && (
          <div className="flex gap-1.5">
            {[
              ["all", "TÜMÜ"],
              ["is", "İŞ"],
              ["arac", "ARAÇ"],
              ["urun", "ÜRÜN"],
            ].map(([k, lbl]) => (
              <button key={k} style={chip(type === k)} onClick={() => setType(k)}>
                {lbl}
              </button>
            ))}
          </div>
        )}

        {/* Kaydedilmiş aramalar */}
        {mode === "normal" && (saved.length > 0 || !isDefaultSearch) && (
          <div className="flex items-center gap-1.5 overflow-x-auto" style={{ paddingBottom: 2 }}>
            {!isDefaultSearch && (
              <button
                onClick={saveCurrent}
                className="flex items-center gap-1"
                style={{
                  ...MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "6px 10px",
                  borderRadius: 5,
                  border: `2px dashed ${C.ink}`,
                  background: C.yellow,
                  color: C.ink,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <Bookmark size={12} strokeWidth={2.5} /> ARAMAYI KAYDET
              </button>
            )}
            {saved.map((s) => (
              <span
                key={s.id}
                className="flex items-center gap-1.5"
                style={{
                  ...MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "6px 9px",
                  borderRadius: 5,
                  border: `2px solid ${C.ink}`,
                  background: C.card,
                  color: C.ink,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                <button onClick={() => applySearch(s)} className="flex items-center gap-1">
                  <Bookmark size={12} strokeWidth={2.5} fill={C.yellow} /> {s.label}
                </button>
                <button
                  onClick={() => removeSearch(s.id)}
                  aria-label="Kaldır"
                  style={{ color: C.muted, display: "flex" }}
                >
                  <X size={12} strokeWidth={3} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Dönüş yükü: "Aracın nerede?" konum seçici + açıklama */}
        {mode === "backhaul" && (
          <div className="flex flex-col gap-2.5">
            <div
              style={{
                background: C.card,
                border: `2px solid ${C.ink}`,
                borderRadius: 6,
                padding: "12px 13px",
              }}
            >
              <div className="flex items-center gap-1.5" style={{ marginBottom: 8 }}>
                <Compass size={13} strokeWidth={2.5} color={C.ink} />
                <span style={{ ...MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", color: C.sub }}>
                  ARACIN NEREDE?
                </span>
              </div>
              <div className="relative">
                <MapPin
                  size={15}
                  strokeWidth={2.5}
                  color={C.ink}
                  style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                />
                <select
                  value={il}
                  onChange={(e) => setIl(e.target.value)}
                  aria-label="Aracın bulunduğu il"
                  style={{
                    ...MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    width: "100%",
                    padding: "12px 12px 12px 34px",
                    borderRadius: 6,
                    border: `2px solid ${C.ink}`,
                    background: il === "all" ? C.stone : C.yellow,
                    color: C.ink,
                    outline: "none",
                    appearance: "none",
                    cursor: "pointer",
                  }}
                >
                  <option value="all">İL SEÇ…</option>
                  {IL_LIST.map((i) => (
                    <option key={i} value={i}>
                      {i.toLocaleUpperCase("tr-TR")}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    ...MONO,
                    position: "absolute",
                    right: 13,
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.ink,
                    pointerEvents: "none",
                  }}
                >
                  ▾
                </span>
              </div>
            </div>
            <p style={{ ...MONO, fontSize: 10.5, color: C.sub, lineHeight: 1.5 }}>
              Aracın <b style={{ color: C.ink }}>hangi ildeyse</b> seç — o güzergaha az sapan açık
              yükleri (boş dönmeyesin) sapma km'sine göre sıralayalım.
            </p>
          </div>
        )}

        {/* ── İÇERİK ── */}
        {mode === "backhaul" ? (
          il === "all" ? (
            <EmptyBox
              icon={Compass}
              title="Bir referans il seç"
              sub="Aracının bulunduğu ili seç; yakın açık yükleri gösterelim."
            />
          ) : backhaul.length === 0 ? (
            <EmptyBox
              icon={Inbox}
              title={`${il} çevresinde açık yük yok`}
              sub="Komşu illeri de deneyebilirsin."
            />
          ) : (
            <div className="flex flex-col gap-3">
              {backhaul.map((m) => {
                const km = deviationOf(m.dist);
                return (
                <div key={m.listing.id} className="flex flex-col gap-1.5">
                  {/* sapma rozeti satırı: güzergah + sarı "X km sapma" */}
                  <div className="flex items-center gap-1.5">
                    <span
                      className="flex items-center gap-1"
                      style={{
                        ...MONO,
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: C.stone,
                        border: `1.5px solid ${C.border}`,
                        color: C.sub,
                      }}
                    >
                      <MapPin size={10} strokeWidth={2.5} color={C.ink} />
                      {(il && il !== "all" ? il : m.fromIl) || "—"} → {m.fromIl || "—"}
                    </span>
                    <span
                      style={{
                        ...MONO,
                        fontSize: 9,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 4,
                        background: km === 0 ? C.green : C.yellow,
                        border: `1.5px solid ${C.ink}`,
                        color: km === 0 ? "#fff" : C.ink,
                      }}
                    >
                      {km === 0 ? "GÜZERGAH ÜZERİ" : `${km} KM SAPMA`}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/ilan/${m.listing.id}`)}
                    style={{ display: "block", width: "100%", textAlign: "left" }}
                  >
                    <ListingCard l={m.listing} history={priceHistory} config={pricingConfig} isFav={isFav(m.listing.id)} onToggleFav={toggleFav} rel={ownerRel[String(m.listing.ownerId)]} />
                  </button>
                </div>
                );
              })}
            </div>
          )
        ) : view === "map" ? (
          <Suspense
            fallback={
              <div
                className="flex items-center justify-center"
                style={{
                  height: 460,
                  borderRadius: 6,
                  background: C.card,
                  border: `2px solid ${C.ink}`,
                  ...MONO,
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.sub,
                }}
              >
                HARİTA YÜKLENİYOR…
              </div>
            }
          >
            <ListingsMap
              listings={filtered}
              onPickIl={(picked) => {
                setIl(picked);
                setView("list");
              }}
            />
          </Suspense>
        ) : filtered.length === 0 ? (
          favOnly ? (
            <EmptyBox
              icon={Heart}
              title="Henüz favori ilanın yok"
              sub="İlanlardaki kalbe dokunarak kaydet; kaydettiklerin burada toplansın."
              action={{ label: "TÜM İLANLARA GÖZ AT", onClick: () => setFavOnly(false) }}
            />
          ) : (
            <EmptyBox
              icon={Search}
              title="İlan bulunamadı"
              sub="Arama veya filtreleri değiştirip tekrar dene."
              action={!isDefaultSearch ? { label: "FİLTRELERİ TEMİZLE", onClick: clearAll } : null}
            />
          )
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((l) => (
              <button
                key={l.id}
                onClick={() => navigate(`/ilan/${l.id}`)}
                style={{ display: "block", width: "100%", textAlign: "left" }}
              >
                <ListingCard l={l} history={priceHistory} config={pricingConfig} isFav={isFav(l.id)} onToggleFav={toggleFav} rel={ownerRel[String(l.ownerId)]} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── FİLTRE ALT SAYFASI ── */}
      {mode === "normal" && showFilters && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 50 }}
          className="mx-auto flex flex-col justify-end"
        >
          {/* overlay */}
          <button
            onClick={() => setShowFilters(false)}
            aria-label="Kapat"
            style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.45)" }}
          />
          {/* sheet */}
          <div
            style={{
              position: "relative",
              maxWidth: 460,
              width: "100%",
              margin: "0 auto",
              background: C.sheet,
              borderTop: `2px solid ${C.ink}`,
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              maxHeight: "85vh",
              overflowY: "auto",
            }}
          >
            {/* başlık */}
            <div
              className="flex items-center justify-between"
              style={{ padding: "16px 16px 12px 16px", borderBottom: `2px solid ${C.line}` }}
            >
              <h2 style={{ ...HEAD, fontSize: 18, fontWeight: 900 }}>FİLTRELER</h2>
              <button
                onClick={() => setShowFilters(false)}
                aria-label="Kapat"
                className="flex items-center justify-center"
                style={{
                  width: 34,
                  height: 34,
                  background: C.card,
                  border: `2px solid ${C.ink}`,
                  borderRadius: 6,
                }}
              >
                <X size={18} strokeWidth={2.5} color={C.ink} />
              </button>
            </div>

            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Kategori */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  KATEGORİ
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <button style={chip(cat === "all")} onClick={() => setCat("all")}>
                    TÜMÜ
                  </button>
                  {CATS.map((c) => (
                    <button key={c.id} style={chip(cat === c.id)} onClick={() => setCat(c.id)}>
                      {c.id === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Araç / İş türü */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  TÜR
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["all", "TÜMÜ"],
                    ["is", "İŞ İLANI"],
                    ["arac", "ARAÇ İLANI"],
                    ["urun", "ÜRÜN İLANI"],
                  ].map(([k, lbl]) => (
                    <button key={k} style={chip(type === k)} onClick={() => setType(k)}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Malzeme */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  MALZEME
                </div>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  style={{
                    ...MONO,
                    fontSize: 12,
                    fontWeight: 700,
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: `2px solid ${C.ink}`,
                    background: C.card,
                    color: C.ink,
                    outline: "none",
                  }}
                >
                  <option value="all">TÜMÜ</option>
                  {materialOpts.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {/* Fiyat aralığı */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  FİYAT ARALIĞI (SABİT FİYATLI)
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    placeholder="MIN ₺"
                    style={{
                      ...MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: `2px solid ${C.ink}`,
                      background: C.card,
                      color: C.ink,
                      outline: "none",
                    }}
                  />
                  <span style={{ ...MONO, fontWeight: 700, color: C.muted }}>–</span>
                  <input
                    type="number"
                    min="0"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    placeholder="MAX ₺"
                    style={{
                      ...MONO,
                      fontSize: 12,
                      fontWeight: 700,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 6,
                      border: `2px solid ${C.ink}`,
                      background: C.card,
                      color: C.ink,
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Sıralama */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  SIRALAMA
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    ["yeni", "YENİ"],
                    ["teklif", "EN ÇOK TEKLİF"],
                    ["ucuz", "FİYAT ↑"],
                    ["pahali", "FİYAT ↓"],
                    ["onayli", "ONAYLI ÖNCE"],
                  ].map(([k, lbl]) => (
                    <button key={k} style={chip(sort === k)} onClick={() => setSort(k)}>
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Onaylı ilan sahibi filtresi */}
              <div>
                <div style={{ ...MONO, fontSize: 10, fontWeight: 700, color: C.sub, marginBottom: 8, letterSpacing: "0.06em" }}>
                  GÜVEN
                </div>
                <button style={chip(verifiedOnly)} onClick={() => setVerifiedOnly((v) => !v)}>
                  ✓ SADECE ONAYLI İLAN SAHİBİ
                </button>
              </div>
            </div>

            {/* Alt: Temizle + Göster */}
            <div
              className="flex items-center gap-2"
              style={{ padding: 16, borderTop: `2px solid ${C.line}`, background: C.sheet, position: "sticky", bottom: 0 }}
            >
              <button
                onClick={() => {
                  setMaterial("all");
                  setPriceMin("");
                  setPriceMax("");
                  setSort("yeni");
                  setVerifiedOnly(false);
                }}
                style={{
                  ...HEAD,
                  ...MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  background: C.card,
                  color: C.ink,
                  border: `2px solid ${C.ink}`,
                  borderRadius: 6,
                  padding: "14px 16px",
                }}
              >
                TEMİZLE
              </button>
              <button
                onClick={() => setShowFilters(false)}
                style={{
                  ...HEAD,
                  ...MONO,
                  flex: 1,
                  background: C.ink,
                  color: C.yellow,
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.02em",
                  border: `2px solid ${C.ink}`,
                  borderRadius: 6,
                  padding: "14px 0",
                }}
              >
                {filtered.length} İLANI GÖSTER
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
