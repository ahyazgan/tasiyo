# YÜKLET — Mağaza Gönderim Kontrol Listesi

App Store ve Google Play kriterlerini karşılamak için adım adım rehber.
Kutular: `[ ]` yapılacak · `[x]` kodda hazır.

---

## 0. Her iki mağaza için ön koşullar (ZORUNLU)

| Madde | Durum | Not |
|---|---|---|
| Gizlilik Politikası (Privacy Policy) **public URL** | `[x]` | `https://yuklet.co/yasal/gizlilik` (canlı). |
| Kullanım Koşulları URL | `[x]` | `https://yuklet.co/yasal/kullanim-kosullari` (canlı). |
| Destek (Support) URL + e-posta | `[x]` | `https://yuklet.co/iletisim` + info@yuklet.co |
| **Hesap silme** akışı (uygulama içi) | `[x]` | Profil → "Hesabımı kalıcı olarak sil" (iki adımlı onay). **Apple 5.1.1(v) karşılandı.** |
| **Hesap silme** web URL (Google zorunlu) | `[x]` | `https://yuklet.co/yasal/hesap-silme` (canlı). |
| Demo / test hesabı (inceleme için) | `[ ]` | Giriş Google/Apple OAuth ile; inceleyiciye hazır hesap + adım verin. |
| Uygulama ikonu (1024²) | `[x]` | `assets/icon.png` → native projelere üretildi. |
| Splash ekranı | `[x]` | `assets/splash.png` → üretildi. |

### ⚠️ Hesap Silme (ikisi de reddediyor — mutlaka ekleyin)
- **Apple:** Hesap oluşturulabilen her uygulamada **uygulama içi hesap silme** olmalı.
- **Google:** Uygulama içi silme **+** ayrıca **web üzerinden hesap silme talep URL'i**.
- Yapılacak: Profil sayfasına "Hesabımı Sil" ekleyin → kullanıcının verilerini
  (Supabase satırları / localStorage) temizleyip oturumu kapatın. Web silme talebi
  için `https://yuklet.co/hesap-sil` benzeri bir sayfa yayınlayın.

---

## 1. Apple App Store

