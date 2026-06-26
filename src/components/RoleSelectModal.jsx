import { useState } from "react";

// ── SAHA rol seçim modalı. Google/Apple ile ilk girişten sonra, rolü olmayan
// kullanıcıya gösterilir. Seçilen rol profile yazılır (onSelect). Kapatılamaz —
// rol seçmeden devam edilmez (platform akışı role bağlı).
//   onSelect("isveren" | "nakliyeci" | "tedarikci")  ->  Promise

const C = { ink: "#0A0A0A", yellow: "#FACC15", card: "#FFFFFF", sub: "#5A5852", red: "#DC2626" };
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
const FRAME = `2px solid ${C.ink}`;

const ROLES = [
  { id: "isveren", label: "Müteahhit / Alıcı", desc: "İş ilanı açar, teklif alır" },
  { id: "nakliyeci", label: "Nakliyeci / Taşıyıcı", desc: "Araç ilanı açar, yük taşır" },
  { id: "tedarikci", label: "Tedarikçi", desc: "Malzeme satar: ocak, beton, kum" },
];

export default function RoleSelectModal({ onSelect }) {
  const [role, setRole] = useState("isveren");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const confirm = async () => {
    setBusy(true); setError("");
    try {
      await onSelect(role);
    } catch (err) {
      setError(err?.message || "Kaydedilemedi, tekrar dene."); setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,.55)" }}>
      <div
        className="relative w-full max-w-[410px]"
        style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: "6px 6px 0 rgba(10,10,10,.18)" }}
      >
        <div style={{ height: 7, backgroundImage: HAZARD }} />
        <div className="p-7">
          <div className="mb-5 text-center">
            <h3 className="text-[20px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>
              Sen Kimsin?
            </h3>
            <p className="mt-1.5 text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>
              Rolünü seç — sana uygun ekranı açalım
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {ROLES.map((r) => {
              const on = role === r.id;
              return (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className="flex items-center justify-between gap-2 p-3 text-left transition"
                  style={{ border: FRAME, borderRadius: 6, background: on ? C.yellow : C.card }}
                >
                  <div>
                    <div className="text-[13px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>{r.label}</div>
                    <div className="mt-0.5 text-[10px]" style={{ color: on ? "#3d3a2a" : C.sub, fontFamily: MONO }}>{r.desc}</div>
                  </div>
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center" style={{ border: FRAME, borderRadius: 4, background: on ? C.ink : C.card, color: C.yellow }}>
                    {on && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
                  </span>
                </button>
              );
            })}
          </div>

          {error && (
            <div className="mt-4 px-3 py-2.5 text-[12px] font-bold" style={{ border: `2px solid ${C.red}`, borderRadius: 6, color: C.red, background: "#FEF2F2", fontFamily: MONO }}>
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="mt-5 w-full py-3 text-[14px] font-extrabold uppercase transition disabled:opacity-60"
            style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH, letterSpacing: "-0.01em", boxShadow: "3px 3px 0 #0A0A0A" }}
          >
            {busy ? "Kaydediliyor…" : "Devam Et →"}
          </button>
        </div>
      </div>
    </div>
  );
}
