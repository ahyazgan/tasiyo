// Marka dili temaları — Yük Radarı (Uber ana sayfa) bunlarla giydirilir.
// Aynı çalışan ekran, 3 farklı karakterde. Birini seçince / ana sayfa olur.
//
// Her tema, TentaliDemo'nun beklediği renk + font anahtarlarını sağlar.
// `dark`: harita tile'ı koyu mu (overlay/lejant kontrastı için).

export const THEMES = {
  // ── SAHA (mevcut açık/manila — varsayılan, geri uyumluluk) ──
  saha: {
    key: "saha", label: "SAHA",
    ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C",
    card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0",
    sub: "#5A5852", muted: "#9A968D", blue: "#1D5FA8",
    accent: "#FACC15", accentFg: "#0A0A0A", text: "#0A0A0A",
    pageBg: "#F4F1EA", headerBg: "#FFFFFF",
    mono: "'Space Mono', ui-monospace, monospace",
    head: "'Archivo', sans-serif",
    dark: false,
  },

  // ── ROTA (koyu harita / navigasyon — cyan) ──
  rota: {
    key: "rota", label: "ROTA",
    ink: "#0F1420", yellow: "#00E0A4", green: "#22C77D",
    card: "#1A2030", stone: "#0F1420", border: "#2B3142",
    sub: "#8F9BB0", muted: "#5A6577", blue: "#00E0A4",
    accent: "#00E0A4", accentFg: "#0F1420", text: "#E8EDF2",
    pageBg: "#0F1420", headerBg: "#0F1420",
    surf2: "#232A3E",
    mono: "'Space Mono', ui-monospace, monospace",
    head: "'Space Grotesk', 'Archivo', sans-serif",
    dark: true,
  },

  // ── YOL (asfalt / otoyol — yol sarısı) ──
  yol: {
    key: "yol", label: "YOL",
    ink: "#23262B", yellow: "#F2C200", green: "#5FC27E",
    card: "#2D3138", stone: "#23262B", border: "#3A3F47",
    sub: "#9AA0A8", muted: "#6B7178", blue: "#F2C200",
    accent: "#F2C200", accentFg: "#000000", text: "#EDEDE8",
    pageBg: "#23262B", headerBg: "#23262B",
    surf2: "#363B43",
    mono: "'Space Mono', ui-monospace, monospace",
    head: "'Archivo', 'Oswald', sans-serif",
    dark: true,
  },

  // ── AKIŞ (temiz / açık — turuncu) ──
  akis: {
    key: "akis", label: "AKIŞ",
    ink: "#13161A", yellow: "#FF5A1F", green: "#23B36B",
    card: "#FFFFFF", stone: "#F6F7F9", border: "#E6E8EC",
    sub: "#73797F", muted: "#A0A6AC", blue: "#FF5A1F",
    accent: "#FF5A1F", accentFg: "#FFFFFF", text: "#13161A",
    pageBg: "#F6F7F9", headerBg: "#FFFFFF",
    surf2: "#EEF0F3",
    mono: "'Space Mono', ui-monospace, monospace",
    head: "'Plus Jakarta Sans', 'Manrope', sans-serif",
    dark: false,
  },
};

export function getTheme(key) {
  return THEMES[key] || THEMES.saha;
}

// Koyu temalarda CARTO dark tiles, açıkta standart OSM.
export function tileUrl(theme) {
  return theme.dark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
}
