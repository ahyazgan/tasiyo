/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // Mevcut tema butonu html'e data-theme="dark" ekliyor -> dark: varyanti buna bagli
  darkMode: ["selector", '[data-theme="dark"]'],
  // KADEMELI GECIS: preflight (Tailwind reset) kapali -> index.css ile yazilan
  // mevcut sayfalar bozulmaz. Tum site Tailwind'e gecince acabiliriz.
  corePlugins: { preflight: false },
  theme: {
    extend: {
      colors: {
        // MoveIQ markasi — pasted kodlar yine slate/yellow-400 kullanabilir, onlar da calisir
        navy: {
          DEFAULT: "#11141A",
          card: "#1B222D",
          soft: "#232C3A",
          line: "#2A323F",
          muted: "#6C7B93",
        },
        brand: {
          DEFAULT: "#FACC15", // koyu tema sarisi (= yellow-400)
          600: "#F5B301", // acik tema sarisi
        },
        // HamTed "SAHA" marka paleti (tek dogruluk kaynagi: DESIGN-palette.md)
        // antrasit + hazard sarisi + manila — mavisiz, kurumsal/sahaya ait.
        ham: {
          ink: "#0A0A0A", header: "#1C1A17", yellow: "#FACC15", yellowDeep: "#E0B400",
          green: "#16803C", red: "#DC2626", bg: "#E4DED2", card: "#FAF9F6",
          stone: "#EFEBE2", border: "#D6CEBD", line: "#EAE5DB",
          sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
        },
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Outfit", "system-ui", "sans-serif"],
        mono: ["Space Mono", "SFMono-Regular", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },
    },
  },
  plugins: [],
}
