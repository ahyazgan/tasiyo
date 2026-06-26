// ── YÜKLET marka logosu — SAHA dili. Damperli kamyon + ileri ok simgesi +
// "YÜKLET" yazısı (yatay kilit). Şeffaf PNG (public/logo-full.png).
// Tek doğruluk kaynağı: tüm uygulama bunu kullanır.
//
//   <Logo />                 → varsayılan (orta boy)
//   <Logo size="sm" />       → küçük (header/tab)
//   <Logo size="lg" />       → büyük (giriş / splash)
//   <Logo onDark />          → koyu zemin (görsel zaten şeffaf; gölge yumuşar)
//   <Logo icon />            → sadece simge (kamyon+ok), yazısız kompakt
//
// Yükseklik = size; genişlik orantılı (img intrinsic oran).

const HEIGHTS = { sm: 26, md: 38, lg: 56 };

export default function Logo({ size = "md", onDark = false, icon = false, className = "", style = {} }) {
  const h = HEIGHTS[size] || HEIGHTS.md;
  const src = icon ? "/logo-icon.png" : "/logo-full.png";
  return (
    <img
      src={src}
      alt="YÜKLET"
      className={className}
      style={{
        height: h,
        width: "auto",
        display: "inline-block",
        objectFit: "contain",
        // koyu zeminde ince siyah konturlu görseli ayırmak için yumuşak gölge
        filter: onDark ? "drop-shadow(0 1px 2px rgba(0,0,0,.5))" : "none",
        userSelect: "none",
        ...style,
      }}
      draggable={false}
    />
  );
}
