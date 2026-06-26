// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET — Native (Capacitor) köprü kurulumu                         ║
// ║  Yalnızca iOS/Android native kabukta çalışır; web'de no-op olur.    ║
// ║  StatusBar / SplashScreen / Keyboard / Android geri tuşu yönetimi.  ║
// ╚══════════════════════════════════════════════════════════════════╝

import { Capacitor } from "@capacitor/core";

export const isNative = () => Capacitor.isNativePlatform();
export const platform = () => Capacitor.getPlatform(); // "ios" | "android" | "web"

// Native dışında (tarayıcı/PWA) hiçbir plugin yüklenmesin — bundle hafif kalsın.
export async function initNative() {
  if (!isNative()) return;

  // Native modda <html> üzerine işaret koy — CSS'te safe-area/padding ayarı için.
  document.documentElement.classList.add("native-app");
  document.documentElement.classList.add(`platform-${platform()}`);

  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    // Her iki platformda da koyu (#1b222d) status bar şeridi → AÇIK ikonlar (Style.Dark).
    // iOS'ta şerit rengi capacitor.config ios.backgroundColor + contentInset:"always"
    // ile gelir; Android'de aşağıda doğrudan ayarlanır.
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform() === "android") {
      await StatusBar.setBackgroundColor({ color: "#1b222d" });
      await StatusBar.setOverlaysWebView({ overlay: false });
    }
  } catch (e) {
    console.warn("StatusBar ayarlanamadı:", e);
  }

  // Klavye açılınca gövdeye sınıf ekle (input'ların üstüne taşmasını engelle).
  try {
    const { Keyboard } = await import("@capacitor/keyboard");
    Keyboard.addListener("keyboardWillShow", () =>
      document.body.classList.add("keyboard-open")
    );
    Keyboard.addListener("keyboardWillHide", () =>
      document.body.classList.remove("keyboard-open")
    );
  } catch {
    /* keyboard plugin yok — sorun değil */
  }

  // Splash'i içerik hazır olunca gizle (config'te autoHide de var, bu güvenlik ağı).
  try {
    const { SplashScreen } = await import("@capacitor/splash-screen");
    setTimeout(() => SplashScreen.hide().catch(() => {}), 300);
  } catch {
    /* noop */
  }
}

// Android donanım geri tuşu: tarayıcı geçmişi varsa geri git, kökteyse çıkışı onayla.
// React Router içinden çağrılır (history erişimi için).
export async function initBackButton(navigate, isRootPath) {
  if (!isNative() || platform() !== "android") return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const handle = await App.addListener("backButton", ({ canGoBack }) => {
      if (isRootPath() && !canGoBack) {
        App.exitApp();
      } else if (window.history.length > 1) {
        navigate(-1);
      } else {
        App.exitApp();
      }
    });
    return () => handle.remove();
  } catch {
    return () => {};
  }
}

// Deep link: uygulama bir bağlantıyla açılınca (com.yuklet.app://ilan/123 veya
// https://yuklet.co/ilan/123) ilgili rotaya yönlendir. React Router'dan çağrılır.
export async function initDeepLinks(navigate) {
  if (!isNative()) return () => {};
  try {
    const { App } = await import("@capacitor/app");
    const routeFromUrl = (url) => {
      if (!url) return;
      try {
        // Hem custom scheme hem https: pathname'i çıkar.
        const u = new URL(url);
        const path = (u.pathname || "/") + (u.search || "");
        if (path && path !== "/") navigate(path);
      } catch {
        // URL ayrıştırılamazsa: "scheme://ilan/123" → "/ilan/123"
        const m = String(url).match(/^[a-z0-9.+-]+:\/\/(.*)$/i);
        if (m && m[1]) navigate("/" + m[1].replace(/^\/+/, ""));
      }
    };
    const handle = await App.addListener("appUrlOpen", (event) => routeFromUrl(event?.url));
    return () => handle.remove();
  } catch {
    return () => {};
  }
}
