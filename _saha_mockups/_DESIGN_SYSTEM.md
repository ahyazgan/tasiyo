# SAHA Tasarım Sistemi — Tüm Sayfalara Uygulanacak

Mockup kaynağı: "SAHA Tasarım Sistemi" + 42 ekran HTML. Hedef: tüm sayfaları bu keskin
endüstriyel "saha" diline çevirmek. Fonksiyonellik %100 korunur.

## RENK (kesin değerler)
- ink (siyah/çerçeve/birincil):     #0A0A0A
- yellow (hazard/aksiyon):           #FACC15
- green (eşleşti/onay/para):         #16803C
- red (acil/bildirim):               #DC2626
- bg (manila gövde zemini):          #F1EDE5
- card (beyaz kart):                 #FFFFFF
- stone (nötr dolgu):                #F4F1EA
- header (açık manila header):       #EAE3D6
- border (kart kenarlık — İKİNCİL):  #E3DDD0  (ince ayraç/pasif kenar)
- sub (ikincil metin):               #5A5852
- muted/faint:                       #9A968D / #A8A39A

## TİPOGRAFİ
- Başlık: **Archivo** (700-900, **UPPERCASE**, letter-spacing:-0.02em). font-family:'Archivo',sans-serif
  - Büyük başlık: font-weight:900, text-transform:uppercase
