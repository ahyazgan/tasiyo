// ╔══════════════════════════════════════════════════════════════════╗
// ║  Haptik (titreşim) geri bildirim — yalnızca native kabukta.        ║
// ║  Web/PWA'da no-op. Hata fırlatmaz, akışı asla bloklamaz.           ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

const native = () => Capacitor.isNativePlatform();

// Hafif dokunuş — buton/sekme dokunuşları.
export async function hapticTap() {
  if (!native()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch { /* noop */ }
}

// Başarı — teklif gönderildi, ilan yayınlandı, kabul edildi.
export async function hapticSuccess() {
  if (!native()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch { /* noop */ }
}

// Uyarı/ret — teklif reddedildi, hata, silme.
export async function hapticWarn() {
  if (!native()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Warning });
  } catch { /* noop */ }
}
