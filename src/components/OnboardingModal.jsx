import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo";

// ── SAHA Onboarding — ilk açılışta 3 adımlı tanıtım turu (bir kez gösterilir).
// 1) Hoş geldin/değer 2) Nasıl çalışır 3) Rol seç. Her adımda geçilebilir.
// 2px ink çerçeve · hazard şeridi · Archivo uppercase · Space Mono.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", card: "#FFFFFF",
  stone: "#F4F1EA", sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const FRAME = `2px solid ${C.ink}`;

const ROLES = [
  { letter: "M", title: "Müteahhit / Alıcı", desc: "Yük taşıtmak istiyorum", route: "/muteahhit", bg: C.yellow, fg: C.ink },
  { letter: "N", title: "Nakliyeci / Taşıyıcı", desc: "Aracımla iş arıyorum", route: "/nakliyeci", bg: C.stone, fg: C.ink },
  { letter: "T", title: "Tedarikçi / Ocak", desc: "Malzeme satıyorum", route: "/tedarikci", bg: C.green, fg: "#FFFFFF" },
];

const STEPS = [
  { n: "1", title: "İlanını aç", desc: "İş, araç veya ürün ilanını dakikalar içinde yayınla." },
  { n: "2", title: "Teklif al / ver", desc: "Nakliyeciler teklif verir; en uygununu seç." },
  { n: "3", title: "Anlaş, taşı", desc: "Güvenli iletişim, emanet ödeme, değerlendirme." },
];

export default function OnboardingModal({ onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: hoş geldin · 1: nasıl çalışır · 2: rol
  const finish = (route) => { onClose?.(); if (route) navigate(route); };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,.55)" }}>
      <div className="w-full max-w-[420px] overflow-hidden" style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: "6px 6px 0 rgba(10,10,10,.18)" }}>
        <div style={{ height: 7, backgroundImage: HAZARD }} />

        <div className="p-7">
          <div className="mb-3.5 flex justify-center"><Logo size="lg" /></div>

          {/* ── ADIM 0: Hoş geldin ── */}
          {step === 0 && (
            <>
              <h2 className="text-center text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>Hoş Geldin</h2>
              <p className="mb-6 mt-1.5 text-center text-[12.5px]" style={{ color: C.sub, fontFamily: MONO, lineHeight: 1.55 }}>
                Hafriyat ve dökme yükü doğru araçla, <b style={{ color: C.ink }}>komisyonsuz</b> buluşturuyoruz. Müteahhit, nakliyeci ve tedarikçi tek platformda.
              </p>
            </>
          )}

          {/* ── ADIM 1: Nasıl çalışır ── */}
          {step === 1 && (
            <>
              <h2 className="text-center text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>Nasıl Çalışır?</h2>
              <div className="mb-6 mt-4 flex flex-col gap-2.5">
                {STEPS.map((s) => (
                  <div key={s.n} className="flex items-center gap-3.5 p-3" style={{ border: FRAME, borderRadius: 6, background: C.card }}>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center text-[15px] font-extrabold" style={{ border: FRAME, borderRadius: "50%", background: C.ink, color: C.yellow, fontFamily: MONO }}>{s.n}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>{s.title}</span>
                      <span className="mt-0.5 block text-[10px]" style={{ color: C.sub, fontFamily: MONO }}>{s.desc}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── ADIM 2: Rol seç ── */}
          {step === 2 && (
            <>
              <h2 className="text-center text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>Sen Hangisisin?</h2>
              <p className="mb-5 mt-1.5 text-center text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>Sana uygun başlangıç için rolünü seç.</p>
              <div className="flex flex-col gap-2.5">
                {ROLES.map((r) => (
                  <button key={r.title} onClick={() => finish(r.route)} className="flex items-center gap-3.5 p-3.5 text-left transition hover:-translate-y-0.5" style={{ border: FRAME, borderRadius: 6, background: C.card }}>
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center text-[18px] font-extrabold" style={{ border: FRAME, borderRadius: 5, background: r.bg, color: r.fg, fontFamily: ARCH }}>{r.letter}</span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>{r.title}</span>
                      <span className="mt-0.5 block text-[10px]" style={{ color: C.sub, fontFamily: MONO }}>{r.desc}</span>
                    </span>
                    <span className="ml-auto flex-shrink-0" style={{ color: C.ink }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* adım noktaları */}
          <div className="mb-1 mt-5 flex justify-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ width: i === step ? 18 : 7, height: 7, background: i === step ? C.ink : C.muted, borderRadius: 4, transition: "width .2s" }} />
            ))}
          </div>

          {/* gezinme */}
          {step < 2 ? (
            <div className="mt-4 flex items-center gap-2.5">
              <button onClick={() => finish(null)} className="text-[11px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: "0.02em", flexShrink: 0, padding: "12px 6px", background: "transparent", border: "none", cursor: "pointer" }}>Geç</button>
              <button onClick={() => setStep((s) => s + 1)} className="flex-1 text-[13px] font-extrabold uppercase" style={{ fontFamily: ARCH, letterSpacing: "-0.01em", color: C.ink, background: C.yellow, border: FRAME, borderRadius: 6, padding: "13px 0", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}>İleri →</button>
            </div>
          ) : (
            <button onClick={() => finish(null)} className="mt-4 w-full text-center text-[11px] font-bold uppercase" style={{ color: C.muted, fontFamily: MONO, letterSpacing: "0.02em", background: "transparent", border: "none", cursor: "pointer" }}>Şimdilik geç, keşfet →</button>
          )}
        </div>
      </div>
    </div>
  );
}
