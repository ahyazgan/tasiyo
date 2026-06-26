import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import SEO from "../components/SEO";

// ── Nasil Calisir — SAHA design language (2px ink border, hazard stripe,
// Archivo uppercase, Space Mono labels, hard offset shadow). Content preserved.

// SAHA palette (exact values)
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

// 3 rol kartlari (Muteahhit / Nakliyeci / Tedarikci)
const ROLES = [
  { ltr: "M", color: C.yellow, txt: C.ink, title: "Müteahhit / Alıcı", desc: "Taşınacak yükün için iş ilanı aç, gelen teklifleri karşılaştır, en uygun nakliyeciyle anlaş." },
  { ltr: "N", color: "#E7E2D6", txt: C.ink, title: "Nakliyeci / Taşıyıcı", desc: "Boş aracın için ilan ver ya da açık iş ilanlarına teklif gönder, dönüş yükünü doldur." },
  { ltr: "T", color: C.green, txt: "#FFFFFF", title: "Tedarikçi / Ocak", desc: "Ocak, santral veya kum ocağı stoğunu yayınla; müteahhit bulur, nakliyeyi platformda ayarla." },
];

// Akis chip'leri
const FLOW = [
  { t: "İlan Aç", on: "yellow" },
  { t: "Teklif Al", on: "card" },
  { t: "Eşleş", on: "green" },
  { t: "İş Başlar", on: "yellow" },
];

const STEPS = [
  { num: "01", title: "İlanını Yayınla", desc: "Taşınacak yükünü veya boş aracını birkaç dakikada ekle. Konum, miktar ve tarihi belirt." },
  { num: "02", title: "Teklifleri Topla", desc: "İlgili nakliyeciler veya iş sahipleri ilanını görür, sana teklif gönderir." },
  { num: "03", title: "Anlaş", desc: "Gelen teklifleri karşılaştır, en uygun olanla doğrudan iletişime geç ve anlaş." },
  { num: "04", title: "Yola Çık", desc: "İş tamamlandıktan sonra karşılıklı puanlama ile güvenli bir topluluk oluşturulur." },
];

const FAQ = [
  ["İlan vermek ücretli mi?", "Hayır. İlan vermek ve teklif almak ücretsizdir. Platform, iş sahibi ile nakliyeciyi komisyonsuz buluşturur."],
  ["Hangi işler için kullanabilirim?", "İki ana kategori vardır: Hafriyat (kazı, toprak, moloz taşıma) ve Silobas (dökme çimento, kum, mıcır, tahıl gibi yükler)."],
  ["İş ilanı mı araç ilanı mı vermeliyim?", "Taşınacak yükünüz varsa 'İş ilanı', boş aracınıza iş arıyorsanız 'Araç ilanı' verin. Karşı taraf size ulaşır."],
  ["Teklifler nasıl geliyor?", "İlanınız yayınlandıktan sonra ilgili kullanıcılar teklif verir veya doğrudan iletişime geçer. Teklifleri ilan detayında görürsünüz."],
  ["Ödeme platform üzerinden mi yapılıyor?", "Hayır, anlaşma ve ödeme taraflar arasında yapılır. Platform yalnızca eşleştirme ve iletişimi sağlar."],
];

const shell = { display: "flex", flexDirection: "column", minHeight: "100%", background: C.bg, fontFamily: BODY };
const sectionLabel = { fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted };
const cardBase = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" };

export default function NasilCalisirPage() {
  const navigate = useNavigate();

  return (
    <div style={shell}>
      <SEO title="Nasıl Çalışır" description="YÜKLET nasıl çalışır? 4 adımda hafriyat ve silobas yüklerinizi doğru araçla buluşturun." />

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
        <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Nasıl Çalışır</h1>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 20 }}>
        {/* Intro */}
        <div>
          <span style={sectionLabel}>3 TARAF · TEK SAHA</span>
          <h2 style={{ margin: "8px 0 0", fontFamily: ARCHIVO, fontSize: 24, fontWeight: 900, lineHeight: 1.12, letterSpacing: "-0.02em", color: C.ink }}>
            3 Tarafı Tek Sahada Buluştururuz
          </h2>
          <p style={{ margin: "10px 0 0", fontFamily: MONO, fontSize: 12, lineHeight: 1.6, color: C.sub }}>
            Müteahhit, nakliyeci ve tedarikçi — aynı zemin. Telefon trafiği yok, aracı zinciri yok.
          </p>
        </div>

        {/* Rol kartlari */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {ROLES.map((r) => (
            <div key={r.ltr} style={{ ...cardBase, display: "flex", alignItems: "flex-start", gap: 14, padding: 14 }}>
              <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 5, border: `2px solid ${C.ink}`, background: r.color, color: r.txt, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ARCHIVO, fontSize: 18, fontWeight: 900 }}>
                {r.ltr}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>{r.title}</div>
                <div style={{ marginTop: 4, fontFamily: BODY, fontSize: 12.5, lineHeight: 1.55, color: C.sub }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* AKIS — dark block */}
        <div style={{ position: "relative", overflow: "hidden", background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A", padding: "16px 16px 18px" }}>
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 18, backgroundImage: HAZARD }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: C.yellow }}>AKIŞ</span>
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, paddingRight: 14 }}>
            {FLOW.map((f, i) => (
              <span key={f.t} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em",
                    border: `2px solid ${C.ink}`, borderRadius: 5, padding: "6px 10px",
                    background: f.on === "yellow" ? C.yellow : f.on === "green" ? C.green : C.card,
                    color: f.on === "green" ? "#FFFFFF" : C.ink,
                  }}
                >
                  {f.t}
                </span>
                {i < FLOW.length - 1 && <span style={{ color: C.yellow, fontFamily: MONO, fontWeight: 700 }}>→</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Adimlar 01-04 */}
        <div>
          <span style={sectionLabel}>ADIM ADIM</span>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 12 }}>
            {STEPS.map((s) => (
              <div key={s.num} style={{ ...cardBase, display: "flex", alignItems: "flex-start", gap: 14, padding: 14 }}>
                <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: 5, border: `2px solid ${C.ink}`, background: C.yellow, color: C.ink, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 15, fontWeight: 700 }}>
                  {s.num}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>{s.title}</div>
                  <div style={{ marginTop: 4, fontFamily: BODY, fontSize: 12.5, lineHeight: 1.55, color: C.sub }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SSS */}
        <div>
          <span style={sectionLabel}>SIKÇA SORULAN SORULAR</span>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10 }}>
            {FAQ.map(([q, a]) => (
              <div key={q} style={{ ...cardBase, padding: 14 }}>
                <div style={{ fontFamily: ARCHIVO, fontSize: 13.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>{q}</div>
                <div style={{ marginTop: 6, fontFamily: BODY, fontSize: 12.5, lineHeight: 1.6, color: C.sub }}>{a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/ilan-ver")}
          style={{ width: "100%", border: `2px solid ${C.ink}`, borderRadius: 6, background: C.yellow, color: C.ink, padding: "14px", fontFamily: ARCHIVO, fontSize: 15, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}
        >
          Hemen Başla →
        </button>
      </div>
    </div>
  );
}
