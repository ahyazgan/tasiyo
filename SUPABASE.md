# HamTed — Supabase Kurulumu (Backend Geçişi)

Bu adımlar **bir kez** yapılır. Tahmini süre: ~10 dakika. Sadece senin yapabileceğin kısım buradadır (proje oluşturma + anahtarlar). Kod tarafı (`src/lib/supabase.js`, `src/lib/api.js`, `supabase/schema.sql`) hazır.

## 1) Supabase projesi oluştur
1. https://supabase.com → ücretsiz hesap aç → **New project**
2. İsim: `hamted`, bir veritabanı şifresi belirle (bir yere not et), bölge: **Frankfurt (eu-central)** (Türkiye'ye en yakın)
3. Proje hazır olana kadar ~2 dk bekle

## 2) Şemayı yükle
1. Sol menü → **SQL Editor** → **New query**
2. Bu repodaki [`supabase/schema.sql`](supabase/schema.sql) dosyasının **tamamını** yapıştır → **Run**
3. "Success" görmelisin. (Tablolar, güvenlik kuralları, demo ilanlar oluştu.)

> **Tekrar çalıştırmak güvenli (idempotent):** Projeyi önceden kurduysan da dosyayı
> yeniden Run'layabilirsin — `add column if not exists` ile yeni alanlar (teslim kanıtı,
> mekik dönüşü, varış, hızlı ödeme, canlı konum tablosu `trip_locations`) eklenir, mevcut
> veriyi bozmaz. Bu oturumdaki lojistik özellikleri (POD, geofence, sefer takibi) için
> şemayı **bir kez daha çalıştır**.

## 3) Anahtarları al
1. Sol menü → **Project Settings** → **API**
2. Şu ikisini kopyala:
   - **Project URL** (örn. `https://abcd.supabase.co`)
   - **anon public** anahtarı (uzun `eyJ...` dizisi — bu gizli değil, tarayıcıda kullanılır)

## 4) Anahtarları projeye gir
Proje kökünde `.env.local` adında bir dosya oluştur (`.env.example`'ı kopyalayabilirsin) ve doldur:

```
VITE_SUPABASE_URL=https://abcd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> `.env.local` git'e gönderilmez (`.gitignore`'da). Anahtarları kimseyle paylaşma.

## 5) E-posta doğrulamayı (geliştirme için) kapat — opsiyonel
Test sırasında her kayıtta e-posta onayı beklememek için:
- **Authentication** → **Providers** → **Email** → "Confirm email" kapat (canlıya alırken tekrar aç).

## 6) Yeniden derle / çalıştır
Cutover **otomatik** — bana haber vermene gerek yok. Anahtarları `.env.local`'a yazıp uygulamayı yeniden başlat:

```
npm run dev      # geliştirme
# veya
npm run build && npx cap sync   # mobil derleme
```

`isSupabaseConfigured` anahtar varsa `true` olur ve uygulama **kendiliğinden** Supabase'e geçer:
- giriş/kayıt → Supabase Auth, ilan/teklif/mesaj/sipariş → veritabanı
- localStorage yalnızca tema gibi yerel tercih için kalır
- veri **çok cihazda paylaşılır**, şifreler **sunucuda güvenli** (hash'li), RLS ile herkes yalnızca kendi verisini değiştirir

### Bağlantı doğrulama
Açılışta otomatik **sağlık kontrolü** çalışır. Bir sorun varsa ekranın altında kırmızı bir uyarı çıkar ve tam nedeni söyler:
- **"tablolar yok"** → `schema.sql`'i SQL Editor'de çalıştırmayı unuttun (Adım 2).
- **"anahtar geçersiz"** → `.env.local`'daki URL/anon anahtarı yanlış (Adım 4).
- **"ulaşılamadı"** → ağ veya yanlış proje URL'si.

Uyarı çıkmazsa bağlantı sağlıklı; veriler veritabanından gelir.

---

### Şu an ne durumda?
- Kod **tamamen hazır ve bağlanmaya kablolu**; **anahtar girilene kadar app localStorage'da çalışır** (hiçbir şey bozulmaz).
- Anahtarları girip yeniden derleyince backend kendiliğinden devreye girer — ek kod değişikliği gerekmez.
