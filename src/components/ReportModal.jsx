import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";

// ── SAHA report modal. Sharp 2px ink frame, Archivo uppercase, Space Mono sub.
const REASONS = ["Yanıltıcı / sahte ilan", "Dolandırıcılık şüphesi", "Uygunsuz içerik", "Ödeme / anlaşma sorunu", "İletişim kurulamıyor", "Diğer"];

const INK = "#0A0A0A";
const YELLOW = "#FACC15";
const GREEN = "#16803C";
const STONE = "#F4F1EA";
const SUB = "#5A5852";

const ARCHIVO = { fontFamily: "'Archivo',sans-serif", fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" };
const FRAME = { border: `2px solid ${INK}`, borderRadius: 6 };

export default function ReportModal({ targetLabel, onSubmit, onClose }) {
  const [reason, setReason] = useState(REASONS[0]);
  const [desc, setDesc] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => { onSubmit?.({ reason, desc: desc.trim() }); setDone(true); };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{ background: "rgba(10,10,10,.7)" }} onClick={onClose}>
      <div className="w-full max-w-[420px] bg-white p-6" style={{ ...FRAME, boxShadow: "6px 6px 0 rgba(10,10,10,.3)" }} onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-6 text-center">
            {/* success: green 2px-frame square check */}
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center"
              style={{ background: GREEN, border: `2px solid ${INK}`, borderRadius: 6, color: "#fff" }}
            >
              <Check size={28} strokeWidth={3} />
            </div>
            <div style={{ ...ARCHIVO, fontSize: 18, color: INK }}>Bildirimin Alındı</div>
            <p className="mt-2 text-sm" style={{ color: SUB }}>Ekibimiz en kısa sürede inceleyecek. Teşekkürler.</p>
            <button
              onClick={onClose}
              className="mt-5 px-6 py-2.5"
              style={{ ...ARCHIVO, fontSize: 13, background: INK, color: YELLOW, ...FRAME }}
            >
              Kapat
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ ...ARCHIVO, fontSize: 18, color: INK }}>Sorun Bildir</h2>
            {targetLabel && <p className="mb-4 mt-1 text-sm" style={{ fontFamily: "'Space Mono',monospace", color: SUB }}>{targetLabel}</p>}

            <label className="mb-1.5 block text-xs font-bold" style={{ ...ARCHIVO, fontSize: 11, color: SUB }}>Sebep</label>
            <div className="relative">
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full appearance-none bg-white px-3.5 py-3 text-sm outline-none"
                style={{ ...FRAME, color: INK, paddingRight: 38 }}
              >
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              <ChevronDown size={18} strokeWidth={2.5} color={INK} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
            </div>

            <label className="mb-1.5 mt-3 block text-xs font-bold" style={{ ...ARCHIVO, fontSize: 11, color: SUB }}>Açıklama</label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ne oldu? (opsiyonel)"
              className="w-full bg-white px-3.5 py-3 text-sm outline-none"
              style={{ ...FRAME, color: INK, minHeight: 84, resize: "vertical" }}
            />

            <div className="mt-5 flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 py-3 text-sm"
                style={{ ...ARCHIVO, fontSize: 13, background: STONE, color: INK, ...FRAME }}
              >
                Vazgeç
              </button>
              <button
                onClick={submit}
                className="flex-1 py-3 text-sm"
                style={{ ...ARCHIVO, fontSize: 13, background: YELLOW, color: INK, ...FRAME }}
              >
                Gönder
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
