import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Package, Truck, Boxes, ChevronLeft, Inbox } from "lucide-react";
import { CATS } from "../data/categories";
import CategoryIcon from "../components/CategoryIcon";
import SEO from "../components/SEO";
import Logo from "../components/Logo";

// ── SAHA Tekliflerim & Siparişlerim — alıcı/nakliyeci gönderdiği teklif ve
//    siparişleri durumuna göre (beklemede / onaylandı / reddedildi) izler.

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", green: "#16803C",
  red: "#DC2626", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, monospace";
const HEAD = "'Archivo', sans-serif";
const BODY = "'Plus Jakarta Sans', system-ui, sans-serif";

const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, display: "flex", flexDirection: "column", color: C.ink, fontFamily: BODY,
};

const TABS = [
  { key: "beklemede", label: "Bekleyen" },
  { key: "kabul", label: "Onaylanan" },
  { key: "ret", label: "Reddedilen" },
];

const STATUS = {
  beklemede: { label: "BEKLEMEDE", bg: C.yellow, fg: C.ink },
  kabul: { label: "ONAYLANDI", bg: C.green, fg: "#fff" },
  ret: { label: "REDDEDİLDİ", bg: C.sub, fg: "#fff" },
};

const fmtTL = (n) => "₺" + Number(n).toLocaleString("tr-TR");

export default function TekliflerimPage({ listings = [], offers = [], user, onRequireAuth }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState("beklemede");

  if (!user) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 20px", gap: 16, textAlign: "center" }}>
        <SEO title="Tekliflerim" description="Gönderdiğiniz teklif ve siparişleri takip edin." />
        <Logo size="lg" />
        <h1 style={{ fontFamily: HEAD, fontSize: 21, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, lineHeight: 1.15, margin: 0 }}>Tekliflerinizi görmek için giriş yapın</h1>
        <p style={{ fontFamily: BODY, fontSize: 13.5, color: C.sub, margin: 0, maxWidth: 300 }}>Verdiğiniz teklif ve siparişlerin durumunu burada izlersiniz.</p>
        <button onClick={() => onRequireAuth?.()} style={{ marginTop: 4, cursor: "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", boxShadow: "3px 3px 0 #0A0A0A" }}>
          Giriş yap / Kayıt ol
        </button>
      </div>
    );
  }

  const mine = offers
    .filter((o) => String(o.fromUserId) === String(user.id))
    .map((o) => ({ o, l: listings.find((x) => String(x.id) === String(o.listingId)) }))
    .filter((x) => x.l)
    .sort((a, b) => String(b.o.createdAt || "").localeCompare(String(a.o.createdAt || "")));

  const counts = {
    beklemede: mine.filter((x) => x.o.status === "beklemede").length,
    kabul: mine.filter((x) => x.o.status === "kabul").length,
    ret: mine.filter((x) => x.o.status === "ret").length,
  };
  const visible = mine.filter((x) => (x.o.status || "beklemede") === tab);

  return (
    <div style={shell}>
      <SEO title="Tekliflerim & Siparişlerim" description="Gönderdiğiniz teklif ve siparişleri durumuna göre takip edin." />

      {/* Header */}
      <header style={{ background: C.header, padding: "20px 18px 16px", borderBottom: `2px solid ${C.ink}` }}>
        <button onClick={() => navigate(-1)} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub, padding: 0, marginBottom: 10 }}>
          <ChevronLeft size={15} strokeWidth={2.5} /> Geri
        </button>
        <h1 style={{ fontFamily: HEAD, fontSize: 27, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, lineHeight: 1, margin: 0 }}>Tekliflerim</h1>
        <p style={{ fontFamily: MONO, fontSize: 11, color: C.sub, margin: "6px 0 0" }}>{mine.length} TEKLİF / SİPARİŞ · DURUM TAKİBİ</p>

        {/* Tabs */}
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
                }}
              >
                {t.label} ({counts[t.key]})
              </button>
            );
          })}
        </div>
      </header>

      {/* List */}
      <main style={{ flex: 1, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
        {visible.length === 0 ? (
          <div style={{ marginTop: 40, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, textAlign: "center" }}>
            <Inbox size={40} color={C.muted} strokeWidth={1.8} />
            <p style={{ fontFamily: MONO, fontSize: 12, color: C.sub, margin: 0 }}>Bu durumda teklif/sipariş yok.</p>
            <button onClick={() => navigate("/ilanlar")} style={{ cursor: "pointer", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 18px", fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", boxShadow: "3px 3px 0 #0A0A0A" }}>
              İlanlara Göz At
            </button>
          </div>
        ) : (
          visible.map(({ o, l }) => {
            const cat = CATS.find((c) => c.id === l.cat);
            const isOrder = o.kind === "siparis";
            const st = STATUS[o.status] || STATUS.beklemede;
            const matched = l.status === "eslesti";
            const Icon = isOrder ? Boxes : l.type === "arac" ? Truck : Package;
            return (
              <article key={o.id} style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden", boxShadow: "6px 6px 0 rgba(10,10,10,.12)" }}>
                {/* Top */}
                <div style={{ padding: 14, borderBottom: `1.5px solid ${C.stone}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "3px 8px", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: C.ink }}>
                      <Icon size={12} strokeWidth={2.4} /> {isOrder ? "SİPARİŞ" : "TEKLİF"}
                    </span>
                    {cat && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>
                        <CategoryIcon catId={l.cat} size={12} fallback={cat.icon} /> {cat.name || l.cat}
                      </span>
                    )}
                    <span style={{ marginLeft: "auto", background: st.bg, color: st.fg, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "3px 8px", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
                      {st.label}
                    </span>
                  </div>
                  <h3 onClick={() => navigate(`/ilan/${l.id}`)} style={{ fontFamily: HEAD, fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, margin: "0 0 6px", cursor: "pointer", lineHeight: 1.12 }}>
                    {l.title}
                  </h3>
                  <p style={{ fontFamily: MONO, fontSize: 11, color: C.sub, margin: 0, lineHeight: 1.5 }}>
                    {[
                      l.il ? `${l.il}${l.ilce ? " / " + l.ilce : ""}` : null,
                      l.material || null,
                      isOrder && o.qty != null ? `İstenen: ${Number(o.qty).toLocaleString("tr-TR")} ${o.unit || l.unit || "ton"}` : null,
                    ].filter(Boolean).join(" · ")}
                  </p>
                </div>

                {/* Bottom: price + action */}
                <div style={{ padding: 14, display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.muted, textTransform: "uppercase" }}>
                      {isOrder ? "BİRİM FİYAT TEKLİFİN" : "TEKLİF FİYATIN"}
                    </div>
                    <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 900, color: C.ink }}>
                      {o.price != null && o.price !== "" ? fmtTL(o.price) : "Pazarlık"}
                    </div>
                  </div>
                  {o.status === "kabul" && matched ? (
                    <button onClick={() => navigate(isOrder ? `/ilan/${l.id}` : `/takip/${l.id}`)} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", background: C.green, color: "#fff", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "9px 13px", fontFamily: HEAD, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                      {isOrder ? "Detay" : "Takip Et"} <ArrowRight size={14} strokeWidth={2.6} />
                    </button>
                  ) : (
                    <button onClick={() => navigate(`/mesajlar`)} style={{ display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "9px 13px", fontFamily: HEAD, fontSize: 12, fontWeight: 800, textTransform: "uppercase" }}>
                      Mesaj <ArrowRight size={14} strokeWidth={2.6} />
                    </button>
                  )}
                </div>
              </article>
            );
          })
        )}
      </main>
    </div>
  );
}
