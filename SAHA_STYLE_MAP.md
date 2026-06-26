# SAHA Stil Eşleme Rehberi (MoveIQ → SAHA)

> Bu dosya, eski MoveIQ (slate/navy/sky) stilini HamTed SAHA marka diline çevirmek için
> TEK tutarlı eşlemedir. Tüm sayfa/bileşen çevirilerinde bunu kullan.
> SAHA = antrasit + hazard sarısı + manila, **MAVİ YOK**, tek tema (dark mode YOK).

## Palet (tailwind.config.js'te `ham.*` token olarak tanımlı — `bg-ham-card` gibi sınıflar çalışır)

| ham token | hex | kullanım | eski MoveIQ karşılığı |
|---|---|---|---|
| ink | #0A0A0A | başlık, birincil metin, koyu buton, koyu blok | slate-950, slate-900 |
| header | #1C1A17 (koyu) / #EAE3D6 (açık header) | header alanı | — |
| yellow | #FACC15 | YALNIZ aksiyon/aksan (CTA, logo, aktif sekme, yıldız, rozet) | yellow-400, amber-500 |
| yellowDeep | #E0B400 | sarı degrade alt ucu | — |
| green | #16803C | YALNIZ aktif/onay/para | emerald-500/600, green |
| red | #DC2626 | YALNIZ acil/bildirim | red-500/600 |
| bg | #F1EDE5 (açık) / #E4DED2 | manila gövde zemini | bg-gray-50, slate-50 (sayfa zemini) |
| card | #FAF9F6 / #FFFFFF | kart yüzeyi | bg-white |
| stone | #EFEBE2 / #F4F1EA | nötr dolgu (input, ikincil buton, çip) | bg-slate-50, bg-slate-100 |
| border | #D6CEBD / #E3DDD0 | kart/input kenarlığı | border-gray-100/200 |
| line | #EAE5DB / #F0ECE3 | ince iç ayraç | border-gray-100 |
| sub | #5A5852 | ikincil metin | text-gray-500, text-slate-600/700 |
| muted | #9A968D | soluk metin / koyu üstü soluk | text-gray-400, text-slate-400 |
| faint | #A8A39A | pasif ikon/tab | text-gray-300 |

## Çeviri kuralları
1. **`dark:` varyantlarını TAMAMEN SİL.** Tek tema (light/manila). `dark:bg-navy-card`, `dark:text-slate-100` vb. hepsi gider.
2. **navy / sky / blue HİÇBİR yerde kalmasın.** Mavi yasak. navy-* → ham koyu/stone; sky-* (silobas rengiydi) → stone + ikon ile ayrım.
3. **Renk anlam taşır:** yeşil=aktif/para, kırmızı=acil, sarı=aksiyon. Dekoratif sarı kullanma (header'ı sarıya boyama).
4. **Koyu zemin üstünde metin** her zaman `#FAF9F6`; **sarı üstünde metin** her zaman `#0A0A0A` (ink).
5. **Veri/ölçüm** (₺ tutar, ton, km, sefer, ilan no, tarih) için Space Mono: `font-mono` (tailwind'de `fontFamily.mono = Space Mono` tanımlı) ya da inline `fontFamily:"'Space Mono',ui-monospace,monospace"`.
6. **Gövde/başlık fontu** Plus Jakarta Sans — zaten global (body). Ekstra ayar gerekmez.
7. Kart: `rounded-2xl`/`rounded-[16-20px]` + `border border-ham-border` + yumuşak gölge (`shadow-sm` ya da `0 4px 14px -8px rgba(16,42,67,.18)`).
8. Buton: dolu (ink/green/yellow) veya nötr (stone+border). Sarı butonda metin ink.
9. **İŞLEVSELLİĞİ BOZMA.** Sadece görsel sınıflar/renkler değişir; props, state, callback, util, JSX yapısı AYNI kalır.
10. Türkçe karakterler düzgün (İ, ş, ğ, ç, ö, ü).

## Hızlı sınıf eşlemesi (sık kullanılanlar)
- `bg-white` → `bg-ham-card`
- `bg-slate-50` / `bg-slate-100` → `bg-ham-stone`
- `bg-slate-950` / `bg-slate-900` → `bg-ham-ink`
- `text-slate-950` / `text-slate-900` → `text-ham-ink`
- `text-gray-500` / `text-slate-600` → `text-ham-sub`
- `text-gray-400` / `text-slate-400` → `text-ham-muted`
- `text-amber-600` / `text-amber-700` / `text-yellow-500` → `text-ham-ink` (vurgu metni) ya da `text-ham-yellow` (aksan)
- `bg-yellow-400` → `bg-ham-yellow text-ham-ink`
- `text-emerald-600` / `bg-emerald-*` → `text-ham-green` / yeşil dolgu `style={{background:"#16803C"}}`
- `text-sky-*` / `bg-sky-*` (silobas) → `text-ham-sub` / `bg-ham-stone` (renk yerine ikon ile ayır)
- `border-gray-100` / `border-gray-200` → `border-ham-line` / `border-ham-border`
- `text-red-*` / `bg-red-*` → `text-ham-red` / kırmızı dolgu `style={{background:"#DC2626"}}`
- `shadow-sm` kalabilir; `dark:*` her şey silinir.
