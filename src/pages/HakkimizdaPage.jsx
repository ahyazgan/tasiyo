import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

// ── Hakkimizda — SAHA design language (dark hero w/ hazard, 2px ink border,
// Archivo uppercase, Space Mono labels, hard offset shadow). Content preserved.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
};
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const BODY = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const STATS = [
  ["1000+", "Aktif İlan"],
  ["500+", "Nakliyeci"],
  ["%0", "Komisyon"],
];

const VALUES = [
  { ltr: "Ş", title: "Şeffaflık", desc: "Açık ilanlar, gizli ücret yok. Fiyat ve koşullar baştan ortada." },
  { ltr: "G", title: "Güven", desc: "Belgeli araçlar, karşılıklı puanlama. Sahanın doğruladığı bir ağ." },
  { ltr: "S", title: "Saha Dili", desc: "Hafriyatçının, silobasçının diliyle konuşan sade bir araç." },
];

const shell = { display: "flex", flexDirection: "column", minHeight: "100%", background: C.bg, fontFamily: BODY };
const sectionLabel = { fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted };
const cardBase = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" };

export default function HakkimizdaPage() {
  const navigate = useNavigate();

  return (
    <div style={shell}>
      <SEO title="Hakkımızda" description="YÜKLET hakkında bilgi edinin. Türkiye'nin yük & nakliye eşleştirme platformu." />

      {/* App bar */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 20, background: C.header,
          borderBottom: `2px solid ${C.ink}`, display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
        }}
      >
        <button
          onClick={() => navigate(-1)} aria-label="Geri"
          style={{ border: `2px solid ${C.ink}`, background: C.card, borderRadius: 6, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.ink }}
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Hakkımızda</h1>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Dark hero — Misyon */}
        <div style={{ position: "relative", overflow: "hidden", background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A", padding: "18px 18px 20px" }}>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 18, backgroundImage: HAZARD }} />
          <div style={{ paddingRight: 14 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.yellow }}>MİSYON</span>
            <h2 style={{ margin: "8px 0 0", fontFamily: ARCHIVO, fontSize: 24, fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.02em", color: "#FFFFFF" }}>
              Sahanın Yükünü Dijitale Taşıyoruz
            </h2>
            <p style={{ margin: "12px 0 0", fontFamily: BODY, fontSize: 13, lineHeight: 1.6, color: "#C9C7C0" }}>
              YÜKLET, hafriyat ve silobas taşımacılığında yükü olan ile boş aracı olan tarafı doğrudan buluşturur. Telefon trafiğini ve aracı zincirini ortadan kaldırarak doğru aracı doğru işe hızlıca ulaştırırız.
            </p>
            <p style={{ margin: "10px 0 0", fontFamily: BODY, fontSize: 13, lineHeight: 1.6, color: "#C9C7C0" }}>
              Şeffaf ilanlar, karşılıklı puanlama ve komisyonsuz eşleştirme ile nakliye sektöründe yeni bir standart belirliyoruz.
            </p>
          </div>
        </div>

        {/* Vizyon */}
        <div style={{ ...cardBase, padding: 16 }}>
          <span style={sectionLabel}>VİZYON</span>
          <p style={{ margin: "10px 0 0", fontFamily: BODY, fontSize: 13, lineHeight: 1.6, color: C.sub }}>
            Türkiye'nin dökme yük ve hafriyat taşımacılığında en çok kullanılan dijital eşleştirme ağı olmak; her müteahhidin ve her nakliyecinin boş kapasiteyi değerlendirebildiği bir ekosistem kurmak.
          </p>
        </div>

        {/* Guven sayilari — 3 sutun */}
        <div>
          <span style={sectionLabel}>RAKAMLARLA YÜKLET</span>
          <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
            {STATS.map(([num, label]) => (
              <div key={label} style={{ ...cardBase, padding: "14px 8px", textAlign: "center" }}>
                <div style={{ fontFamily: MONO, fontSize: 20, fontWeight: 700, color: C.ink }}>{num}</div>
                <div style={{ marginTop: 4, fontFamily: BODY, fontSize: 11, color: C.sub }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* DEGERLERIMIZ — yellow bar baslik */}
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `2px solid ${C.ink}`, borderRadius: 5, background: C.yellow, padding: "6px 12px" }}>
            <span style={{ fontFamily: ARCHIVO, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>Değerlerimiz</span>
          </div>
          <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 12 }}>
            {VALUES.map((v) => (
              <div key={v.title} style={{ ...cardBase, display: "flex", alignItems: "flex-start", gap: 14, padding: 14 }}>
                <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 5, border: `2px solid ${C.ink}`, background: C.ink, color: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ARCHIVO, fontSize: 18, fontWeight: 900 }}>
                  {v.ltr}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>{v.title}</div>
                  <div style={{ marginTop: 4, fontFamily: BODY, fontSize: 12.5, lineHeight: 1.55, color: C.sub }}>{v.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA — sarisi katil */}
        <button
          onClick={() => navigate("/")}
          style={{ width: "100%", border: `2px solid ${C.ink}`, borderRadius: 6, background: C.yellow, color: C.ink, padding: "14px", fontFamily: ARCHIVO, fontSize: 15, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}
        >
          Sahaya Katıl →
        </button>
      </div>
    </div>
  );
}
