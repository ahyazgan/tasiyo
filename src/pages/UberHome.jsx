// YÜKLET — TEK UBER AKIŞI (birleşik ana sayfa)
// Ayrı müteahhit/tedarikçi/nakliyeci akışı yok: herkes aynı Uber mantığını
// kullanır. Üstte tek bir mod anahtarı (Uber'in rider/driver geçişi):
//   • "Yük Bul"  → araçtayım: çevredeki yükleri gör + kap   (TentaliDemo)
//   • "Yük Ver"  → araç çağır: çevrimiçi araçları gör + çağır (AracRadariPage)
// Her iki taraf da presence + dispatch (ping) kanallarıyla çalışır.

import { useState } from "react";
import TentaliDemo from "./TentaliDemo";
import AracRadariPage from "./AracRadariPage";
import { getTheme } from "../data/brandThemes";

const MODES = [
  { key: "bul", label: "Yük Bul", sub: "Araçtayım" },
  { key: "ver", label: "Yük Ver", sub: "Araç çağır" },
];

// Sürücü rolündeki kullanıcı "Yük Bul" ile açılır, diğer herkes "Yük Ver".
const defaultMode = (user) => (user?.role === "nakliyeci" ? "bul" : "ver");

export default function UberHome({ listings = [], offers = [], reviews = [], user, onClaim, onRequireAuth }) {
  const C = getTheme("yol");
  const MONO = C.mono, HEAD = C.head;
  const [mode, setMode] = useState(() => defaultMode(user));

  return (
    <div style={{ minHeight: "100dvh", background: C.stone }}>
      {/* ── Mod anahtarı (Uber rider/driver geçişi) ── */}
      <div style={{ position: "sticky", top: 0, zIndex: 600, display: "flex", gap: 6, padding: 10, background: C.ink, borderBottom: `2px solid ${C.ink}` }}>
        {MODES.map((m) => {
          const on = mode === m.key;
          return (
            <button key={m.key} type="button" onClick={() => setMode(m.key)} aria-pressed={on} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "8px 6px", borderRadius: 8, cursor: "pointer",
              background: on ? C.yellow : "transparent", color: on ? C.ink : "#fff",
              border: `2px solid ${on ? C.ink : "#ffffff33"}`, transition: "all .15s",
            }}>
              <span style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".02em" }}>{m.label}</span>
              <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, opacity: .85 }}>{m.sub}</span>
            </button>
          );
        })}
      </div>

      {/* ── Seçili taraf ── */}
      {mode === "bul" ? (
        <TentaliDemo theme="yol" listings={listings} offers={offers} reviews={reviews} user={user} onClaim={onClaim} onRequireAuth={onRequireAuth} />
      ) : (
        <AracRadariPage user={user} listings={listings} onRequireAuth={onRequireAuth} />
      )}
    </div>
  );
}
