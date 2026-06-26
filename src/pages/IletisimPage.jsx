import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Phone, Mail, MessageCircle, MapPin, Check } from "lucide-react";
import { validateForm } from "../utils/validation";
import SEO from "../components/SEO";

// ── Iletisim — SAHA design language (2px ink border, stroke icons, mono labels,
// Archivo uppercase, hard offset shadow). Form state / submit / validation preserved 1:1.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  red: "#DC2626",
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

const FIELDS = [
  { key: "name", label: "Ad Soyad *", type: "text", placeholder: "Adınız Soyadınız", required: true },
  { key: "email", label: "E-posta *", type: "email", placeholder: "ornek@firma.com", required: true },
  { key: "konu", label: "Konu", type: "text", placeholder: "İlanım hakkında...", required: false },
];

// [icon, iconBg, iconColor, title, value, sub]
const CONTACTS = [
  [Phone, C.green, "#FFFFFF", "Telefon", "+90 (212) 555 00 00", "Pazartesi-Cuma 09:00-18:00"],
  [Mail, C.ink, C.yellow, "E-posta", "info@yuklet.co", "En geç 2 saat içinde dönüş"],
  [MessageCircle, C.yellow, C.ink, "WhatsApp", "+90 (555) 000 00 00", "7/24 hızlı destek"],
  [MapPin, C.ink, "#FFFFFF", "Adres", "Levent, İstanbul", "Büyükdere Cad. No:123 Kat:5"],
];

const shell = { display: "flex", flexDirection: "column", minHeight: "100%", background: C.bg, fontFamily: BODY };
const sectionLabel = { fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: C.muted };
const cardBase = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" };
const labelStyle = { display: "block", marginBottom: 6, fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.sub };
const fieldStyle = (err) => ({ width: "100%", boxSizing: "border-box", border: `2px solid ${err ? C.red : C.ink}`, borderRadius: 6, background: C.card, padding: "10px 12px", fontFamily: BODY, fontSize: 13.5, color: C.ink, outline: "none" });

export default function IletisimPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);

  const handleChange = (key, val) => {
    setValues((v) => ({ ...v, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: null }));
  };

  const handleSubmit = () => {
    const allFields = [...FIELDS, { key: "mesaj", type: "text", required: true }];
    const { valid, errors: errs } = validateForm(allFields, values);
    if (!valid) { setErrors(errs); return; }
    setSent(true);
  };

  return (
    <div style={shell}>
      <SEO title="İletişim" description="YÜKLET ile iletişime geçin. İlan, teklif ve nakliye süreci hakkındaki sorularınız için bize ulaşın." />

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
        <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>İletişim</h1>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ margin: 0, fontFamily: MONO, fontSize: 12, lineHeight: 1.6, color: C.sub }}>
          Sorularınız veya özel talepleriniz için bize ulaşabilirsiniz.
        </p>

        {/* İletişim kartlari */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CONTACTS.map(([Icon, iconBg, iconColor, title, value, sub]) => (
            <div key={title} style={{ ...cardBase, display: "flex", alignItems: "flex-start", gap: 14, padding: 14 }}>
              <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 5, border: `2px solid ${C.ink}`, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon size={18} strokeWidth={2.2} color={iconColor} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.muted }}>{title}</div>
                <div style={{ marginTop: 2, fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, letterSpacing: "-0.01em", color: C.ink }}>{value}</div>
                <div style={{ marginTop: 2, fontFamily: BODY, fontSize: 11.5, color: C.sub }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* BIZE YAZ — form karti */}
        <div>
          <span style={sectionLabel}>BİZE YAZ</span>
          <div style={{ ...cardBase, marginTop: 10, padding: 16 }}>
            {sent ? (
              <div style={{ padding: "28px 8px", textAlign: "center" }}>
                <div style={{ margin: "0 auto 14px", width: 52, height: 52, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={26} strokeWidth={2.6} color="#FFFFFF" />
                </div>
                <div style={{ fontFamily: ARCHIVO, fontSize: 16, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>Mesajınız Gönderildi</div>
                <div style={{ marginTop: 6, fontFamily: BODY, fontSize: 13, color: C.sub }}>En kısa sürede size dönüş yapacağız.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {FIELDS.map((f) => (
                  <div key={f.key}>
                    <label style={labelStyle}>{f.label}</label>
                    <input
                      type={f.type} placeholder={f.placeholder} value={values[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      style={fieldStyle(errors[f.key])}
                    />
                    {errors[f.key] && <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red }}>{errors[f.key]}</div>}
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Mesajınız *</label>
                  <textarea
                    placeholder="Mesajınızı buraya yazın..." rows={4} value={values.mesaj || ""}
                    onChange={(e) => handleChange("mesaj", e.target.value)}
                    style={{ ...fieldStyle(errors.mesaj), resize: "vertical" }}
                  />
                  {errors.mesaj && <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.red }}>{errors.mesaj}</div>}
                </div>
                <button
                  onClick={handleSubmit}
                  style={{ marginTop: 2, width: "100%", border: `2px solid ${C.ink}`, borderRadius: 6, background: C.yellow, color: C.ink, padding: "13px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: "3px 3px 0 #0A0A0A" }}
                >
                  Gönder →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
