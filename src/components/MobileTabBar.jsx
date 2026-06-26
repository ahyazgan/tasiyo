import { Link, useLocation } from "react-router-dom";
import { Home, Map, Plus, MessageCircle, User } from "lucide-react";
import { hapticTap } from "../native/haptics";

// ── SAHA alt tab bar (Tailwind + inline style). Mobil app kolonuna hizalı (max-w-[460px]).
// Beyaz zemin, üstte 2px siyah çizgi. Aktif sekmede üstte 18x3px sarı çizgi.
// Ortada büyük sarı "+" butonu (48px, 2px ink çerçeve, radius 8px). Emoji DEĞİL — lucide stroke ikonlar.

const TABS = [
  { to: "/", label: "Ana", Icon: Home, match: (p) => p === "/" },
  { to: "/yuk-radari", label: "Yük Radarı", Icon: Map, match: (p) => p.startsWith("/yuk-radari") || p.startsWith("/ilanlar") || p.startsWith("/ilan/") },
  { to: "/ilan-ver", label: "İlan Ver", Icon: Plus, center: true, match: (p) => p.startsWith("/ilan-ver") },
  { to: "/mesajlar", label: "Mesajlar", Icon: MessageCircle, match: (p) => p.startsWith("/mesajlar") },
  { to: "/profil", label: "Profil", Icon: User, match: (p) => p.startsWith("/profil") || p.startsWith("/ilanlarim") || p.startsWith("/panel") },
];

const LABEL_STYLE = {
  fontFamily: "'Space Mono', monospace",
  fontSize: "7.5px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

export default function MobileTabBar({ unreadCount = 0 }) {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Alt gezinme"
      className="fixed inset-x-0 bottom-0 z-50 mx-auto flex w-full max-w-[460px] items-end justify-around px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2.5"
      style={{ background: "#FFFFFF", borderTop: "2px solid #0A0A0A" }}
    >
      {TABS.map((tab) => {
        const active = tab.match(pathname);

        // Center "İlan Ver" — büyük sarı + butonu, yukarı taşar.
        if (tab.center) {
          return (
            <Link key={tab.to} to={tab.to} onClick={hapticTap} aria-label={tab.label} aria-current={active ? "page" : undefined} className="flex flex-1 flex-col items-center">
              <span
                className="flex items-center justify-center"
                style={{
                  width: 48,
                  height: 48,
                  marginTop: -22,
                  background: "#FACC15",
                  border: "2px solid #0A0A0A",
                  borderRadius: 8,
                }}
              >
                <Plus width={26} height={26} stroke="#0A0A0A" strokeWidth={2.6} />
              </span>
              <span className="mt-1" style={{ ...LABEL_STYLE, color: "#0A0A0A" }}>{tab.label}</span>
            </Link>
          );
        }

        const badge = tab.to === "/mesajlar" ? unreadCount : 0;
        const { Icon } = tab;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            onClick={hapticTap}
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            className="relative flex flex-1 flex-col items-center gap-1 py-1"
          >
            {/* Aktif sekme: üstte 18x3px sarı çizgi */}
            {active && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: -10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  width: 18,
                  height: 3,
                  background: "#FACC15",
                }}
              />
            )}
            <span className="relative flex items-center justify-center">
              <Icon width={20} height={20} stroke={active ? "#0A0A0A" : "#9A968D"} strokeWidth={2} />
              {badge > 0 && (
                <span
                  className="absolute flex min-w-[16px] items-center justify-center rounded-full px-1"
                  style={{
                    top: -6,
                    right: -10,
                    background: "#DC2626",
                    color: "#FFFFFF",
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "9px",
                    fontWeight: 700,
                    boxShadow: "0 0 0 2px #FFFFFF",
                  }}
                >
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </span>
            <span style={{ ...LABEL_STYLE, color: active ? "#0A0A0A" : "#9A968D" }}>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
