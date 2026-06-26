import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Inbox, MessageSquare, Check, X as XIcon, Mail, Star } from "lucide-react";
import SEO from "../components/SEO";

// ── YÜKLET Bildirim Merkezi — tam sayfa bildirim listesi (geçmiş + okundu).
// Açılınca tüm bildirimler "okundu" işaretlenir (onSeen). Her satır ilgili
// ekrana götürür. items: buildNotifications çıktısı ({ id, icon, text, fmtTime, link, read }).

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", line: "#F0ECE3",
  sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const ARCH = "'Archivo', system-ui, sans-serif";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";

const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, color: C.ink, fontFamily: SANS, display: "flex", flexDirection: "column",
};

// Emoji ikonunu SAHA stroke ikon kutusuna eşle.
function visual(icon) {
  if (icon === "✅") return { Icon: Check, bg: C.green, fg: "#fff" };
  if (icon === "❌") return { Icon: XIcon, bg: C.red, fg: "#fff" };
  if (icon === "💬") return { Icon: MessageSquare, bg: C.stone, fg: C.ink };
  if (icon === "⭐") return { Icon: Star, bg: C.yellow, fg: C.ink };
  return { Icon: Mail, bg: C.yellow, fg: C.ink }; // 📨 teklif (varsayılan)
}

export default function BildirimlerPage({ user, items = [], onSeen, onRequireAuth }) {
  const navigate = useNavigate();

  // Sayfa açılınca tüm bildirimleri okundu işaretle (çan rozeti sıfırlanır).
  useEffect(() => {
    if (user) onSeen?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (!user) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 14, textAlign: "center" }}>
        <SEO title="Bildirimler" description="Teklif, mesaj ve eşleşme bildirimleri." />
        <Inbox size={40} color={C.muted} strokeWidth={2} />
        <h1 style={{ fontFamily: ARCH, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Bildirimleri görmek için giriş yap</h1>
        <p style={{ fontFamily: SANS, fontSize: 13.5, color: C.sub, margin: 0, maxWidth: 300 }}>Tekliflerin, mesajların ve eşleşmelerin burada toplanır.</p>
        <button onClick={() => onRequireAuth?.()} style={{ marginTop: 4, cursor: "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", boxShadow: "3px 3px 0 #0A0A0A" }}>
          Giriş yap / Kayıt ol
        </button>
      </div>
    );
  }

  return (
    <div style={shell}>
      <SEO title="Bildirimler" description="Teklif, mesaj ve eşleşme bildirimleri." />

      {/* App bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: C.header, borderBottom: `2px solid ${C.ink}`, position: "sticky", top: 0, zIndex: 40 }}>
        <button onClick={() => navigate(-1)} aria-label="Geri" style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, cursor: "pointer" }}>
          <ChevronLeft size={20} strokeWidth={2.6} color={C.ink} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCH, fontSize: 19, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase" }}>Bildirimler</h1>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>{items.length}</span>
      </div>

      {items.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 24px", textAlign: "center" }}>
          <Inbox size={44} color={C.muted} strokeWidth={1.8} />
          <div style={{ fontFamily: ARCH, fontSize: 17, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Henüz bildirim yok</div>
          <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, margin: 0, maxWidth: 280, lineHeight: 1.6 }}>
            Teklif, mesaj ve eşleşme bildirimlerin burada görünecek.
          </p>
        </div>
      ) : (
        <div style={{ padding: "12px 16px 96px", display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((n) => {
            const v = visual(n.icon);
            return (
              <button
                key={n.id}
                onClick={() => navigate(n.link)}
                style={{ display: "flex", alignItems: "flex-start", gap: 12, width: "100%", textAlign: "left", cursor: "pointer", background: n.read ? C.card : "#FEFCE8", border: `2px solid ${C.ink}`, borderRadius: 6, padding: 12, boxShadow: n.read ? "none" : "3px 3px 0 rgba(10,10,10,0.10)" }}
              >
                <span style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 6, background: v.bg, color: v.fg, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <v.Icon size={17} strokeWidth={2.3} />
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span style={{ display: "block", fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.4 }}>{n.text}</span>
                  <span style={{ display: "block", marginTop: 4, fontFamily: MONO, fontSize: 10, color: C.muted }}>{n.fmtTime}</span>
                </span>
                {!n.read && <span style={{ flexShrink: 0, marginTop: 3, width: 9, height: 9, background: C.yellow, border: "1.5px solid #0A0A0A" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
