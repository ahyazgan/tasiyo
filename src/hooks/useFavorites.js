import { useState, useEffect, useCallback } from "react";
import { loadFavorites, saveFavorites } from "../utils/storage";
import { hapticTap } from "../native/haptics";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  Favori (kaydedilen) ilanlar — localStorage + sayfalar arası senk. ║
// ║  toggle yapınca tüm mount'lu kullanıcılar 'dayim:favorites' ile     ║
// ║  güncellenir (sekmeler arası 'storage' olayı da dinlenir).          ║
// ╚══════════════════════════════════════════════════════════════════╝

const EVT = "dayim:favorites";

export default function useFavorites() {
  const [ids, setIds] = useState(() => loadFavorites().map(String));

  useEffect(() => {
    const refresh = () => setIds(loadFavorites().map(String));
    const onStorage = (e) => { if (e.key === "hamted_favorites") refresh(); };
    window.addEventListener(EVT, refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const isFav = useCallback((id) => ids.includes(String(id)), [ids]);

  const toggle = useCallback((id) => {
    const sid = String(id);
    const cur = loadFavorites().map(String);
    const next = cur.includes(sid) ? cur.filter((x) => x !== sid) : [sid, ...cur];
    saveFavorites(next);
    setIds(next);
    hapticTap();
    window.dispatchEvent(new Event(EVT)); // diğer mount'lu bileşenleri güncelle
    return next.includes(sid);
  }, []);

  return { ids, isFav, toggle, count: ids.length };
}
