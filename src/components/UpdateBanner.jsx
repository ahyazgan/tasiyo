import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { checkForUpdate } from "../native/appUpdate";

// ── Uygulama içi sürüm uyarısı ──────────────────────────────────────
// Açılışta uzaktan sürüm kontrol eder. Yeni sürüm varsa üstte uyarı; "min"
// sürümün altındaysa kapatılamaz (zorunlu güncelleme). Erişilemezse hiç görünmez.
export default function UpdateBanner() {
  const [info, setInfo] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let alive = true;
    checkForUpdate().then((res) => { if (alive && res?.updateAvailable) setInfo(res); });
    return () => { alive = false; };
  }, []);

  if (!info || (dismissed && !info.forced)) return null;

  const open = () => { if (info.storeUrl) window.open(info.storeUrl, "_blank", "noopener"); };

  return (
    <div
      role="alert"
      style={{
        position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)", zIndex: 65,
        width: "100%", maxWidth: 460, display: "flex", alignItems: "center", gap: 10,
        padding: "max(8px, env(safe-area-inset-top)) 12px 8px", background: "#1b222d", color: "#fff",
        borderBottom: "2px solid #0A0A0A", fontFamily: "'Space Mono', ui-monospace, monospace",
      }}
    >
      <Download size={16} strokeWidth={2.4} color="#FACC15" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 11.5, fontWeight: 700, lineHeight: 1.3 }}>
        {info.forced ? "Bu sürüm artık desteklenmiyor — güncelle" : `Yeni sürüm hazır (${info.latest})`}
      </span>
      <button
        onClick={open}
        style={{ flexShrink: 0, background: "#FACC15", color: "#0A0A0A", border: "2px solid #0A0A0A", borderRadius: 5, padding: "5px 11px", fontFamily: "inherit", fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}
      >
        Güncelle
      </button>
      {!info.forced && (
        <button
          onClick={() => setDismissed(true)}
          aria-label="Kapat"
          style={{ flexShrink: 0, background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontFamily: "inherit", fontSize: 16, cursor: "pointer", lineHeight: 1, padding: "0 2px" }}
        >
          ×
        </button>
      )}
    </div>
  );
}
