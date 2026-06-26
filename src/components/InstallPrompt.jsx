import { useState, useEffect } from "react";
import { X } from "lucide-react";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  "Uygulamayı yükle" çubuğu (PWA). beforeinstallprompt'u yakalar,   ║
// ║  kullanıcı kabul/ret edebilir. Kurulu (standalone) ise gösterilmez.║
// ╚══════════════════════════════════════════════════════════════════╝

const DISMISS_KEY = "hamted_pwa_dismissed";

function isStandalone() {
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    const onPrompt = (e) => {
      e.preventDefault();          // tarayıcının kendi mini-barını engelle
      setDeferred(e);
      setShow(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);

    // Kurulum tamamlanınca çubuğu kaldır.
    const onInstalled = () => { setShow(false); setDeferred(null); };
    window.addEventListener("appinstalled", onInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch { /* ignore */ }
    setShow(false);
    setDeferred(null);
  };

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[120] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:left-auto sm:right-4 sm:max-w-sm print:hidden">
      {/* SAHA install bar: white card, 2px ink frame, hard offset shadow */}
      <div
        className="flex items-center gap-3 bg-white p-3"
        style={{ border: "2px solid #0A0A0A", borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" }}
      >
        {/* 44px black square logo, Archivo yellow H */}
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center"
          style={{
            background: "#0A0A0A",
            border: "2px solid #0A0A0A",
            borderRadius: 6,
            color: "#FACC15",
            fontFamily: "'Archivo',sans-serif",
            fontWeight: 900,
            fontSize: 22,
            lineHeight: 1,
          }}
        >
          H
        </div>
        <div className="min-w-0 flex-1">
          <div
            style={{
              fontFamily: "'Archivo',sans-serif",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "-0.02em",
              fontSize: 14,
              color: "#0A0A0A",
            }}
          >
            YÜKLET'i Yükle
          </div>
          <div
            style={{
              fontFamily: "'Space Mono',monospace",
              fontSize: 11,
              color: "#5A5852",
              marginTop: 2,
            }}
          >
            Telefonuna ekle — daha hızlı, çevrimdışı çalışır.
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={dismiss}
            aria-label="Kapat"
            className="flex h-9 w-9 items-center justify-center bg-white"
            style={{ border: "2px solid #0A0A0A", borderRadius: 6, color: "#0A0A0A" }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={install}
            className="h-9 px-4"
            style={{
              background: "#FACC15",
              border: "2px solid #0A0A0A",
              borderRadius: 6,
              color: "#0A0A0A",
              fontFamily: "'Archivo',sans-serif",
              fontWeight: 800,
              textTransform: "uppercase",
              fontSize: 13,
              letterSpacing: "-0.01em",
            }}
          >
            Yükle
          </button>
        </div>
      </div>
    </div>
  );
}
