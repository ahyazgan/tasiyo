// ╔══════════════════════════════════════════════════════════════════╗
// ║  Kamera/Galeri — native'de @capacitor/camera (çek veya seç),       ║
// ║  web'de null döner → çağıran taraf <input type=file>'a düşer.       ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

export const cameraNative = () => Capacitor.isNativePlatform();

// Native'de kamera/galeri açar, seçilen görseli dataURL döndürür.
// Web'de (veya iptal/hata) null döner. quality 0-100.
export async function pickPhotoDataUrl({ quality = 65 } = {}) {
  if (!Capacitor.isNativePlatform()) return null;
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      quality,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Prompt, // "Kamera" veya "Galeri" seçtir
      promptLabelHeader: "Fotoğraf",
      promptLabelPhoto: "Galeriden seç",
      promptLabelPicture: "Fotoğraf çek",
      correctOrientation: true,
    });
    return photo?.dataUrl || null;
  } catch {
    // Kullanıcı iptal etti veya izin yok — sessizce geç.
    return null;
  }
}
