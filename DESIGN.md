# DESIGN.md — HamTed Tasarım Anayasası

> Tek doğruluk kaynağı. Yeni/çevrilen tüm sayfa ve bileşenler bu dosyaya uyar.
> Değerler **gerçek koddan** türetildi: `tailwind.config.js` token'ları + `src/index.css` tema değişkenleri + referans sayfa `src/pages/NakliyeHome.jsx`.
> Stil = **Tailwind utility**. Eski Vite/e-ticaret CSS'i kaldırıldı; `index.css` artık yalnızca tema değişkenleri + reset + birkaç canlı yardımcı sınıf içerir.

---

## 1. Marka kimliği — "MoveIQ LIGHT"

- **Ürün:** HamTed — hafriyat & silobas yük taşımacılığı ilan/eşleştirme platformu.
- **Estetik:** MoveIQ tarzı **mobil-app görünümü** — açık zemin, beyaz kartlar, **sarı (`yellow-400`) vurgu**, lacivert/slate kontrast. Telefon genişliğinde ortalanmış dar kolon.
- **Ton:** Güvenilir, sade, sahaya yakın. Müteahhit/nakliyeci/tedarikçi diliyle konuş — jargon değil, iş dili.
- **Logo:** Lacivert→sarı gradyan kare (`#11141A → #FACC15`), beyaz "H", radius ~12px.
- **İki tema:** **Light = varsayılan ve sevk edilen görünüm.** Dark (lacivert `navy` paleti) tema butonuyla açılır; CSS değişkenleri + `navy`/`brand` token'ları hazır, ama sayfalara `dark:` varyantları henüz tam işlenmedi (açık iş — yeni sayfa yazarken `dark:` ekle).

---

## 2. Renk

### 2a. Light (varsayılan) — sayfaların pratikte kullandığı Tailwind sınıfları
| Rol | Tailwind | Hex | Kullanım |
|---|---|---|---|
| Vurgu / aksan **(dolgu)** | `yellow-400` | `#FACC15` | CTA dolgu, aktif sekme FAB, takip çizgisi, vurgulu kart |
| Vurgu **(metin/ikon)** | `amber-600` | `#D97706` | Açık zeminde okunur aksan metni, "+ Oluştur", aktif sekme etiketi |
| Koyu kontrast | `slate-950` | `#020617` | Sarı üstü metin, koyu ikon-buton (`☰`), birincil koyu yüzey |
| Sayfa zemini | `--bg` / body | `#F3F4F6` | Gövde arkası (kolon bunun üstünde durur) |
| Kart / yüzey | `bg-white` | `#FFFFFF` | Tüm kartlar, satırlar |
| İç yüzey / avatar zemini | `slate-50` | `#F8FAFC` | İkon dairesi, ince iç bloklar |
| Kenarlık | `border-gray-100` | `#F3F4F6` | Kart kenarı (varsayılan) |
| Ana metin | `slate-900` / `slate-950` | — | Başlık, ilan adı |
| Güçlü metin | `slate-700` / `slate-800` | — | Bölüm başlığı, alt başlık |
| İkincil metin | `gray-500` | — | Açıklama, persona alt yazısı |
| Üçüncül / etiket | `gray-400` | — | "Tümü" linki, label, meta |
| Pasif ikon/ok | `gray-300` | — | Chevron `›`, boş tracker noktası |

### 2b. Statü renkleri (her iki temada)
| Durum | Zemin / Metin | Tailwind |
|---|---|---|
| Başarı / eşleşti / "yolda" | yeşil | `bg-emerald-50 text-emerald-600` |
| Bilgi / nakliyeci | mavi | `bg-sky-50 text-sky-600` (ikon `sky-100/600`) |
| Aktif / yayında / uyarı | sarımsı | `bg-amber-50 text-amber-600` |
| Kapalı / pasif | nötr | `bg-slate-100 text-slate-500` |
| Hata / sil / rozet | kırmızı | `bg-red-500 text-white` (rozet), metin `red-600` |

### 2c. Dark (tema butonu) — `navy` + `brand` token'ları
`tailwind.config.js`'de tanımlı, `dark:` varyantıyla kullan:
| Token | Hex | Kullanım |
|---|---|---|
| `navy` (DEFAULT) | `#11141A` | Dark sayfa zemini |
| `navy.card` | `#1B222D` | Dark kart |
| `navy.soft` | `#232C3A` | Dark iç yüzey |
| `navy.line` | `#2A323F` | Dark kenarlık |
| `navy.muted` | `#6C7B93` | Dark ikincil metin |
| `brand` (DEFAULT) | `#FACC15` | Dark vurgu (sarı) |
| `brand.600` | `#F5B301` | Light vurgu alternatifi |

