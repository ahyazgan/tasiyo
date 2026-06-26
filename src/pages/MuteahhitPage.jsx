// YÜKLET — Müteahhit / İş Sahibi Landing (SAHA tasarım sistemi)
// Keskin endüstriyel dil: hazard şeritleri · koyu hero + CTA · Archivo 900 uppercase ·
// Space Mono veriler · 2px ink çerçeve · sert offset gölge · dev opak stroke ikon.
// Prop sözleşmesi DEĞİŞMEDİ: MuteahhitPage() — sadece navigate kullanır.

import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, ArrowRight, Check } from "lucide-react";
import SEO from "../components/SEO";
import Logo from "../components/Logo";

/* ── SAHA paleti (kesin değerler — _DESIGN_SYSTEM.md) ──────────────── */
const C = {
  ink: "#0A0A0A",
  yellow: "#FACC15",
  green: "#16803C",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  sub: "#5A5852",
  muted: "#9A968D",
  heroBody: "#C9C7C0",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const SHADOW = "6px 6px 0 rgba(10,10,10,.12)";
const SHADOW_SM = "3px 3px 0 #0A0A0A";
const FRAME = `2px solid ${C.ink}`;

/* sayfaya özgü içerik — Müteahhit / İş Sahibi */
const ROLE_LABEL = "MÜTEAHHİT / İŞ SAHİBİ";
const HERO_TITLE = ["Belgeli aracı", "dakikada bul"];

const HOW = [
  { n: "01", t: "İlanını ver", d: "Yükleme / boşaltma, yük tipi, miktar ve tarih. 2 dakika." },
  { n: "02", t: "Teklifleri karşılaştır", d: "Nakliyeciler fiyat ve araçla teklif yollar; puanlara bak." },
  { n: "03", t: "Anlaş & başla", d: "En uygun teklifi kabul et, doğrudan iletişime geç." },
];

const BENEFITS = [
  { t: "Anlık teklif", d: "İlanını ver, dakikalar içinde belgeli nakliyecilerden fiyat gelsin." },
  { t: "Malzemeyi kaynağından al", d: "Kum, mıcır, çimentoyu doğrudan ocak ve santrallerden sipariş et — aracısız." },
  { t: "Belgeli & puanlı", d: "Sadece K belgeli, geçmişi doğrulanmış araç ve tedarikçilerle çalış." },
  { t: "Her yük tipi", d: "Hafriyat, kum, çakıl, mıcır, çimento — hepsi tek yerde." },
  { t: "Konuma yakın", d: "Şantiyene en yakın boş araçlar öne çıkar, boş sefer maliyeti düşer." },
];

/* ── İmza parçaları ────────────────────────────────────────────────── */
function Hazard({ h = 8 }) {
  return <div style={{ backgroundImage: HAZARD, height: h, width: "100%" }} />;
}

function SectionTitle({ children }) {
  return (
    <span
      className="mb-3 flex items-center gap-2.5 text-[12px] font-extrabold uppercase"
      style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}
    >
      <span className="inline-block" style={{ width: 4, height: 14, background: C.yellow }} />
      {children}
    </span>
  );
}

