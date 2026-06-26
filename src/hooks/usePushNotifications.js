import { useEffect, useRef } from "react";
import { showPush, pushPermission } from "../utils/push";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  notif.items listesini izler; SONRADAN eklenen (yeni) bildirimler   ║
// ║  için tarayıcı bildirimi gösterir. İlk yüklemedeki mevcut           ║
// ║  bildirimler "baseline" sayılır, pop'lanmaz.                        ║
// ╚══════════════════════════════════════════════════════════════════╝

export default function usePushNotifications(items, enabled) {
  const seenIds = useRef(null); // null = henüz baseline alınmadı

  useEffect(() => {
    if (!enabled || pushPermission() !== "granted") return;

    // İlk çalışmada mevcut bildirimleri "görülmüş" say (geçmişi pop'lama).
    if (seenIds.current === null) {
      seenIds.current = new Set(items.map((n) => n.id));
      return;
    }

    // Yeni gelen (daha önce görülmemiş) bildirimleri bul, pop'la.
    const fresh = items.filter((n) => !seenIds.current.has(n.id));
    for (const n of fresh) {
      seenIds.current.add(n.id);
      showPush({
        title: "YÜKLET",
        body: `${n.icon ? n.icon + " " : ""}${n.text}`,
        tag: n.id,
        link: n.link,
      });
    }
    // Listeden düşenleri set'ten temizle (bellek şişmesin).
    const current = new Set(items.map((n) => n.id));
    for (const id of seenIds.current) if (!current.has(id)) seenIds.current.delete(id);
  }, [items, enabled]);
}
