import { useState } from "react";
import Logo from "./Logo";

// ── SAHA Giriş modal — GOOGLE / APPLE ile giriş (OAuth, şifresiz). 2px ink çerçeve
// · hazard şeridi · Archivo uppercase · Space Mono. Sağlayıcıya yönlendirir; rol
// Google/Apple'dan gelmez → ilk girişten sonra RoleSelectModal ile seçilir.
//   onProvider("google" | "apple")  ->  { ok, error? }  ·  onClose

/* SAHA paleti (kesin değerler — _DESIGN_SYSTEM.md) */
const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  card: "#FFFFFF", sub: "#5A5852",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const FRAME = `2px solid ${C.ink}`;

// Google "G" çok renkli logosu
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 44 24c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2A12 12 0 0 1 12.7 28l-6.6 5.1A20 20 0 0 0 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.4 12.8c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.1-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.4 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-1.1 2.8-2.2c.9-1.3 1.2-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.2 6c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.8-1 2.9 1 .1 2.1-.5 2.8-1.3z" />
    </svg>
  );
}

export default function AuthModal({ onClose, onProvider }) {
  const [busy, setBusy] = useState("");   // "google" | "apple" | ""
  const [error, setError] = useState("");

  const go = async (provider) => {
    setBusy(provider); setError("");
    try {
      const res = await onProvider(provider);
      if (res && res.ok === false) { setError(res.error || "Giriş başlatılamadı."); setBusy(""); }
      // ok ise tarayıcı sağlayıcıya yönlendirilir; modal kapanışı dönüşte olur.
    } catch (err) {
      setError(err?.message || "Bir hata oluştu."); setBusy("");
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(10,10,10,.55)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[410px]"
        style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: "6px 6px 0 rgba(10,10,10,.18)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* üst hazard şeridi */}
        <div style={{ height: 7, backgroundImage: HAZARD }} />

        <div className="p-7">
          {/* kapat */}
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3.5 top-[26px] flex h-9 w-9 items-center justify-center"
            style={{ background: C.card, border: FRAME, borderRadius: 5, color: C.ink }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
          </button>

          {/* logo + başlık */}
          <div className="mb-6 text-center">
            <div className="mb-3.5 flex justify-center">
              <Logo size="lg" />
            </div>
            <h3 className="text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>
              Giriş Yap
            </h3>
            <p className="mt-1.5 text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>
              Hesabınla devam et — kayıt ayrı değil
            </p>
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 text-[12px] font-bold" style={{ border: `2px solid ${C.red}`, borderRadius: 6, color: C.red, background: "#FEF2F2", fontFamily: MONO }}>
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* Google */}
            <button
              type="button"
              onClick={() => go("google")}
              disabled={Boolean(busy)}
              className="flex items-center justify-center gap-3 py-3.5 text-[14px] font-extrabold uppercase transition disabled:opacity-60"
              style={{ background: C.card, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH, letterSpacing: "-0.01em", boxShadow: "3px 3px 0 #0A0A0A" }}
            >
              <GoogleIcon />
              {busy === "google" ? "Yönlendiriliyor…" : "Google ile Devam Et"}
            </button>

            {/* Apple */}
            <button
              type="button"
              onClick={() => go("apple")}
              disabled={Boolean(busy)}
              className="flex items-center justify-center gap-3 py-3.5 text-[14px] font-extrabold uppercase transition disabled:opacity-60"
              style={{ background: C.ink, color: C.card, border: FRAME, borderRadius: 6, fontFamily: ARCH, letterSpacing: "-0.01em", boxShadow: "3px 3px 0 rgba(10,10,10,.35)" }}
            >
              <AppleIcon />
              {busy === "apple" ? "Yönlendiriliyor…" : "Apple ile Devam Et"}
            </button>
          </div>

          {/* yasal not */}
          <p className="mt-5 text-center text-[10px] leading-relaxed" style={{ color: C.sub, fontFamily: MONO }}>
            Devam ederek <span style={{ fontWeight: 700, color: C.ink }}>Kullanım Koşulları</span> ve{" "}
            <span style={{ fontWeight: 700, color: C.ink }}>Gizlilik Politikası</span>'nı kabul edersin.
          </p>
        </div>
      </div>
    </div>
  );
}
