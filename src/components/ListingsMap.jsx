// YÜKLET — İlanlar Haritası (SAHA marka dili)
// Açık (light) Leaflet haritası + SAHA stilinde marker/zoom/önizleme kartı.
// Marker'lar divIcon ile mono rozet (İL · adet) — 2px ink çerçeve, küçük ok ucu.
// Leaflet tile/davranışına dokunulmaz; props (listings, onPickIl) korunur.

import { useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IL_COORDS } from "../data/ilCoords";

// ── SAHA token'ları ──
const C = {
  ink: "#0A0A0A",
  yellow: "#FACC15",
  green: "#16803C",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'Archivo', sans-serif";

const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();
const COORD_KEYS = Object.keys(IL_COORDS);

const fmtPrice = (l) =>
  l && l.priceType === "sabit" && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : null;

// 16px stroke ikon path'leri (divIcon HTML içinde inline SVG).
const GLYPH = {
  // Damperli kamyon (araç ilanları baskınsa)
  truck: '<path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/>',
  // Kutu/yük (iş & ürün ilanları)
  box: '<path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
};

// ── SAHA mono rozet marker (divIcon — görsel asset gerektirmez) ──
// Renk = baskın kategori (hafriyat: koyu / silobas: sarı). İkon = baskın tür
// (araç → kamyon, iş/ürün → yük). Boyut = ilan adedine göre ölçeklenir.
function sahaIcon(il, arr, active) {
  const count = arr.length;
  const hafriyat = arr.filter((l) => l.cat === "hafriyat").length;
  const vehicles = arr.filter((l) => l.type === "arac").length;
  const isHafriyat = hafriyat >= count / 2;          // baskın kategori
  const isVehicle = vehicles >= count / 2;            // baskın tür
  // Renk: baskın kategoriye göre (aktifse vurgulu ters).
  const baseBg = isHafriyat ? C.ink : C.yellow;
  const baseFg = isHafriyat ? C.yellow : C.ink;
  const bg = active ? (isHafriyat ? C.yellow : C.ink) : baseBg;
  const fg = active ? (isHafriyat ? C.ink : C.yellow) : baseFg;
  // Boyut kademesi (çok ilan = daha büyük rozet).
  const big = count >= 8 ? 1.18 : count >= 3 ? 1.06 : 1;
  const fontPx = (10 * big).toFixed(1);
  const padY = (3 * big).toFixed(1);
  const padX = (8 * big).toFixed(1);
  const icoPx = Math.round(12 * big);
  const glyph = isVehicle ? GLYPH.truck : GLYPH.box;
  const badge = `${il.toLocaleUpperCase("tr-TR")} · ${count}`;
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
      <div style="
        display:flex;align-items:center;gap:5px;
        font-family:${MONO};font-size:${fontPx}px;font-weight:700;letter-spacing:0.04em;
        white-space:nowrap;padding:${padY}px ${padX}px;background:${bg};color:${fg};
        border:2px solid ${C.ink};border-radius:5px;
        box-shadow:2px 2px 0 rgba(10,10,10,0.25);">
        <svg width="${icoPx}" height="${icoPx}" viewBox="0 0 24 24" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${glyph}</svg>
        ${badge}
      </div>
      <div style="
        width:0;height:0;margin-top:-1px;
        border-left:5px solid transparent;border-right:5px solid transparent;
        border-top:7px solid ${C.ink};"></div>
    </div>`;
  return L.divIcon({
    html,
    className: "saha-marker",
    iconSize: [0, 0],
    iconAnchor: [0, 26],
  });
}

// ── SAHA zoom kontrolleri (Leaflet API'sini kullanır, kendi butonumuz) ──
function ZoomControls() {
  const map = useMap();
  const btn = {
    width: 36,
    height: 36,
    background: C.card,
    border: `2px solid ${C.ink}`,
    color: C.ink,
    fontFamily: HEAD,
    fontSize: 20,
    fontWeight: 900,
    lineHeight: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 500,
        display: "flex",
        flexDirection: "column",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "2px 2px 0 rgba(10,10,10,0.2)",
      }}
    >
      <button
        type="button"
        aria-label="Yakınlaştır"
        onClick={() => map.zoomIn()}
        style={{ ...btn, borderBottom: "none" }}
      >
        +
      </button>
      <button
        type="button"
        aria-label="Uzaklaştır"
        onClick={() => map.zoomOut()}
        style={btn}
      >
        −
      </button>
    </div>
  );
}

export default function ListingsMap({ listings = [], onPickIl }) {
  // Seçili il (alttaki önizleme kartı için) — marker tıklama hâlâ onPickIl çağırır.
  const [selected, setSelected] = useState(null);

  const groups = useMemo(() => {
    const g = {};
    for (const l of listings) {
      const key = COORD_KEYS.find((k) => fold(k) === fold(l.il));
      if (key) (g[key] = g[key] || []).push(l);
    }
    return g;
  }, [listings]);

  const selArr = selected && groups[selected] ? groups[selected] : null;
  const preview = selArr ? selArr[0] : null;
  const isH = preview && preview.cat === "hafriyat";
  const fixed = fmtPrice(preview);

  return (
    <div
      style={{
        position: "relative",
        height: 460,
        borderRadius: 6,
        overflow: "hidden",
        border: `2px solid ${C.ink}`,
        boxShadow: "6px 6px 0 rgba(10,10,10,0.12)",
      }}
    >
      <MapContainer
        center={[39.3, 35.2]}
        zoom={5}
        scrollWheelZoom={false}
        zoomControl={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {Object.entries(groups).map(([il, arr]) => (
          <Marker
            key={il}
            position={IL_COORDS[il]}
            icon={sahaIcon(il, arr, selected === il)}
            eventHandlers={{
              click: () => {
                setSelected(il);
                onPickIl?.(il);
              },
            }}
          />
        ))}
        <ZoomControls />
      </MapContainer>

      {/* Lejant — marker ikon/renk açıklaması */}
      <div style={{ position: "absolute", top: 12, left: 12, zIndex: 500, display: "flex", flexDirection: "column", gap: 4, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "7px 9px", boxShadow: "2px 2px 0 rgba(10,10,10,0.2)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.ink }}>
          <span style={{ width: 11, height: 11, background: C.ink, border: `1.5px solid ${C.ink}`, borderRadius: 2 }} /> HAFRİYAT
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.ink }}>
          <span style={{ width: 11, height: 11, background: C.yellow, border: `1.5px solid ${C.ink}`, borderRadius: 2 }} /> SİLOBAS
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.sub }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1" /><circle cx="7.5" cy="17.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" /></svg>
          ARAÇ İLANI
        </span>
      </div>

      {/* ── Seçili ilan önizleme kartı (altta) ── */}
      {preview && (
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: 12,
            zIndex: 500,
            display: "flex",
            background: C.card,
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            overflow: "hidden",
            boxShadow: "4px 4px 0 rgba(10,10,10,0.2)",
          }}
        >
          {/* sol dikey şerit */}
          <span
            style={{
              width: 6,
              flexShrink: 0,
              background: isH ? C.yellow : C.ink,
            }}
          />
          <div style={{ flex: 1, minWidth: 0, padding: "9px 11px" }}>
            {/* HMT kodu + durum/adet */}
            <div className="flex items-center justify-between" style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.muted }}>
                {selected.toLocaleUpperCase("tr-TR")} · {selArr.length} İLAN
              </span>
              {preview.status === "eslesti" ? (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: C.green,
                    color: "#fff",
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  ● EŞLEŞTİ
                </span>
              ) : (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 8.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    background: C.yellow,
                    color: C.ink,
                    border: `1.5px solid ${C.ink}`,
                  }}
                >
                  ● AKTİF
                </span>
              )}
            </div>
            {/* başlık */}
            <div
              className="truncate"
              style={{
                fontFamily: HEAD,
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                fontSize: 14,
                fontWeight: 800,
                lineHeight: 1.15,
              }}
            >
              {preview.title}
            </div>
            {/* yer · ton + fiyat */}
            <div className="flex items-center justify-between gap-2" style={{ marginTop: 5 }}>
              <span
                className="truncate"
                style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.sub }}
              >
                {preview.il}
                {preview.amount ? ` · ${preview.amount} ${(preview.unit || "").toLocaleUpperCase("tr-TR")}` : ""}
              </span>
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 12,
                  fontWeight: 700,
                  color: fixed ? C.green : C.sub,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {fixed || "TEKLİFE AÇIK"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