- Veri/rakam/kod/etiket: **Space Mono** (400/700). ₺48.250 · 1200 TON · HMT-0001 · saat
- Gövde metni: **Plus Jakarta Sans** (500-800)
- (Üçü de index.html'de yüklü.)

## İMZA ÖĞELERİ (mockup'u "SAHA" yapan şeyler — HEPSİNİ uygula)
1. **2px SİYAH ÇERÇEVE**: kartlar/butonlar/inputlar `border:2px solid #0A0A0A`. Yumuşak/ince
   kenarlık YOK. radius genelde 6px (bazı küçük öğeler 5px, kart 6px).
2. **HAZARD ŞERİDİ** (sarı-siyah çapraz): üst/alt kenarlarda ve kart köşelerinde.
   `background-image:repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)` — yükseklik 8px.
   Kart içi dikey şerit: width 20-26px, sağ kenarda.
3. **SERT GÖLGE** (offset, blur YOK): kartlarda `box-shadow:6px 6px 0 rgba(10,10,10,.12)` veya
   `3px 3px 0 #0A0A0A` (küçük öğe). Yumuşak blur'lu gölge YOK.
4. **KOYU HEADER BLOK**: öne çıkan kartların üst kısmı `background:#0A0A0A`, beyaz/sarı metin,
   sağda hazard şeridi. (Aktif iş, cüzdan bakiye, profil header, takip kartı...)
5. **DURUM ROZETLERİ** (mono, uppercase, 2px çerçeve):
   - ● Aktif:   bg #FACC15, ink metin
   - ● Eşleşti: bg #16803C, beyaz metin
   - ● Kapalı:  bg #5A5852, beyaz metin
   - ● Acil:    bg #DC2626, beyaz metin
6. **BUTON**:
   - Birincil (İnk): bg #0A0A0A, metin #FACC15, 2px ink çerçeve, Archivo uppercase
   - Aksiyon (Sarı): bg #FACC15, metin #0A0A0A, 2px ink çerçeve
   - İkincil (Nötr): bg #FFFFFF, metin #0A0A0A, 2px ink çerçeve
7. **İLAN KARTI**: solda 6px renkli dikey şerit (hafriyat=sarı/ink, silobas=ink), 2px çerçeve,
   HMT-kodu + durum rozeti üstte, Archivo başlık, mono güzergah/ton, alt satırda kategori chip + fiyat.
8. **BOTTOM TAB BAR**: beyaz, üstte 2px siyah çizgi, aktif sekmede üstte 18x3px sarı çizgi,
   ortada büyük sarı "+" (48px, 2px çerçeve, radius 8px). lucide/stroke ikonlar (emoji DEĞİL).
9. **GERİ BUTONU / HEADER**: iç sayfalarda `bg #EAE3D6` header + 2px alt çizgi, 38px beyaz
   2px-çerçeveli geri butonu (chevron-left), Archivo uppercase sayfa başlığı.
10. **MAP/ROTA**: koyu #141414 zemin + ızgara + sarı kesik rota; HUD rozetleri mono+sarı.

## MOBİL KOLON
- Her sayfa `max-w-[460px] mx-auto`, manila zemin (#F1EDE5). App.jsx zaten kolonda render ediyor.

## DEĞİŞMEZ KURALLAR (CLAUDE.md)
- Fonksiyonellik %100 korunur: tüm navigate/onClick/state/prop sözleşmeleri aynı kalır.
- Tek veri kaynağı storage.js. Sepet/ödeme mantığı yok (escrow zaten var).
- Türkçe karakter düzgün.
- styled-components vb. EKLEME. Tailwind utility + inline style (mevcut dosyalar inline `C` paleti
  + Tailwind karışımı kullanıyor — aynı stille devam et).

## SAYFA ↔ MOCKUP ↔ ROTA EŞLEMESİ
| Dosya | Rota | Mockup |
|---|---|---|
| NakliyeHome.jsx | / | SAHA Ana Sayfa (+ Nakliyeci/Tedarikci varyantları) |
| ListingsPage.jsx | /ilanlar | SAHA Ilanlar (+ Filtre + Harita) |
| IlanDetayPage.jsx | /ilan/:id | SAHA Ilan Detay (+ Arac varyantı) |
| IlanVerPage.jsx | /ilan-ver | SAHA Ilan Ver (Adim 1 + Adim 2) |
| IlanlarimPage.jsx | /ilanlarim | SAHA Ilanlarim |
| MesajlarPage.jsx | /mesajlar | SAHA Mesajlar (liste: Gelen Kutusu, sohbet: Mesajlar) |
| ProfilPage.jsx | /profil | SAHA Profil (+ Profil Duzenle) |
| CuzdanPage.jsx | /cuzdan | SAHA Cuzdan |
| TakipPage.jsx | /takip/:id | SAHA Takip |
| SozlesmePage.jsx | /sozlesme/:offerId | SAHA Sozlesme |
| DashboardPage.jsx | /panel | SAHA Panel |
| AdminPage.jsx | /admin | SAHA Admin |
| MuteahhitPage.jsx | /muteahhit | SAHA Landing - Muteahhit |
| TedarikciPage.jsx | /tedarikci | SAHA Landing - Tedarikci |
| NakliyeciPage.jsx | /nakliyeci | SAHA Landing - Nakliyeci |
| NasilCalisirPage.jsx | /nasil-calisir | SAHA Nasil Calisir |
| HakkimizdaPage.jsx | /hakkimizda | SAHA Hakkimizda |
| IletisimPage.jsx | /iletisim | SAHA Iletisim |
| LegalPage.jsx | /yasal/:slug | SAHA Yasal |
| (NotFound, App.jsx içinde) | * | SAHA 404 Hata |
| MobileTabBar.jsx | (global) | tab bar (her ekranın altında) |
| AuthModal.jsx | (modal) | SAHA Giris |
| OnboardingModal.jsx | (modal) | SAHA Onboarding |
| NotificationBell.jsx | (dropdown) | SAHA Bildirimler |
| ReportModal / Skeleton / Toast / InstallPrompt | (parça) | SAHA Durumlar + Bos Durumlar + Yukleniyor |
| (değerlendirme modalı — TakipPage içinde) | (modal) | SAHA Degerlendirme |
| (SMS doğrulama — ProfilPage içinde) | (modal) | SAHA SMS Dogrulama |
| (belge yükleme — ProfilPage içinde) | (modal/sayfa) | SAHA Belge Yukleme |
| (dönüş yükü — ListingsPage ?mode=backhaul) | | SAHA Donus Yuku |
| SahaHome.jsx | /saha | (eski referans şablon — dokunma/sonra) |
