import { useEffect, useRef, useState } from "react";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  Aşağı-çekip-yenile (pull-to-refresh) — dokunmatik cihazlar.        ║
// ║  Sayfa en üstteyken (scrollY<=0) aşağı çekince onRefresh tetikler.  ║
// ║  Döner: { pull (0-1 ilerleme), refreshing, distance(px) }.          ║
// ╚══════════════════════════════════════════════════════════════════╝

const THRESHOLD = 70;   // tetikleme eşiği (px)
const MAX = 110;        // görsel tavan (px)

export default function usePullToRefresh(onRefresh, { disabled = false } = {}) {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);

  useEffect(() => {
    if (disabled || typeof window === "undefined" || !("ontouchstart" in window)) return;

    const onStart = (e) => {
      if (refreshing) return;
      // Yalnızca en üstteyken ve tek parmakla başlat.
      if (window.scrollY <= 0 && e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        active.current = true;
      } else {
        active.current = false;
      }
    };

    const onMove = (e) => {
      if (!active.current || startY.current == null || refreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy > 0 && window.scrollY <= 0) {
        // Dirençli (lastik) his: karekök yumuşatma.
        const eased = Math.min(MAX, Math.sqrt(dy) * 9);
        setDistance(eased);
      } else {
        setDistance(0);
        active.current = false;
      }
    };

    const onEnd = async () => {
      if (!active.current) return;
      active.current = false;
      const reached = distance >= THRESHOLD;
      if (reached && onRefresh) {
        setRefreshing(true);
        setDistance(THRESHOLD);
        try { await onRefresh(); } catch { /* noop */ }
        // Kısa süre göster, sonra kapat.
        setTimeout(() => { setRefreshing(false); setDistance(0); }, 400);
      } else {
        setDistance(0);
      }
      startY.current = null;
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    window.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", onEnd);
    };
  }, [onRefresh, disabled, refreshing, distance]);

  return { distance, refreshing, pull: Math.min(1, distance / THRESHOLD) };
}
