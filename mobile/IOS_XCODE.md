# YÜKLET — iOS / Xcode Yayın Rehberi (App Store)

iOS derleme, imzalama ve App Store'a yükleme **yalnızca macOS + Xcode** ile yapılır
(Apple kısıtı). Windows/Linux'ta iOS build alınamaz. Aşağıdaki adımlar bir Mac'te
uygulanır.

> Web kodunu Mac'te de aynı repodan kullanırsın. iOS projesine (`ios/`) **elle
> dokunmana gerek yok** — `npx cap sync ios` web build'ini içeri kopyalar.

---

## 0. Ön koşullar (Mac)
- `[ ]` macOS + **Xcode** (App Store'dan, güncel sürüm)
- `[ ]` **Apple Developer Program** üyeliği (99 USD/yıl) — https://developer.apple.com
- `[ ]` Xcode → Settings → Accounts → Apple ID'ni ekle
- `[ ]` CocoaPods kurulu (`sudo gem install cocoapods`) — Capacitor pod'ları için
- `[ ]` Node + proje bağımlılıkları (`npm install`)

## 1. Projeyi Xcode'da aç
```bash
npm install
npm run cap:ios          # build + sync + Xcode'da açar
# veya elle:
npm run build && npx cap sync ios && npx cap open ios
```
Xcode'da `ios/App/App.xcworkspace` açılır (`.xcodeproj` DEĞİL — workspace).

## 2. İmzalama (Signing)
Xcode → sol panelde **App** hedefi → **Signing & Capabilities** sekmesi:
- `[ ]` **Automatically manage signing** işaretli
- `[ ]` **Team:** Apple Developer hesabını seç
- `[ ]` **Bundle Identifier:** `com.yuklet.app` (zaten ayarlı)
- Xcode provisioning profile'ı otomatik üretir.

## 3. Gerekli Capability — Sign in with Apple
Uygulama Google ile girişi sunduğundan Apple, **Sign in with Apple**'ı da zorunlu
kılar (Guideline 4.8). Sadece localStorage demo modunda test ediyorsan giriş sahte
olsa da App Store için bu capability eklenmeli:
- `[ ]` Signing & Capabilities → **+ Capability** → **Sign in with Apple** ekle
- `[ ]` developer.apple.com → Identifiers → `com.yuklet.app` için de etkinleştir

> Not: Supabase modunda gerçek OAuth kullanılacaksa, OAuth dönüşü için derin bağlantı
> (Associated Domains / custom URL scheme) yapılandırması ayrıca gerekir. Demo/inceleme
> localStorage modunda yapılacaksa bu adım gönderim için şart değildir.

## 4. App Store Connect'te uygulama kaydı
https://appstoreconnect.apple.com → My Apps → **+** → New App:
- `[ ]` Platform: iOS · Ad: **YÜKLET** · Dil: Türkçe
- `[ ]` Bundle ID: `com.yuklet.app` (listeden seç)
- `[ ]` SKU: serbest (örn. `dayim-001`)

## 5. Sürüm numarası
Xcode → App hedefi → **General**:
- `[ ]` **Version (CFBundleShortVersionString):** `1.0.0`
- `[ ]` **Build (CFBundleVersion):** `1` (her yüklemede artır: 1, 2, 3…)

## 6. Arşivle ve yükle
- `[ ]` Üst çubukta cihaz hedefini **Any iOS Device (arm64)** yap (simülatör DEĞİL)
- `[ ]` **Product → Archive** (birkaç dakika sürer)
- `[ ]` Organizer açılır → **Distribute App** → **App Store Connect** → **Upload**
- `[ ]` İmzalama/yükleme adımlarını onayla → yükleme tamamlanır
- `[ ]` App Store Connect'te build "Processing" → birkaç dk sonra hazır

## 7. App Store Connect — mağaza bilgileri
`mobile/store-listing-tr.md` içeriklerini kullan:
- `[ ]` Açıklama, anahtar kelimeler, kategori (Business)
- `[ ]` Ekran görüntüleri: **6.7"** (1290×2796) + **6.5"** (1242×2688) zorunlu
- `[ ]` App Privacy (veri toplama) — `STORE_SUBMISSION.md §3`
- `[ ]` Yaş sınırı anketi
- `[ ]` Destek URL + Gizlilik Politikası URL (canlı olmalı)
- `[ ]` İnceleme notları + **demo hesap** (zorunlu)
- `[ ]` Build'i seç → **Submit for Review**

## 8. Yaygın ret sebepleri (önceden kontrol et)
- `[ ]` **Hesap silme** uygulama içinde var mı? → Profil > "Hesabımı kalıcı olarak sil" ✓ (eklendi)
- `[ ]` Sign in with Apple eklendi mi? (Google girişi varsa zorunlu)
- `[ ]` İzin açıklamaları net mi? (kamera/galeri — Info.plist'te ✓)
- `[ ]` Boş/çökme yok mu, demo hesapla tüm akışlar çalışıyor mu?
- `[ ]` Ekran görüntüleri gerçek uygulamayı mı gösteriyor?

---

## Güncelleme yayınlama (sonraki sürümler)
Kod değişikliğinden sonra:
```bash
# Xcode'da Build numarasını artır (örn. 1 → 2)
npm run build && npx cap sync ios
# Xcode: Product → Archive → Distribute → Upload
# App Store Connect: yeni sürüm oluştur → Submit
```
