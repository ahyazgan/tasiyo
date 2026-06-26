# HamTed — Proje Anayasası (CLAUDE.md)

## Proje nedir
HamTed, **hafriyat ve silobas/döküme yük taşımacılığını** 3 tarafı buluşturan bir **ilan & eşleştirme platformudur.**
Bu bir e-ticaret sitesi DEĞİLDİR. Sepet yoktur, doğrudan satın alma yoktur.
Model: Müteahhit "iş ilanı" açar → nakliyeci "teklif" verir → kabul edilir → iletişim → iş başlar.
Tedarikçi (ocak/santral) kendi ürün/stok ilanını açar, müteahhit bulur, nakliyeyi platform üzerinden ayarlar.

## 3 Kullanıcı Rolü
- **Müteahhit / Alıcı** (`isveren`): iş ilanı açar, teklif alır — `/muteahhit` landing
- **Tedarikçi** (`tedarikci`): kırma ocağı, beton santrali, kum ocağı — `/tedarikci` landing
- **Nakliyeci / Taşıyıcı** (`nakliyeci`): araç ilanı açar veya iş ilanlarına teklif verir — `/nakliyeci` landing

## İki Taşıma Kategorisi (başka kategori eklenmez)
- **hafriyat** — kazı, toprak, moloz, kaya, asfalt kırığı, metal hurda
- **silobas** — döküme çimento, agrega, kum, çakıl, mıcır, tahıl, kimyasal granül, gübre…

## Teknoloji
- React 19 + Vite + react-router-dom v7
- Framer Motion (animasyonlar)
- Backend YOK. Veri şimdilik **localStorage**'da tutulur (ileride Supabase).
- Stil: **Tailwind CSS v3** (gerçek kurulum, CDN değil). `tailwind.config.js` + `postcss.config.js` + `src/tailwind.css`.
  - **KADEMELİ GEÇİŞ:** Eski sayfalar hâlâ `src/index.css` sınıflarıyla çalışıyor. Yeni/çevrilen sayfalar **Tailwind utility** kullanır. `NakliyeHome.jsx` tamamen Tailwind'e çevrildi (referans şablon).
  - Tailwind `preflight` KAPALI (`corePlugins.preflight=false`) — index.css'i bozmasın. Tüm sayfalar çevrilince açılabilir.
  - Dark mode: `darkMode: ["selector", '[data-theme="dark"]']` — mevcut tema butonu çalışmaya devam eder. Renkler için `dark:` varyantı kullan.
  - Marka renkleri: koyu zemin `bg-[#1b222d]`/`#11141a`, vurgu `yellow-400` (= MoveIQ). `navy`/`brand` token'ları da tanımlı.
  - Tasarım aracından üretilen React+Tailwind kodu doğrudan yapıştırılabilir (slate/yellow-400 vb. standart sınıflar çalışır).

## Mevcut yapı (KULLAN, YENİSİNİ İCAT ETME)
- `src/data/categories.js` — CATS, LISTING_TYPES, VEHICLE_TYPES, MATERIALS, UNITS, IL_LIST, HAFRIYAT_MATERIALS/VEHICLES, SILOBAS_MATERIALS/VEHICLES
- `src/data/listings.js` — LISTINGS (örnek ilan verisi)
- `src/utils/storage.js` — tüm localStorage erişimi buradan (`hamted_` prefix)
- `src/App.jsx` — merkezi state + routing (lazy + PageTransition)
- `src/components/Toast.jsx` — `useToast()` bildirimi
- CSS sınıfları `.page-content`, `.site-header`, `.ilan-detay-grid`, `.mesaj-grid` vb. var — kullan

## Rotalar
| Rota | Sayfa |
|---|---|
| `/` | NakliyeHome (3 persona CTA) |
| `/muteahhit` | MuteahhitPage (landing) |
| `/tedarikci` | TedarikciPage (landing) |
| `/nakliyeci` | NakliyeciPage (landing) |
| `/ilanlar` | ListingsPage |
| `/ilan/:id` | IlanDetayPage |
| `/ilan-ver` | IlanVerPage |
| `/ilan-duzenle/:id` | IlanVerPage (edit mode) |
| `/ilanlarim` | IlanlarimPage |
| `/mesajlar` | MesajlarPage |
| `/profil` | ProfilPage |

## DEĞİŞMEZ KURALLAR
1. **Mevcut çalışan kodu bozma.** Routing, header, footer, tema çalışıyor.
2. **Stil = Tailwind.** Yeni/çevrilen sayfalar Tailwind utility ile yazılır. Eski sayfalar çevrilene kadar `index.css` ile kalır — ikisini aynı anda bozma. styled-components vb. EKLEME.
3. **Veri tek yerden.** Tüm localStorage erişimi `storage.js` üzerinden. Bileşen içine `localStorage.getItem` yazma.
4. **localStorage anahtarları `hamted_` ile başlar:** listings, offers, messages, user, users, msg_seen, theme…
5. **Türkçe karakter kullan.** Düzgün Türkçe yaz (İlanını, taşıma, güvenli).
6. **Sepet/ödeme/ürün mantığı EKLEME.** İlan platformu.
7. **Tek seferde tek görev.** Verilen dilimi bitir, fazlasını yapma.
8. Her yeni sayfa lazy import ile `App.jsx`'e eklenir ve `<PageTransition>` ile sarılır.

## Veri modeli (referans)
```
İlan:    { id, type:"is"|"arac", cat:"hafriyat"|"silobas", title, il, ilce,
           yukleme, bosaltma, material, amount, unit, date, dateText,
           recurring, recurringText, vehicle, capacity,
           priceType:"sabit"|"teklif", price, desc,
           owner, ownerId, ownerVerified, ownerRating,
           status:"aktif"|"kapali"|"eslesti", offers, createdText }

Teklif:  { id, listingId, fromUser, fromUserId, price, message,
           status:"beklemede"|"kabul"|"ret", createdAt }

Kullanıcı: { id, name, email, password, role:"isveren"|"tedarikci"|"nakliyeci",
             phone, verified, rating }

Mesaj:   { id, listingId, offerId, fromId, fromName, toId, toName,
           text, createdAt }
```
