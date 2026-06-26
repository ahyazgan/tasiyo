// ╔══════════════════════════════════════════════════════════════════╗
// ║  Paylaşım — native (iOS/Android) gerçek paylaşım sayfası,           ║
// ║  web'de Web Share API, ikisi de yoksa panoya kopyala.              ║
// ║  Android WebView navigator.share desteklemez; native plugin şart.  ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

// Sonuç: "shared" | "copied" | "failed"
export async function shareUrl({ title = "YÜKLET", text = "", url = "" } = {}) {
  // 1) Native (iOS/Android) → Capacitor Share (her iki platformda çalışır)
  if (Capacitor.isNativePlatform()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title, text, url, dialogTitle: "Paylaş" });
      return "shared";
    } catch (e) {
      // Kullanıcı iptal ettiyse hata fırlatır — sessizce geç.
      if (String(e?.message || "").toLowerCase().includes("cancel")) return "shared";
      // Plugin hatası → panoya düş.
    }
  }

  // 2) Web Share API (mobil tarayıcı / iOS Safari)
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "shared"; // kullanıcı iptal etti
    }
  }

  // 3) Panoya kopyala (masaüstü / desteklenmeyen)
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      return "copied";
    } catch {
      /* noop */
    }
  }
  return "failed";
}
