// YÜKLET — Piyasa Nabzı (Market Pulse) — SAHA marka dili.
// Güzergah / malzeme / kategori bazlı ₺/ton-km referansı, geçmiş
// işlemlerden (kabul teklif + sabit fiyat) hesaplanır. Veri biriktikçe
// zenginleşir. Platformu "ilan panosu"ndan "fiyat referansı"na taşır.

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowRight, TrendingUp, TrendingDown, Minus, MapPin, Activity, Boxes, SlidersHorizontal } from "lucide-react";
import { LISTINGS } from "../data/listings";
import { loadOffers } from "../utils/storage";
import { marketPulse, estimatePrice, densityByIl } from "../utils/priceEstimate";
import SEO from "../components/SEO";
import Logo from "../components/Logo";

// ── SAHA tokens ──
const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", yellowDeep: "#8A6D00",
  green: "#16803C", red: "#DC2626", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  border: "#E3DDD0", line: "#F0ECE3", sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const ARCH = "'Archivo', sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, color: C.ink, fontFamily: SANS, paddingBottom: 96,
};
const card = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 rgba(10,10,10,0.08)" };
const sectionTitle = { fontFamily: ARCH, fontSize: 16, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase", margin: 0 };
const microLabel = { fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted };

// ₺/ton-km biçimle (küçük ondalık)
const fmtRate = (r) => "₺" + Number(r).toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtTL = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
const CAT_LABEL = { hafriyat: "HAFRİYAT", silobas: "SİLOBAS" };

// Veri yoksa sezgisel taban ₺/ton-km (referans güzergah üzerinden)
function refRate(cat) {
  const e = estimatePrice({ cat, amount: 200, unit: "ton", fromIl: "İstanbul", toIl: "Kocaeli" });
  return e ? e.mid / (200 * e.km) : null;
}

function TrendPill({ trend }) {
  if (!trend) return <span style={{ ...microLabel, color: C.faint }}>TREND: VERİ TOPLANIYOR</span>;
  const up = trend.dir === "up", flat = trend.dir === "flat";
  const clr = flat ? C.sub : up ? C.red : C.green; // yükselen fiyat nakliyeci lehine değil → kırmızı
  const Icon = flat ? Minus : up ? TrendingUp : TrendingDown;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: clr }}>
      <Icon size={15} strokeWidth={2.6} /> {trend.pct > 0 ? "+" : ""}{trend.pct}% son dönem
    </span>
  );
}

