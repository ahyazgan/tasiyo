import { Component } from "react";
import { Link } from "react-router-dom";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="page-content">
          <div className="order-confirm-card">
            <div style={{ fontSize: 48, marginBottom: 16 }}>{"\u26A0"}</div>
            <h1 className="page-title">Bir hata olustu</h1>
            <p style={{ color: "var(--text-sec)", marginTop: 8, marginBottom: 24 }}>
              Sayfa yuklenirken beklenmeyen bir hata meydana geldi.
            </p>
            <button onClick={() => { this.setState({ hasError: false }); window.location.href = "/"; }}
              className="btn-primary btn-lg">Ana Sayfaya Don</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── SAHA 404 — manila zemin · hazard şeritleri · Archivo uppercase · Space Mono.
export function NotFoundPage() {
  const C = { ink: "#0A0A0A", yellow: "#FACC15", bg: "#F1EDE5", card: "#FFFFFF", sub: "#5A5852" };
  const MONO = "'Space Mono','SFMono-Regular',ui-monospace,monospace";
  const ARCH = "'Archivo',system-ui,sans-serif";
  const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";
  const FRAME = `2px solid ${C.ink}`;

  return (
    <div
      className="flex min-h-[calc(100vh-0px)] w-full flex-col items-center justify-center px-7"
      style={{ background: C.bg }}
    >
      {/* üst hazard şeridi */}
      <div className="fixed left-0 right-0 top-0" style={{ height: 8, backgroundImage: HAZARD }} />

      {/* logo */}
      <div
        className="mb-7 flex h-16 w-16 items-center justify-center"
        style={{ background: C.ink, border: FRAME, borderRadius: 6, color: C.yellow, fontFamily: ARCH, fontWeight: 900, fontSize: 36, boxShadow: "4px 4px 0 rgba(10,10,10,.15)" }}
      >
        H
      </div>

      {/* 404 */}
      <div className="text-[64px] font-bold leading-none" style={{ color: C.ink, fontFamily: MONO, letterSpacing: "-0.02em" }}>404</div>

      {/* hazard mini şerit */}
      <div className="mt-4 mb-5" style={{ width: 64, height: 7, backgroundImage: HAZARD, border: "1.5px solid #0A0A0A", borderRadius: 3 }} />

      <h1 className="text-center text-[22px] font-extrabold uppercase" style={{ color: C.ink, fontFamily: ARCH, letterSpacing: "-0.02em" }}>
        Sayfa Bulunamadı
      </h1>
      <p className="mt-2.5 max-w-[300px] text-center text-[12px]" style={{ color: C.sub, fontFamily: MONO }}>
        Aradığın sayfa mevcut değil veya kaldırılmış olabilir.
      </p>

      <Link
        to="/"
        className="mt-7 inline-flex items-center gap-2 px-6 py-3 text-[14px] font-extrabold uppercase"
        style={{ background: C.yellow, color: C.ink, border: FRAME, borderRadius: 6, fontFamily: ARCH, letterSpacing: "-0.01em", boxShadow: "3px 3px 0 #0A0A0A", textDecoration: "none" }}
      >
        ← Ana Sayfaya Dön
      </Link>

      {/* alt hazard şeridi */}
      <div className="fixed bottom-0 left-0 right-0" style={{ height: 8, backgroundImage: HAZARD }} />
    </div>
  );
}