### Hesap & araçlar
- `[ ]` Apple Developer Program üyeliği (99 USD/yıl)
- `[ ]` **macOS + Xcode** (iOS imzalama yalnızca Mac'te yapılır)
- `[ ]` App Store Connect'te uygulama kaydı, Bundle ID: `com.yuklet.app`

### Kodda hazır olanlar
- `[x]` Bundle ID `com.yuklet.app`, görünen ad **YÜKLET**
- `[x]` `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`,
  `NSPhotoLibraryAddUsageDescription` (foto/PDF yükleme için)
- `[x]` `ITSAppUsesNonExemptEncryption = false` (ihracat uyumu — standart HTTPS)
- `[x]` Portre yönü kilitli (iPhone)
- `[x]` Geliştirme bölgesi: `tr`

### Apple özel kuralları
- `[ ]` **Sign in with Apple:** Uygulama Google ile girişi sunuyorsa Apple ile
  girişi de sunmak **zorunludur** (Guideline 4.8). Apple OAuth zaten mevcut — App
  Store Connect'te Sign in with Apple capability'sini etkinleştirin.
- `[ ]` **App Privacy (Nutrition Labels):** App Store Connect'te veri toplama
  beyanı. Bkz. §3.
- `[ ]` Telif/marka: "YÜKLET" adı ve logosu sizde olmalı.

### Build & gönderim (macOS)
```bash
npm run cap:ios            # build + sync + Xcode
# Xcode'da: Signing & Capabilities → Team seç → Sign in with Apple ekle
# Product → Archive → Distribute App → App Store Connect → Upload
```
- `[ ]` Ekran görüntüleri: 6.7" (1290×2796) ve 6.5" (1242×2688) **zorunlu**;
  iPad istiyorsanız 12.9".
- `[ ]` App Store açıklaması, anahtar kelimeler, kategori (bkz. store-listing-tr.md)
- `[ ]` Yaş sınırı (Age Rating) anketi
- `[ ]` İnceleme notları: demo hesap + "ilan ver → teklif" akışını açıklayın.

---

## 2. Google Play Store

### Hesap & araçlar
- `[ ]` Google Play Developer hesabı (25 USD tek seferlik)
- `[x]` JDK + Gradle (bu repoda Android derlenebilir)
- `[x]` `targetSdk = 36`, `minSdk = 24` (Play 2024+ gereği: targetSdk ≥ 35 ✓)

### İmzalı AAB üretimi
> İmzalama `android/app/build.gradle`'a **hazır bağlandı**: `android/keystore.properties`
> varsa release otomatik imzalanır, yoksa derleme bozulmadan imzasız kalır.

```bash
# 1) Upload keystore oluştur (BİR KEZ — güvenli sakla, kaybetme!)
keytool -genkey -v -keystore android/dayim-upload.keystore \
  -alias dayim -keyalg RSA -keysize 2048 -validity 10000

# 2) Şablondan keystore.properties oluştur ve doldur (commit ETME — .gitignore'da):
cp android/keystore.properties.example android/keystore.properties
#   storeFile=dayim-upload.keystore   (yol android/ klasörüne göre)
#   storePassword=...
#   keyAlias=dayim
#   keyPassword=...

# 3) Release AAB:
npm run build && npx cap sync android
cd android && ./gradlew bundleRelease
# çıktı: android/app/build/outputs/bundle/release/app-release.aab
```
- `[x]` İmzalama yapılandırması `app/build.gradle`'da hazır (keystore.properties okur).
- `[ ]` Keystore oluştur + `keystore.properties`'i doldur.
- `[ ]` **Play App Signing**'i etkinleştirin (Google imzalama anahtarını yönetir).

### Play Console adımları
- `[ ]` Uygulama oluştur → paket adı `com.yuklet.app`
- `[ ]` **Data safety** formu (bkz. §3)
- `[ ]` İçerik derecelendirme anketi
- `[ ]` Hedef kitle & içerik (18+ değil; işletme)
- `[ ]` Gizlilik politikası URL
- `[ ]` **Hesap silme** beyanı (uygulama içi + web URL)
- `[ ]` Görseller: feature graphic **1024×500**, en az 2 telefon ekran görüntüsü,
  uygulama ikonu 512×512.
- `[ ]` Önce **Internal testing** track'e yükleyip test edin, sonra Production.

---

## 3. Veri toplama beyanı (her iki mağaza)

YÜKLET mevcut halde **iki modda** çalışabilir:
- **localStorage modu** (backend yok): veriler **yalnızca cihazda** tutulur,
  sunucuya gönderilmez.
- **Supabase modu** (`.env` ile etkin): hesap, ilan, mesaj verileri sunucuda tutulur.

Hangi mod canlıya çıkacaksa beyanı ona göre doldurun. Supabase modu için:

| Veri türü | Toplanıyor mu | Amaç |
|---|---|---|
| Ad, e-posta, telefon | Evet | Hesap, kullanıcı doğrulama, iletişim |
| Kullanıcı içeriği (ilan, mesaj, foto/belge) | Evet | Uygulama işlevi (eşleştirme) |
| Konum (il/ilçe — kullanıcı girer) | Evet (hassas GPS değil) | İlan eşleştirme |
| Tanımlayıcılar (kullanıcı ID) | Evet | Hesap yönetimi |
| Reklam/izleme | Hayır | — |

- Veriler **şifreli (HTTPS)** aktarılır.
- Kullanıcı **hesabını silebilir** (eklenecek — §0).
- Üçüncü taraf girişler: Google, Apple (OAuth).

> Not: Uygulama **konum izni (GPS) istemez** — il/ilçe kullanıcı tarafından elle
> girilir; bu yüzden `NSLocationUsageDescription` / Android konum izni eklenmedi.

---

## 4. Sürüm yönetimi
- Android: `android/app/build.gradle` → her yeni gönderimde `versionCode` +1,
  `versionName` güncelle (şu an `1 / 1.0.0`).
- iOS: Xcode → `MARKETING_VERSION` (1.0.0) ve `CURRENT_PROJECT_VERSION` (build no).

## 5. Yayın öncesi son test
- `[ ]` Android cihaz/emülatörde: giriş, ilan ver, teklif, mesaj, geri tuşu, splash.
- `[ ]` iOS cihaz/simülatörde: aynı akışlar + çentik güvenli alanı.
- `[ ]` Çevrimdışı davranış makul (native'de SW kapalı; ağ hatası zarifçe yönetilir).
- `[ ]` Dosya yükleme (kamera/galeri) izin diyaloglarıyla çalışıyor.