export default function PiyasaNabziPage({ listings = LISTINGS, offers }) {
  const navigate = useNavigate();
  const pulse = useMemo(
    () => marketPulse({ listings, offers: offers || loadOffers() }),
    [listings, offers]
  );
  const density = useMemo(() => densityByIl({ listings }), [listings]);

  return (
    <div style={shell}>
      <SEO title="Piyasa Nabzı" description="Güzergah ve malzeme bazlı güncel taşıma fiyatı referansı — YÜKLET Akıllı Fiyat." />

      {/* AppBar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.header, borderBottom: `2px solid ${C.ink}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <button onClick={() => navigate(-1)} aria-label="Geri"
            style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, color: C.ink, cursor: "pointer" }}>
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 style={{ flex: 1, margin: 0, fontFamily: ARCH, fontSize: 17, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <Activity size={18} strokeWidth={2.6} /> Piyasa Nabzı
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: 16 }}>

        {/* özet bandı — koyu blok + hazard */}
        <div style={{ position: "relative", overflow: "hidden", background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "16px 16px", boxShadow: "4px 4px 0 rgba(10,10,10,.18)" }}>
          <div style={{ ...microLabel, color: "#9A988E" }}>YÜKLET AKILLI FİYAT REFERANSI</div>
          <div style={{ fontFamily: ARCH, fontSize: 20, fontWeight: 900, textTransform: "uppercase", color: "#fff", marginTop: 6, lineHeight: 1.1 }}>
            Taşıma fiyatları, gerçek işlemlerden
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 12 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, color: "#9A988E" }}>
              {pulse.samples} referans iş{pulse.settled ? ` · ${pulse.settled} tamamlanan sefer` : pulse.accepted ? ` · ${pulse.accepted} anlaşmalı` : ""}
            </span>
            <TrendPill trend={pulse.trend} />
          </div>
          <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 8, backgroundImage: HAZARD }} />
        </div>

        {/* kategori referansları */}
        <div>
          <h2 style={sectionTitle}>Kategori ortalaması</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
            {["hafriyat", "silobas"].map((c) => {
              const d = pulse.byCat[c];
              const rate = d ? d.rate : refRate(c);
              const estimated = !d;
              return (
                <div key={c} style={{ ...card, padding: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, padding: "2px 8px", borderRadius: 4, border: `2px solid ${C.ink}`, background: c === "hafriyat" ? C.ink : C.stone, color: c === "hafriyat" ? C.yellow : C.ink }}>
                      {CAT_LABEL[c]}
                    </span>
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, marginTop: 10, lineHeight: 1 }}>{rate ? fmtRate(rate) : "—"}</div>
                  <div style={{ ...microLabel, marginTop: 3 }}>₺ / TON-KM</div>
                  <div style={{ fontFamily: MONO, fontSize: 10, color: estimated ? C.yellowDeep : C.sub, marginTop: 8 }}>
                    {estimated ? "sezgisel tahmin" : `${d.n} işten${d.accepted ? ` · ${d.accepted} gerçek` : ""}`}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* güzergah hatları */}
        <div>
          <h2 style={sectionTitle}>En yoğun güzergahlar</h2>
          {pulse.lanes.length === 0 ? (
            <div style={{ ...card, padding: 16, marginTop: 12, textAlign: "center" }}>
              <p style={{ margin: 0, fontFamily: MONO, fontSize: 12, color: C.sub }}>Güzergah verisi birikiyor. İlanlar ve gerçekleşen işler arttıkça hatlar burada belirir.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
              {pulse.lanes.map((ln, i) => (
                <div key={i} style={{ ...card, padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                      <MapPin size={14} color={C.ink} style={{ flexShrink: 0 }} />
                      <span style={{ fontFamily: ARCH, fontSize: 13.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em" }} className="truncate">
                        {ln.from} → {ln.to}
                      </span>
                      {ln.settled > 0 && (
                        <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: "#fff", background: C.green, border: `1.5px solid ${C.ink}`, borderRadius: 4, padding: "1px 5px", textTransform: "uppercase" }}>✓ {ln.settled} sefer</span>
                      )}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, whiteSpace: "nowrap" }}>{fmtRate(ln.rate)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 7 }}>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>
                      ~{ln.km} km · {ln.n} iş{ln.settled ? ` · ${ln.settled} tamamlanan` : ln.accepted ? ` · ${ln.accepted} anlaşmalı` : ""}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.sub }}>
                      20t sefer ≈ {fmtTL(ln.sampleTrip)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* yük & araç yoğunluğu (likidite) */}
        {density.length > 0 && (
          <div>
            <h2 style={sectionTitle}>Yük & Araç Yoğunluğu</h2>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.muted, margin: "4px 0 0" }}>İl bazında açık yük (talep) ve araç (arz) dengesi.</p>
            <div style={{ ...card, marginTop: 12, overflow: "hidden" }}>
              {density.map((d, i) => {
                const dPct = d.total > 0 ? Math.round((d.demand / d.total) * 100) : 50;
                const toneColor = d.tone === "up" ? C.green : d.tone === "down" ? C.red : C.muted;
                return (
                  <div key={d.il} style={{ padding: "11px 14px", borderTop: i ? `1.5px solid ${C.line}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                        <span style={{ fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em" }} className="truncate">{d.il}</span>
                        {d.label !== "Az veri" && (
                          <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: "#fff", background: toneColor, border: `1.5px solid ${C.ink}`, borderRadius: 4, padding: "1px 6px", textTransform: "uppercase" }}>{d.label}</span>
                        )}
                      </span>
                      <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub }}>{d.demand} yük · {d.supply} araç</span>
                    </div>
                    {/* talep(sarı) / arz(koyu) dengesi çubuğu */}
                    <div style={{ display: "flex", height: 8, border: `1.5px solid ${C.ink}`, borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ width: `${dPct}%`, background: C.yellow }} />
                      <div style={{ width: `${100 - dPct}%`, background: C.ink }} />
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 8, fontFamily: MONO, fontSize: 9, color: C.muted }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: C.yellow, border: `1.5px solid ${C.ink}` }} /> YÜK (TALEP)</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: C.ink }} /> ARAÇ (ARZ)</span>
            </div>
          </div>
        )}

        {/* malzeme bazlı */}
        {pulse.materials.length > 0 && (
          <div>
            <h2 style={sectionTitle}>Malzeme bazlı ortalama</h2>
            <div style={{ ...card, marginTop: 12, overflow: "hidden" }}>
              {pulse.materials.map((m, i) => (
                <div key={m.material} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, padding: "11px 14px", borderTop: i ? `1.5px solid ${C.line}` : "none" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <Boxes size={14} color={C.muted} style={{ flexShrink: 0 }} />
                    <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600 }} className="truncate">{m.material}</span>
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                    <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint }}>{m.n} iş</span>
                    <span style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>{fmtRate(m.rate)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* yöntem notu */}
        <div style={{ display: "flex", gap: 11, alignItems: "flex-start", background: C.stone, border: `2px solid ${C.border}`, borderRadius: 6, padding: "12px 14px" }}>
          <Logo size="sm" />
          <p style={{ margin: 0, fontFamily: MONO, fontSize: 10.5, lineHeight: 1.55, color: C.sub }}>
            Fiyatlar kabul edilen teklifler ve sabit fiyatlı ilanlardan <b>₺/ton-km</b> olarak hesaplanır.
            Veri arttıkça referans keskinleşir. Bağlayıcı değildir, yol gösterir.
          </p>
        </div>

        {/* Fiyat Simülatörü girişi */}
        <button onClick={() => navigate("/fiyat-simulasyonu")}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 15px", cursor: "pointer", boxShadow: "3px 3px 0 rgba(10,10,10,.10)" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10, minWidth: 0 }}>
            <SlidersHorizontal size={18} color={C.ink} strokeWidth={2.4} />
            <span style={{ textAlign: "left", minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: ARCH, fontSize: 13.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>Fiyat Simülatörü</span>
              <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: C.sub }}>Kaydır, fiyatı canlı gör</span>
            </span>
          </span>
          <ArrowRight size={18} strokeWidth={2.5} />
        </button>

        {/* CTA */}
        <button onClick={() => navigate("/ilanlar")}
          style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.ink, color: C.yellow, fontFamily: ARCH, fontSize: 15, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px 0", cursor: "pointer", boxShadow: "4px 4px 0 rgba(10,10,10,.18)" }}>
          İlanlara göz at <ArrowRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
