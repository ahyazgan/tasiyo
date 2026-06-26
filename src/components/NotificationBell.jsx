import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { pushSupported, pushPermission, requestPushPermission } from "../utils/push";

// ── SAHA Bildirimler — çan + dropdown. user yokken render edilmez.
// 2px ink çerçeve · sert offset gölge · Archivo başlık · Space Mono zaman · stroke ikon kutusu.
// Fonksiyonellik korunur: items, unread, onOpen, okundu durumu, navigate.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  card: "#FFFFFF", stone: "#F4F1EA", bg: "#F1EDE5",
  sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
const ARCH = "'Archivo',system-ui,sans-serif";
const FRAME = `2px solid ${C.ink}`;

// 16px stroke ikonlar
const I = {
  bell: <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.94 1.94 0 0 0 3.4 0" />,
  offer: <path d="M21.5 12H16l-2 3h-4l-2-3H2.5M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11Z" />,
  check: <path d="M20 6 9 17l-5-5" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
  msg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
};

function Icon({ children, w = 16, sw = 2 }) {
  return (
    <svg width={w} height={w} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

// Emoji ikonu -> SAHA stroke ikon kutusu tipine eşle (veri sözleşmesi değişmez)
function notifVisual(emoji) {
  if (emoji === "✅") return { path: I.check, bg: C.green, fg: "#FFFFFF" };
  if (emoji === "❌") return { path: I.x, bg: C.red, fg: "#FFFFFF" };
  if (emoji === "💬") return { path: I.msg, bg: C.stone, fg: C.ink };
  // 📨 teklif (varsayılan)
  return { path: I.offer, bg: C.yellow, fg: C.ink };
}

export default function NotificationBell({ items = [], unread = 0, onOpen }) {
  const [open, setOpen] = useState(false);
  const [perm, setPerm] = useState(() => pushPermission());
  const ref = useRef(null);
  const navigate = useNavigate();

  const askPush = async () => { setPerm(await requestPushPermission()); };

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const toggle = () => { const n = !open; setOpen(n); if (n) onOpen?.(); };
  const go = (link) => { setOpen(false); navigate(link); };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label="Bildirimler"
        className="relative flex h-9 w-9 items-center justify-center"
        style={{ border: FRAME, borderRadius: 5, background: C.card, color: C.ink }}
      >
        <Icon>{I.bell}</Icon>
        {unread > 0 && (
          <span
            className="absolute -right-1.5 -top-1.5 flex min-w-[17px] items-center justify-center px-1 text-[9px] font-extrabold"
            style={{ background: C.red, color: "#FFFFFF", border: "1.5px solid #0A0A0A", borderRadius: 4, fontFamily: MONO, lineHeight: "15px" }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-[60] mt-2 w-80 max-w-[88vw] overflow-hidden"
          style={{ background: C.card, border: FRAME, borderRadius: 6, boxShadow: "4px 4px 0 #0A0A0A" }}
        >
          {/* başlık */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: FRAME }}>
            <span className="text-[13px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.01em" }}>Bildirimler</span>
            {unread > 0 && (
              <span
                className="px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 4, fontFamily: MONO }}
              >
                {unread} yeni
              </span>
            )}
          </div>

          {/* anlık bildirim izni */}
          {pushSupported && perm === "default" && (
            <button
              onClick={askPush}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[11px] font-bold transition"
              style={{ borderBottom: `2px solid ${C.ink}`, background: C.stone, color: C.ink, fontFamily: MONO }}
            >
              <span style={{ color: C.ink }}><Icon w={14} sw={2.2}>{I.bell}</Icon></span>
              <span>Anlık bildirimleri aç — teklif ve mesajları kaçırma</span>
            </button>
          )}
          {pushSupported && perm === "denied" && (
            <div className="px-4 py-2.5 text-[10px]" style={{ borderBottom: `2px solid ${C.ink}`, color: C.muted, fontFamily: MONO }}>
              Bildirimler engelli. Tarayıcı ayarlarından bu site için izin verebilirsin.
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="px-4 py-12 text-center text-[12px]" style={{ color: C.muted, fontFamily: MONO }}>Henüz bildirim yok.</div>
            ) : (
              items.map((n) => {
                const v = notifVisual(n.icon);
                return (
                  <button
                    key={n.id}
                    onClick={() => go(n.link)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition"
                    style={{ borderBottom: `2px solid ${C.bg}`, background: !n.read ? C.stone : C.card }}
                  >
                    <span
                      className="mt-0.5 flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center"
                      style={{ border: FRAME, borderRadius: 5, background: v.bg, color: v.fg }}
                    >
                      <Icon w={15} sw={2}>{v.path}</Icon>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-semibold leading-snug" style={{ color: C.ink, fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif" }}>{n.text}</span>
                      <span className="mt-1 block text-[10px]" style={{ color: C.muted, fontFamily: MONO }}>{n.fmtTime}</span>
                    </span>
                    {!n.read && <span className="mt-1.5 h-2.5 w-2.5 flex-shrink-0" style={{ background: C.yellow, border: "1.5px solid #0A0A0A" }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