export default function MuteahhitPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-[460px]" style={{ background: C.bg, color: C.ink }}>
      <SEO
        title="Müteahhit & Alıcı"
        description="Şantiyen için hafriyat ve döküm yük nakliyesi artık çok kolay. Anlık teklif al, belgeli araçlarla çalış."
      />

      {/* üst hazard şeridi */}
      <Hazard />

      {/* HERO — koyu blok */}
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative overflow-hidden px-[18px] pb-9 pt-7"
        style={{ background: "#0A0A0A" }}
      >
        {/* köşede dev opak stroke ikon */}
        <Truck
          size={230}
          strokeWidth={1.4}
          className="pointer-events-none absolute -right-10 -top-8"
          style={{ color: C.yellow, opacity: 0.12 }}
        />

        {/* logo satırı */}
        <div className="mb-6 flex items-center">
          <Logo size="md" onDark />
        </div>

        {/* mono rol etiketi */}
        <div className="mb-3 text-[10px] font-bold uppercase" style={{ color: C.yellow, fontFamily: MONO, letterSpacing: "0.08em" }}>
          {ROLE_LABEL}
        </div>

        {/* Archivo 30px 900 2-satır başlık */}
        <h1 className="text-[30px] font-black uppercase leading-[1.02]" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.02em" }}>
          {HERO_TITLE[0]}<br />{HERO_TITLE[1]}
        </h1>

        {/* gövde + sarı vurgu */}
        <p className="mt-4 max-w-[300px] text-[13px] font-medium leading-relaxed" style={{ color: C.heroBody }}>
          Yüklerini belgeli nakliyecilere taşıt; kum, mıcır, çimentoyu ocak ve santrallerden doğrudan sipariş et. Tek platformda.{" "}
          <span style={{ color: C.yellow, fontWeight: 700 }}>%0 komisyon.</span>
        </p>

        {/* sarı CTA + ikincil */}
        <div className="mt-6 flex flex-col gap-2.5">
          <button
            onClick={() => navigate("/ilan-ver")}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3.5 text-[13px] font-extrabold uppercase"
            style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH, boxShadow: SHADOW_SM }}
          >
            İlan ver — ücretsiz <ArrowRight size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate("/ilanlar?type=urun")}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 text-[12px] font-extrabold uppercase"
            style={{ background: "transparent", color: C.yellow, border: `2px solid ${C.yellow}`, borderRadius: 6, fontFamily: ARCH }}
          >
            Malzeme ilanlarına bak <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </div>
      </motion.section>

      {/* alt hazard şeridi */}
      <Hazard />

      {/* 3 ADIMDA İŞ */}
      <section className="px-[18px] pt-7">
        <SectionTitle>3 Adımda İş</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {HOW.map((s, i) => {
            const accent = i === 2;
            return (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center gap-3 p-3"
                style={{ background: accent ? C.yellow : C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
              >
                {/* 42px siyah kare mono numara */}
                <div
                  className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center text-[15px] font-bold"
                  style={{ background: C.ink, color: C.yellow, borderRadius: 6, fontFamily: MONO }}
                >
                  {s.n}
                </div>
                <div className="min-w-0">
                  <div className="text-[14px] font-extrabold uppercase leading-tight" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>
                    {s.t}
                  </div>
                  <div className="mt-1 text-[11px] font-bold uppercase leading-snug" style={{ color: accent ? C.ink : C.sub, fontFamily: MONO }}>
                    {s.d}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* NEDEN YÜKLET? */}
      <section className="px-[18px] pt-7">
        <SectionTitle>Neden YÜKLET?</SectionTitle>
        <div className="flex flex-col gap-2.5">
          {BENEFITS.map((b) => (
            <div
              key={b.t}
              className="flex items-start gap-3 p-3"
              style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: SHADOW_SM }}
            >
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center"
                style={{ border: `2px solid ${C.green}`, borderRadius: 6 }}
              >
                <Check size={17} strokeWidth={3} style={{ color: C.green }} />
              </div>
              <div className="min-w-0 pt-0.5">
                <div className="text-[13px] font-extrabold uppercase leading-tight" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>
                  {b.t}
                </div>
                <div className="mt-1 text-[11.5px] font-medium leading-snug" style={{ color: C.sub }}>
                  {b.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* KAPANIŞ CTA — koyu blok */}
      <section className="px-[18px] pb-10 pt-7">
        <div className="relative overflow-hidden" style={{ background: "#0A0A0A", border: FRAME, borderRadius: 6, boxShadow: SHADOW }}>
          <Hazard />
          <div className="px-5 pb-5 pt-5">
            {/* güven sayıları */}
            <div className="mb-5 grid grid-cols-3 overflow-hidden" style={{ border: `2px solid #222`, borderRadius: 6 }}>
              {[
                { v: "850+", l: "Nakliyeci" },
                { v: "320+", l: "Tedarikçi" },
                { v: "%0", l: "Komisyon" },
              ].map((it, i) => (
                <div key={it.l} className="px-2 py-3 text-center" style={i > 0 ? { borderLeft: "2px solid #222" } : undefined}>
                  <div style={{ fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.yellow }}>{it.v}</div>
                  <div className="mt-1 text-[8px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: "0.06em" }}>{it.l}</div>
                </div>
              ))}
            </div>
            <div className="text-[18px] font-black uppercase leading-tight" style={{ color: "#FFFFFF", fontFamily: ARCH, letterSpacing: "-0.02em" }}>
              Hemen başla — ücretsiz
            </div>
            <div className="mb-4 mt-1 text-[10px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO }}>
              Kayıt ol, ilk ilanını 2 dakikada ver.
            </div>
            <button
              onClick={() => navigate("/ilan-ver")}
              className="inline-flex w-full items-center justify-center gap-1.5 px-5 py-3.5 text-[13px] font-extrabold uppercase"
              style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH }}
            >
              Ücretsiz Başla <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
