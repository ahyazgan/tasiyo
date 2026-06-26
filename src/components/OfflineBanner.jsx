import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { onNetworkChange, isOnlineNow } from "../native/network";

// ── Çevrimdışı uyarı bandı ──────────────────────────────────────────
// Bağlantı kesilince üstte sabit bir uyarı gösterir; bağlantı gelince
// kısa "tekrar çevrimiçi" bilgisi verip kaybolur. Global (App.jsx).
// onReconnect: bağlantı geri geldiğinde tetiklenir (veri yenileme için).
export default function OfflineBanner({ onReconnect }) {
  const [online, setOnline] = useState(isOnlineNow());
  const [justBack, setJustBack] = useState(false);

  useEffect(() => {
    let firstRun = true;
    const unsub = onNetworkChange((isOnline) => {
      setOnline((prev) => {
        // Çevrimdışıdan çevrimiçine dönüş: kısa bilgi + yenileme tetikle.
        if (!firstRun && prev === false && isOnline === true) {
          setJustBack(true);
          onReconnect?.();
          setTimeout(() => setJustBack(false), 2500);
        }
        firstRun = false;
        return isOnline;
      });
    });
    return () => unsub();
  }, [onReconnect]);

  if (online && !justBack) return null;

  const offline = !online;
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 60,
        width: "100%",
        maxWidth: 460,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "max(8px, env(safe-area-inset-top)) 14px 8px",
        background: offline ? "#0A0A0A" : "#16803C",
        color: offline ? "#FACC15" : "#FFFFFF",
        fontFamily: "'Space Mono', ui-monospace, monospace",
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: "0.02em",
        borderBottom: "2px solid #0A0A0A",
      }}
    >
      <WifiOff size={15} strokeWidth={2.4} />
      {offline ? "Çevrimdışısın — bağlantı bekleniyor" : "Tekrar çevrimiçisin"}
    </div>
  );
}
