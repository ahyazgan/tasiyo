# YÜKLET — Mobil Uygulama (Capacitor)

YÜKLET web uygulaması **Capacitor** ile sarmalanarak iOS (App Store) ve Android
(Google Play) için **gerçek native uygulamalara** dönüştürüldü. Web kod tabanı
(`src/`) aynen kullanılır; `dist/` build'i native WebView içine kopyalanır.

- **Uygulama adı:** YÜKLET
- **Bundle / Package ID:** `com.yuklet.app`
- **Capacitor:** v8 · **Web dizini:** `dist`
- **Native projeler:** `android/` (Gradle), `ios/` (Xcode)

## Mimari
```
src/  ──(vite build)──►  dist/  ──(cap sync)──►  android/ + ios/  ──► .aab / .ipa
```
- `capacitor.config.json` — uygulama kimliği, splash, status bar, klavye ayarları.
- `src/native/capacitor.js` — native köprü: StatusBar, SplashScreen, klavye,
  Android donanım geri tuşu. **Web/PWA'da no-op** (sadece native kabukta çalışır).
- `src/main.jsx` — native modda Service Worker kapatılır (WebView çakışmasını önler),
  web/PWA'da SW aynen kayıtlı kalır.
- `src/index.css` — `html.native-app` altında çentik/güvenli alan (safe-area) ayarları.

## Kurulum (yeni makinede)
```bash
npm install
npx cap sync          # dist'i native projelere kopyalar + pluginleri günceller
```

## Geliştirme akışı
| Komut | Ne yapar |
|---|---|
| `npm run dev` | Web/PWA geliştirme (tarayıcı) |
| `npm run build` | `dist/` production build |
| `npm run cap:sync` | build + native projelere senkron |
| `npm run cap:android` | build + sync + Android Studio'da aç |
| `npm run cap:ios` | build + sync + Xcode'da aç (yalnızca macOS) |
| `npm run cap:assets` | `assets/` kaynaklarından ikon/splash üretir* |

> *`cap:assets` PWA manifestini de yeniden yazmaya çalışır; web PWA'yı bozmamak için
> ikon kaynağı değişmedikçe çalıştırmayın. Native ikonlar zaten üretildi ve commit'li.

## Native projeyi her güncellemede
Web kodunu her değiştirdiğinde mağaza build'inden önce:
```bash
npm run cap:sync
```

## 🔧 Geliştirmeye devam ederken (ÖNEMLİ)
Native'e geçtikten sonra da uygulamayı **eskisi gibi geliştirmeye devam edersin** —
hiçbir şey değişmedi:

1. **Tüm kodu yine `src/` içinde yaz.** `android/` ve `ios/` klasörleri `dist/`
   build'inden **otomatik üretilir**; oraya elle dokunma (değişikliğin bir sonraki
   `cap sync`'te ezilir).
2. **Günlük geliştirme tarayıcıda:** `npm run dev` — hızlı, native gerekmez.
   Web/PWA ve native aynı kodu çalıştırır.
3. **Native'i sadece şu durumlarda senkronla:** mağaza build'i alacakken veya
   gerçek cihazda test edeceksen → `npm run cap:sync`.
4. **Native köprü kodu** (`src/native/capacitor.js`) zaten web'de no-op; eklediğin
   yeni sayfa/özellik native'de de otomatik çalışır, ekstra iş gerekmez.

Yani: özellik geliştir → `npm run dev` ile test et → hazır olunca `cap:sync` +
mağaza build. Geliştirme akışına engel yok.

### Ne zaman yeniden ikon/splash üretilir?
`assets/icon.png` veya `assets/splash.png` değişirse: `npm run cap:assets`
(sonra `cap sync`). Marka görseli değişmedikçe gerek yok.

### Sürüm artırma (her mağaza güncellemesinde)
- Android: `android/app/build.gradle` → `versionCode` +1, `versionName` güncelle.
- iOS: Xcode → Build numarası +1, Version güncelle.

## Önemli notlar
- **Android** bu repoda derlenebilir (Gradle + JDK). **iOS** derleme/imzalama için
  **macOS + Xcode** zorunludur (Apple kısıtı).
- İkon/splash kaynakları `assets/` içinde; üretilen native varlıklar `android/` ve
  `ios/` altında commit'li.
- Mağaza gönderimi adım adım: **[STORE_SUBMISSION.md](./STORE_SUBMISSION.md)**
- iOS / Xcode yayın rehberi: **[IOS_XCODE.md](./IOS_XCODE.md)**
- Mağaza metin/görsel içerikleri: **[store-listing-tr.md](./store-listing-tr.md)**
