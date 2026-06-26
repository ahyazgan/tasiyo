// Marka dili önizleme — 3 yön yan yana mockup (ROTA / YOL / AKIŞ)
// Sadece KARŞILAŞTIRMA içindir; gerçek uygulamayı değiştirmez. Birini seçince
// o marka dilini DESIGN.md'ye işleyip uygulamaya yayarız.
// Rota: /marka-onizleme

import { useState } from "react";

// Ortak telefon çerçevesi
function Phone({ bg, children, label, tag }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 15, letterSpacing: "-0.01em", color: "#0A0A0A", textTransform: "uppercase" }}>
        {label} <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, color: "#888" }}>· {tag}</span>
      </div>
      <div style={{ width: 320, height: 690, borderRadius: 34, overflow: "hidden", background: bg, boxShadow: "0 18px 50px rgba(0,0,0,.28)", border: "8px solid #111", position: "relative", display: "flex", flexDirection: "column" }}>
        {children}
      </div>
    </div>
  );
}

// ════════════ YÖN 1 — ROTA (koyu harita / navigasyon) ════════════
function Rota() {
  const C = { bg: "#0F1420", surf: "#1A2030", surf2: "#232A3E", cyan: "#00E0A4", amber: "#FFB020", text: "#E8EDF2", sub: "#8F9BB0", line: "#2B3142", green: "#22C77D", mapbg: "#15192A" };
  const M = "'Space Mono', monospace";
  const H = "'Space Grotesk', 'Archivo', sans-serif";
  return (
    <Phone bg={C.bg} label="ROTA" tag="koyu harita / navigasyon">
      {/* top bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "44px 18px 12px" }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: C.cyan }} />
        <span style={{ fontFamily: H, fontWeight: 700, fontSize: 19, color: C.text, letterSpacing: ".5px" }}>TAŞIYO</span>
        <span style={{ flex: 1 }} />
        <span style={{ display: "flex", alignItems: "center", gap: 5, background: C.surf2, padding: "6px 10px", borderRadius: 20, fontFamily: M, fontSize: 10, fontWeight: 700, color: C.text }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.cyan }} />KONYA
        </span>
        <span style={{ width: 36, height: 36, borderRadius: 11, background: C.surf2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, position: "relative" }}>🔔<span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: C.amber }} /></span>
      </div>
      {/* map hero */}
      <div style={{ position: "relative", height: 300, background: C.mapbg, overflow: "hidden" }}>
        {[1, 2, 3, 4].map((i) => <div key={"h" + i} style={{ position: "absolute", left: 0, right: 0, top: i * 60, height: 1, background: C.line, opacity: .6 }} />)}
        {[1, 2, 3].map((i) => <div key={"v" + i} style={{ position: "absolute", top: 0, bottom: 0, left: i * 80, width: 1, background: C.line, opacity: .6 }} />)}
        {/* rota segmentleri */}
        <div style={{ position: "absolute", left: 70, top: 215, width: 110, height: 5, background: C.cyan, borderRadius: 3, transform: "rotate(-18deg)" }} />
        <div style={{ position: "absolute", left: 165, top: 175, width: 105, height: 5, background: C.cyan, borderRadius: 3, transform: "rotate(-30deg)" }} />
        {/* pinler */}
        <span style={{ position: "absolute", left: 235, top: 95, background: C.cyan, color: C.bg, fontFamily: M, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8, border: `2px solid ${C.bg}` }}>₺28K</span>
        <span style={{ position: "absolute", left: 195, top: 150, background: C.amber, color: C.bg, fontFamily: M, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8, border: `2px solid ${C.bg}` }}>₺9.5K</span>
        {/* ben */}
        <span style={{ position: "absolute", left: 56, top: 200, width: 36, height: 36, borderRadius: "50%", background: "rgba(0,224,164,.18)" }} />
        <span style={{ position: "absolute", left: 66, top: 210, width: 16, height: 16, borderRadius: "50%", background: C.cyan, border: `3px solid ${C.bg}` }} />
        {/* overlay */}
        <span style={{ position: "absolute", left: 12, top: 12, display: "flex", alignItems: "center", gap: 6, background: "rgba(35,42,62,.92)", padding: "8px 11px", borderRadius: 10, fontFamily: M, fontSize: 10, fontWeight: 700, color: C.text }}><span style={{ width: 7, height: 7, borderRadius: "50%", background: C.cyan }} />8 YÜK KORİDORUNDA</span>
      </div>
      {/* filter */}
      <div style={{ display: "flex", gap: 7, padding: "12px 14px" }}>
        {[["KONYA", true], ["İSTANBUL", false], ["TENTELİ", false]].map(([l, a]) => (
          <span key={l} style={{ display: "flex", alignItems: "center", gap: 5, padding: "7px 11px", borderRadius: 20, fontFamily: M, fontSize: 10.5, fontWeight: 700, background: a ? C.cyan : C.surf2, color: a ? C.bg : C.text }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: a ? C.bg : C.sub }} />{l}</span>
        ))}
      </div>
      {/* card */}
      <div style={{ padding: "2px 14px" }}>
        <div style={{ background: C.surf, border: `1px solid ${C.line}`, borderRadius: 16, padding: 15 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 17, color: C.text }}>Konya → İstanbul</span>
            <span style={{ flex: 1 }} /><span style={{ fontFamily: M, fontSize: 11, fontWeight: 700, color: C.cyan }}>220 KM</span>
          </div>
          <div style={{ fontFamily: M, fontSize: 11, color: C.sub, marginTop: 6 }}>Paletli gıda · 22 TON · TENTELİ</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, marginTop: 9, background: C.surf2, padding: "4px 9px", borderRadius: 6, fontFamily: M, fontSize: 9.5, fontWeight: 700, color: C.green }}>🛡 %92 GÜVENİLİR · 14 İŞ</div>
          <div style={{ height: 1, background: C.line, margin: "12px 0" }} />
          <div style={{ display: "flex", alignItems: "center" }}>
            <div><div style={{ fontFamily: M, fontSize: 9, color: C.sub }}>SABİT FİYAT</div><div style={{ fontFamily: H, fontWeight: 700, fontSize: 22, color: C.text }}>₺28.000</div></div>
            <span style={{ flex: 1 }} />
            <span style={{ background: C.cyan, color: C.bg, fontFamily: H, fontWeight: 700, fontSize: 14, padding: "12px 20px", borderRadius: 12 }}>YÜKÜ KAP →</span>
          </div>
        </div>
      </div>
      <span style={{ flex: 1 }} />
      {/* tab */}
      <div style={{ display: "flex", borderTop: `1px solid ${C.line}`, background: "#11151f", paddingBottom: 8 }}>
        {[["🏠", "ANA", false], ["🗺", "HARİTA", true], ["📋", "İŞLERİM", false], ["👤", "PROFİL", false]].map(([i, l, a]) => (
          <div key={l} style={{ flex: 1, textAlign: "center", padding: "10px 0 6px", borderTop: a ? `2px solid ${C.cyan}` : "2px solid transparent", marginTop: -1 }}>
            <div style={{ fontSize: 18, opacity: a ? 1 : .5 }}>{i}</div>
            <div style={{ fontFamily: M, fontSize: 8, fontWeight: 700, color: a ? C.text : C.sub, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

// ════════════ YÖN 2 — YOL (asfalt / otoyol) ════════════
function Yol() {
  const C = { bg: "#23262B", surf: "#2D3138", surf2: "#363B43", yellow: "#F2C200", text: "#EDEDE8", sub: "#9AA0A8", line: "#3A3F47", green: "#5FC27E", red: "#E05656", mapbg: "#1C1F24" };
  const M = "'Space Mono', monospace";
  const H = "'Archivo', 'Oswald', sans-serif";
  const dash = `repeating-linear-gradient(90deg, ${C.yellow} 0 14px, transparent 14px 28px)`;
  return (
    <Phone bg={C.bg} label="YOL" tag="asfalt / otoyol">
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "44px 18px 8px" }}>
        <span style={{ fontFamily: H, fontWeight: 900, fontSize: 20, color: C.text, letterSpacing: "1px", textTransform: "uppercase" }}>TAŞIYO</span>
        <span style={{ flex: 1, height: 4, background: dash, margin: "0 6px" }} />
        <span style={{ width: 34, height: 34, borderRadius: 8, background: C.surf2, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔔</span>
      </div>
      <div style={{ fontFamily: M, fontSize: 10, fontWeight: 700, color: C.sub, padding: "0 18px 8px", letterSpacing: ".5px" }}>KONUM: KONYA · TENTELİ</div>
      <div style={{ height: 4, background: dash, margin: "0 0 0 0" }} />
      {/* map */}
      <div style={{ position: "relative", height: 250, background: C.mapbg, overflow: "hidden" }}>
        {[1, 2, 3].map((i) => <div key={"h" + i} style={{ position: "absolute", left: 0, right: 0, top: i * 62, height: 1, background: C.line }} />)}
        <div style={{ position: "absolute", left: 60, top: 165, width: 130, height: 6, background: C.yellow, transform: "rotate(-16deg)" }} />
        <div style={{ position: "absolute", left: 170, top: 130, width: 110, height: 6, background: C.yellow, transform: "rotate(-26deg)" }} />
        <span style={{ position: "absolute", left: 230, top: 90, background: C.yellow, color: "#000", fontFamily: M, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 3 }}>₺28K 🚛</span>
        <span style={{ position: "absolute", left: 150, top: 195, background: C.surf2, color: C.text, fontFamily: M, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 3, border: `1.5px solid ${C.yellow}` }}>₺14K</span>
        <span style={{ position: "absolute", left: 60, top: 150, width: 16, height: 16, borderRadius: "50%", background: C.yellow, border: "3px solid #000" }} />
        <span style={{ position: "absolute", left: 12, top: 12, fontFamily: M, fontSize: 10, fontWeight: 700, color: C.yellow }}>▸ 8 YÜK KORİDORUNDA</span>
      </div>
      <div style={{ height: 4, background: dash }} />
      {/* filter */}
      <div style={{ display: "flex", gap: 7, padding: "10px 14px" }}>
        {[["KONYA", true], ["İST", false], ["TENTELİ", false]].map(([l, a]) => (
          <span key={l} style={{ padding: "7px 12px", borderRadius: 4, fontFamily: M, fontSize: 10.5, fontWeight: 700, background: a ? C.yellow : C.surf2, color: a ? "#000" : C.text }}>{l}</span>
        ))}
      </div>
      {/* card */}
      <div style={{ padding: "2px 14px" }}>
        <div style={{ background: C.surf, border: `1px solid ${C.line}`, borderRadius: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 14px", borderBottom: `1px solid ${C.line}` }}>
            <span style={{ fontFamily: M, fontSize: 9, fontWeight: 700, color: "#000", background: C.green, padding: "2px 7px", borderRadius: 3 }}>● AÇIK</span>
            <span style={{ fontFamily: M, fontSize: 10, color: C.sub }}>YÜK-1001</span>
            <span style={{ flex: 1 }} /><span style={{ fontSize: 14 }}>🚛</span>
          </div>
          <div style={{ padding: "12px 14px" }}>
            <div style={{ fontFamily: H, fontWeight: 900, fontSize: 18, color: C.text, textTransform: "uppercase", letterSpacing: ".5px" }}>KONYA ▸▸▸ İSTANBUL</div>
            <div style={{ fontFamily: M, fontSize: 11, color: C.sub, marginTop: 5 }}>220 KM · 22 TON · TENTELİ</div>
            <div style={{ display: "flex", alignItems: "center", marginTop: 12 }}>
              <span style={{ fontFamily: H, fontWeight: 900, fontSize: 22, color: C.yellow }}>₺28.000</span>
              <span style={{ flex: 1 }} />
              <span style={{ background: C.yellow, color: "#000", fontFamily: H, fontWeight: 900, fontSize: 13, padding: "11px 20px", borderRadius: 4, textTransform: "uppercase", letterSpacing: ".5px" }}>YÜKÜ AL</span>
            </div>
          </div>
        </div>
      </div>
      <span style={{ flex: 1 }} />
      <div style={{ height: 4, background: dash }} />
      <div style={{ display: "flex", background: "#1C1F24", paddingBottom: 8 }}>
        {[["🏠", "ANA", false], ["🗺", "HARİTA", true], ["📋", "İŞLERİM", false], ["👤", "PROFİL", false]].map(([i, l, a]) => (
          <div key={l} style={{ flex: 1, textAlign: "center", padding: "10px 0 6px" }}>
            <div style={{ fontSize: 18, opacity: a ? 1 : .5 }}>{i}</div>
            <div style={{ fontFamily: M, fontSize: 8, fontWeight: 700, color: a ? C.yellow : C.sub, marginTop: 2 }}>{l}</div>
          </div>
        ))}
      </div>
    </Phone>
  );
}

// ════════════ YÖN 3 — AKIŞ (temiz / açık) ════════════
function Akis() {
  const C = { bg: "#FFFFFF", surf: "#F6F7F9", org: "#FF5A1F", text: "#13161A", sub: "#73797F", line: "#E6E8EC", green: "#23B36B", mapbg: "#F1F3F6" };
  const H = "'Plus Jakarta Sans', 'Manrope', sans-serif";
  const M = "'Space Mono', monospace";
  return (
    <Phone bg={C.bg} label="AKIŞ" tag="temiz / açık">
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "44px 18px 6px" }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: C.org }} />
        <span style={{ fontFamily: H, fontWeight: 800, fontSize: 19, color: C.text }}>Taşıyo</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: M, fontSize: 11, fontWeight: 700, color: C.sub }}>Konya</span>
        <span style={{ width: 36, height: 36, borderRadius: "50%", background: C.surf, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🔔</span>
      </div>
      <div style={{ padding: "8px 18px 10px" }}>
        <div style={{ fontFamily: H, fontWeight: 800, fontSize: 21, color: C.text }}>Merhaba Ahmet 👋</div>
        <div style={{ fontFamily: H, fontWeight: 500, fontSize: 14, color: C.sub, marginTop: 2 }}>Yakınında 8 yük var</div>
      </div>
      {/* map */}
      <div style={{ padding: "0 16px" }}>
        <div style={{ position: "relative", height: 210, background: C.mapbg, borderRadius: 18, overflow: "hidden" }}>
          {[1, 2, 3].map((i) => <div key={"h" + i} style={{ position: "absolute", left: 0, right: 0, top: i * 52, height: 1, background: C.line }} />)}
          <div style={{ position: "absolute", left: 60, top: 140, width: 120, height: 5, background: C.org, borderRadius: 3, transform: "rotate(-16deg)" }} />
          <div style={{ position: "absolute", left: 165, top: 110, width: 100, height: 5, background: C.org, borderRadius: 3, transform: "rotate(-26deg)" }} />
          <span style={{ position: "absolute", left: 215, top: 75, background: C.org, color: "#fff", fontFamily: M, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}>₺28K</span>
          <span style={{ position: "absolute", left: 135, top: 165, background: C.org, color: "#fff", fontFamily: M, fontSize: 10, fontWeight: 700, padding: "4px 8px", borderRadius: 8 }}>₺14K</span>
          <span style={{ position: "absolute", left: 56, top: 132, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,90,31,.18)" }} />
          <span style={{ position: "absolute", left: 65, top: 141, width: 14, height: 14, borderRadius: "50%", background: C.org, border: "3px solid #fff" }} />
        </div>
      </div>
      {/* filter */}
      <div style={{ display: "flex", gap: 8, padding: "10px 16px" }}>
        {[["Konya", true], ["İstanbul", false], ["Tenteli", false]].map(([l, a]) => (
          <span key={l} style={{ padding: "8px 13px", borderRadius: 20, fontFamily: H, fontWeight: 600, fontSize: 12, background: a ? C.org : C.surf, color: a ? "#fff" : C.text }}>{l}</span>
        ))}
      </div>
      {/* card */}
      <div style={{ padding: "2px 16px" }}>
        <div style={{ background: "#fff", border: `1px solid ${C.line}`, borderRadius: 16, padding: 15, boxShadow: "0 6px 16px rgba(0,0,0,.06)" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontFamily: H, fontWeight: 700, fontSize: 17, color: C.text }}>Konya → İstanbul</span>
            <span style={{ flex: 1 }} /><span style={{ fontFamily: M, fontSize: 11, fontWeight: 700, color: C.sub }}>220 km</span>
          </div>
          <div style={{ fontFamily: H, fontWeight: 500, fontSize: 13, color: C.sub, marginTop: 6 }}>Paletli gıda · 22 ton · Tenteli</div>
          <div style={{ height: 1, background: C.line, margin: "12px 0" }} />
          <div style={{ display: "flex", alignItems: "center" }}>
            <div><div style={{ fontFamily: H, fontWeight: 500, fontSize: 11, color: C.sub }}>Sabit fiyat</div><div style={{ fontFamily: H, fontWeight: 800, fontSize: 22, color: C.text }}>₺28.000</div></div>
            <span style={{ flex: 1 }} />
            <span style={{ background: C.org, color: "#fff", fontFamily: H, fontWeight: 700, fontSize: 14, padding: "13px 22px", borderRadius: 24 }}>Yükü Al</span>
          </div>
        </div>
      </div>
      <span style={{ flex: 1 }} />
      {/* tab */}
      <div style={{ display: "flex", alignItems: "flex-end", borderTop: `1px solid ${C.line}`, background: "#fff", paddingBottom: 8 }}>
        {[["🏠", "Ana", false], ["🗺", "Harita", true], ["+", "", "plus"], ["💬", "Mesaj", false], ["👤", "Profil", false]].map(([i, l, a], idx) => (
          a === "plus" ? (
            <div key={idx} style={{ flex: 1, display: "flex", justifyContent: "center", paddingTop: 6 }}>
              <span style={{ width: 44, height: 44, borderRadius: 14, background: C.org, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 700 }}>+</span>
            </div>
          ) : (
            <div key={idx} style={{ flex: 1, textAlign: "center", padding: "10px 0 6px" }}>
              <div style={{ fontSize: 18, opacity: a ? 1 : .45 }}>{i}</div>
              <div style={{ fontFamily: M, fontSize: 8, fontWeight: 700, color: a ? C.org : C.sub, marginTop: 2 }}>{l}</div>
            </div>
          )
        ))}
      </div>
    </Phone>
  );
}

export default function MarkaOnizleme() {
  const [pick, setPick] = useState(null);
  return (
    <div style={{ minHeight: "100dvh", background: "#EDEAE3", padding: "28px 20px 80px", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <h1 style={{ fontFamily: "'Archivo', sans-serif", fontWeight: 900, fontSize: 28, textTransform: "uppercase", letterSpacing: "-0.02em", color: "#0A0A0A", margin: 0 }}>Marka Dili — 3 Yön</h1>
        <p style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "#5A5852", marginTop: 6 }}>
          Taşıyo ana sayfası, 3 farklı marka karakterinde. Birini seç → o dili tüm uygulamaya yayarım.
        </p>

        <div style={{ display: "flex", gap: 36, flexWrap: "wrap", justifyContent: "center", marginTop: 28 }}>
          <div onClick={() => setPick("ROTA")} style={{ cursor: "pointer", outline: pick === "ROTA" ? "3px solid #00E0A4" : "none", outlineOffset: 12, borderRadius: 8 }}><Rota /></div>
          <div onClick={() => setPick("YOL")} style={{ cursor: "pointer", outline: pick === "YOL" ? "3px solid #F2C200" : "none", outlineOffset: 12, borderRadius: 8 }}><Yol /></div>
          <div onClick={() => setPick("AKIŞ")} style={{ cursor: "pointer", outline: pick === "AKIŞ" ? "3px solid #FF5A1F" : "none", outlineOffset: 12, borderRadius: 8 }}><Akis /></div>
        </div>

        {pick && (
          <div style={{ position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "#0A0A0A", color: "#fff", fontFamily: "'Space Mono', monospace", fontSize: 13, fontWeight: 700, padding: "12px 22px", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,.3)" }}>
            Seçtin: <span style={{ color: "#FACC15" }}>{pick}</span> — bana "{pick} olsun" de, uygulamaya yayayım.
          </div>
        )}
      </div>
    </div>
  );
}