> **Kural:** Vurgu = sarı (`yellow-400` dolgu / `amber-600` metin). Dönüşüm için yeni renk uydurma. **Renkli gölge yok** (tek istisna: sarı CTA'da `shadow-yellow-400/40`).

### 2d. `dark:` eşleme tablosu (light sınıf → eklenecek dark varyantı)
Light sınıfı **silinmez**, yanına `dark:` eklenir. Vurgu (sarı/amber) ve statü renkleri **iki temada da aynı kalır** (genelde `dark:` gerekmez).
| Light sınıfı | Eklenecek |
|---|---|
| `bg-white` | `dark:bg-navy-card` |
| `bg-slate-50` / `bg-slate-100` | `dark:bg-navy-soft` |
| `bg-gray-50` / `bg-gray-100` | `dark:bg-navy-soft` |
| `border-gray-100` / `border-slate-50` / `border-slate-100` | `dark:border-navy-line` |
| `border-white` (nokta halkası) | `dark:border-navy-card` |
| `text-slate-950` / `-900` / `-800` / `-700` | `dark:text-slate-100` |
| `text-slate-600` | `dark:text-slate-300` |
| `text-gray-500` | `dark:text-slate-400` |
| `text-gray-400` | `dark:text-navy-muted` |
| `text-gray-300` | `dark:text-slate-600` |
| `bg-slate-950 text-white` (koyu kontrast buton) | `dark:bg-navy-soft dark:text-slate-100` |
| sayfa sarmalayıcı `text-slate-900` | `dark:text-slate-100` |
| `bg-yellow-400 text-slate-950` (sarı CTA) | değişmez |
| `text-amber-600`, statü `emerald/sky/amber/red` | değişmez |

> Yeni sayfa yazarken bu eşlemeyi baştan uygula. Mevcut sayfalara eklerken: her yüzey/metin/kenarlık sınıfına karşılığını yaz, sarıyı elleme.

---

## 3. Tipografi
- **Font:** `Outfit` (Google Fonts), `fontFamily.sans` ile global. Ağırlıklar 300–900.
- **Pratik ölçek (px):** `[8] · [9] · [10] · 11 · 12 · [13] · 14 · 16 · 18 · 20 · 24 · 28` (köşeli = mobil-app kartlarında yoğun kullanılan küçük boylar; `text-[9px]` vb.).
- **Başlık:** `font-extrabold`/`font-black` (800–900), büyük başlıkta `tracking-tight` / negatif letter-spacing.
- **Bölüm başlığı:** `text-xs font-extrabold text-slate-800`.
- **Gövde:** 12–14px, `font-medium`, `leading` 1.5–1.7.
- **Etiket/caps:** `text-[8px]`–`text-[10px]`, `font-bold`, `uppercase` + `tracking` gerektiğinde.

---

## 4. Spacing · Radius · Gölge
- **Spacing (4px tabanlı):** `gap-2 / 2.5 / 3 / 3.5 / 4 / 5`, kart iç padding `p-3 → p-4` (mobil), sayfa yatay `px-4`.
- **Radius:** buton/rozet `rounded-full`; input/küçük kart `rounded-2xl`; öne çıkan kart `rounded-[20px]`/`rounded-[24px]`; çok büyük yüzey `rounded-4xl`(2rem)/`rounded-5xl`(2.5rem) token'ları. Pill her zaman `rounded-full`.
- **Gölge:** kart varsayılan `shadow-sm`, hover `hover:shadow-md`. Yükseltili nadir öğe `shadow-lg`. Yumuşak/nötr; renkli gölge yok (sarı CTA istisnası).

---

## 5. Sayfa anatomisi — ne, nerede, nasıl

### 5a. Standart ekran iskeleti (mobil-app kolonu)
Her sayfa bu sarmalayıcıyla başlar:
```jsx
<div className="mx-auto flex w-full max-w-[460px] flex-col gap-5 px-4 pb-24 pt-2 text-slate-900">
```
- `max-w-[460px]` → mobilde tam genişlik, masaüstünde ortalanmış dar kolon (iPhone 14/15 ≈ 390×844 referans).
- `pb-24` → alt tab bar için boşluk. `gap-5` → bölümler arası dikey ritim.
- İlk eleman daima `<SEO />`.

Yukarıdan aşağıya tipik diziliş:
1. **Üst bar** — solda konum/selam (ikon + iki satır küçük metin), sağda yuvarlak bildirim ikon-butonu (kırmızı/sarı nokta rozeti). `flex items-center justify-between`.
2. **Arama + filtre** — `flex-1` beyaz arama hücresi (`rounded-2xl border border-gray-100 bg-white shadow-sm`) + yanında `h-11 w-11` koyu (`bg-slate-950`) ikon-buton.
3. **Promo / kısa-yol kartları** — `grid grid-cols-2 gap-3`, `h-28`; biri beyaz (`+ Oluştur`), biri sarı (`bg-yellow-400` + `text-slate-950`). Köşede büyük emoji.
4. **Birincil bölüm** — tek öne çıkan kart (ör. "Aktif sevkiyat"): durum pill'i, yatay tracker çizgisi (`border-dashed border-yellow-400` + sarı noktalar), alt rota grid'i.
5. **Liste bölümü** — başlık satırı (`text-xs font-extrabold text-slate-800` + sağda "Tümü" `text-[10px] text-gray-400`), altında **tek sütun** kart akışı (`flex flex-col gap-2.5`).
6. **İkincil bölümler** — roller, ipuçları vb. aynı başlık+liste kalıbıyla.

### 5b. Tekrarlayan bileşen kalıpları
- **Kart (satır):** `flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-3 text-left shadow-sm transition hover:shadow-md`. Sol: `h-10 w-10 rounded-full bg-slate-50` ikon dairesi + iki satır metin (`text-[10px] font-extrabold` üst, `text-[9px] text-gray-400` alt). Sağ: durum pill'i.
- **Durum pill'i:** `rounded-full px-2 py-0.5 text-[9px] font-extrabold` + statü zemini (2b).
- **Bölüm başlığı + "Tümü":** `mb-2.5 flex items-center justify-between`.
- **Birincil CTA:** sarı dolgu `bg-yellow-400 text-slate-950 rounded-full font-bold` veya koyu `bg-slate-950 text-white`. Buton metni **fiille** başlar.
- **Giriş animasyonu:** kartlarda `motion` ile `initial={{opacity:0,y:12}} animate={{opacity:1,y:0}}`, listede `delay: i*0.06`.

### 5c. Sayfa tipine göre yerleşim
| Sayfa | Yapı |
|---|---|
| **Home `/`** | Üst bar → arama → 2'li promo → Aktif sevkiyat → Son ilanlar → Roller |
| **Landing `/muteahhit` `/tedarikci` `/nakliyeci`** | Hero (değer cümlesi + tek CTA) → 3 adım "nasıl çalışır" → fayda listesi → kapanış CTA. Persona rengi: müteahhit `amber`, tedarikçi `emerald`, nakliyeci `sky`. |
| **İlanlar `/ilanlar`** | Arama + kategori chip'leri + `İş/Araç` segment → tek sütun ilan kartı akışı. Filtre üstte, sonuç sayısı küçük gri. |
| **İlan Detay `/ilan/:id`** | Başlık + kategori/konum meta → açıklama bloğu → özellik satırları → sabit/altta **Teklif Ver** kartı (fiyat + CTA). |
| **İlan Ver `/ilan-ver`** | Tek sütun form: `cat` (hafriyat/silobas) → `type` (iş/araç) segment → alanlar (il, malzeme, miktar, tarih…) → altta birincil "İlan oluştur" CTA. |
| **Mesajlar `/mesajlar`** | Sohbet listesi (tek sütun, okunmamış rozeti) → seçili sohbet baloncukları. |
| **Profil `/profil`** | Üst kullanıcı kartı (avatar + ad + rol rozeti) → ayar/aksiyon satırları → çıkış. |
| **Takip `/takip/:id`** | Lacivert öne çıkan takip kartı + adım çizgisi (yükleme→yolda→teslim) → rota uçları → durum. |

### 5d. Alt tab bar (sabit, sadece mobil `md:hidden`)
5 sekme — sıra **değişmez**: **Ana Sayfa · İlanlar · İlan Ver (orta, vurgulu FAB) · Mesajlar · Profil**.
- Orta FAB: `h-12 w-12 rounded-full bg-yellow-400 text-slate-950`, `-mt-6` ile yukarı taşar.
- Aktif sekme: ikon tam opak + etiket `text-amber-600`; pasif: `opacity-60 grayscale` + `text-gray-400`.
- Mesajlar sekmesinde okunmamış sayısı kırmızı rozet.
- `pb-[max(8px,env(safe-area-inset-bottom))]` ile home-indicator boşluğu.

---

## 6. İlkeler
1. Stil = Tailwind utility. Token dışı keyfi renk yok; vurgu daima sarı/amber ailesi.
2. Sade hiyerarşi, cömert boşluk, düşük görsel gürültü. Chart junk yok.
3. Her ekran tek soruyu/aksiyonu öne çıkarır (hero → değer → kanıt → CTA).
4. Mobil-first: `max-w-[460px]` kolon, dokunma hedefi **min 44×44px**, birincil aksiyon başparmak bölgesinde (alt %33).
5. Empty state: tek cümle değer + tek net aksiyon.
6. TR varsayılan; düzgün Türkçe karakter. Buton **fiille** başlar ("Teklif ver", "İlan oluştur").
7. Dark pattern yok: sahte aciliyet, gizli ücret, aldatıcı vazgeçme yok.
8. Yeni sayfa Tailwind ile yazılır, `dark:` varyantları eklenir, `App.jsx`'e lazy + `<PageTransition>` ile bağlanır.

## 7. Sapma kontrolü
Hardcode renk/spacing veya MoveIQ LIGHT dışına çıkan görünüm görülürse düzeltilir. Yeni token gerekiyorsa `tailwind.config.js`'e eklenir ve gerekçesi buraya yazılır.
