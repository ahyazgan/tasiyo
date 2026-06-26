# HamTed — Likidite & Pazara Giriş Planı (GTM)

> Amaç: "cilalı demo"dan **likit bir pazaryerine** geçmek. Marketplace'i öldüren şey
> soğuk başlangıçtır (ilan var araç yok / araç var ilan yok). Bu plan onu çözer.
> Bu doküman **kod değil iş** odaklıdır — unicorn'a giden asıl iş budur.

---

## 1) Beachhead: tek şehir + tek segment
**İstanbul — Anadolu Yakası kentsel dönüşüm hattı** (Kartal, Pendik, Maltepe, Ümraniye, Sancaktepe, Sultanbeyli).
**Önce HAFRİYAT** (silobas 2. faz).

Neden burası:
- Türkiye'nin en yoğun hafriyat hacmi + kentsel dönüşüm rüzgârı (yıllarca sürecek talep).
- Yoğun damperli nakliyeci arzı (kolay arz toplama).
- **Kaçak döküm** sorunu burada akut → dijital irsaliye/takip değer önerimiz tam oturuyor (regülasyon kozu).
- Coğrafi yoğunluk = düşük "boş km", backhaul value prop'u en güçlü burada.

> Kural: Tüm Türkiye'ye yayılma. Tek ilçe kümesini **doygunluğa** getir, sonra komşu kümeye geç.

---

## 2) Soğuk başlangıç (tavuk-yumurta) çözümü
**Önce ARZ tarafını (damperli nakliyeci) topla.** Çünkü:
- Nakliyecinin acısı net: **boş dönüş + komisyoncuya kaptırılan kazanç.** Backhaul + komisyonsuz iş tam buna hitap eder.
- Arz hazırsa, talep (şantiye) geldiğinde anında araç var → "her zaman likit" hissi.

**3 katmanlı taktik:**
1. **Tek-oyunculu fayda (talep olmasa bile işe yarasın):** Nakliyeciye *boş-dönüş radarı, dijital irsaliye/sözleşme, araç ilanı, kazanç takibi.* Tek başına faydalı → uygulamada kalır (retention), ağ büyüyene kadar köprü.
2. **Concierge / elle eşleştirme:** İlk işleri **operasyon ekibi telefonla elle eşleştirir.** Platform kayıt + takip + belge tutar. "Likidite illüzyonu"nu manuel sağla; kullanıcı her zaman eşleşme görür.
3. **Likidite garantisi:** Her iş ilanına **24 saatte ≥3 teklif** garantisi (gerekirse teşvikle/manuel besle). İlk izlenim = "burada hep araç var".

---

## 3) İlk 100 kullanıcı (elle, sahadan)
Marketplace organik başlamaz; ilk kıvılcımı elle çakarsın.
- **Nakliyeci:** hafriyat sahaları, damperci durakları/kahveleri, **WhatsApp/Telegram damperci grupları**, OSB kantarları. Birebir kayıt.
- **Müteahhit/şantiye:** Anadolu Yakası kentsel dönüşüm şantiye şefleri, yapı denetim, müteahhit dernekleri.
- **Tedarikçi (silobas):** 2–3 kırma ocağı / beton santrali ile pilot.
- **Komisyoncuyu düşman etme, kanal yap:** mevcut aracıları platforma al, dijitalleştir (onların ağı = senin ilk likiditen).

---

## 4) Taraf bazlı değer önerisi (net cümleler)
- **Müteahhit:** "Belgeli aracı dakikada bul; **kaçak döküm riski yok** (dijital irsaliye), fiyat şeffaf, telefon trafiği bitti."
- **Nakliyeci:** "**Boş dönme** — dönüşte yük bul; komisyoncuya kaptırma; hakediş garantili (escrow gelince)."
- **Tedarikçi:** "Ürününü listele, yüzlerce müteahhide ulaş, **nakliyeyi platform çözsün.**"

---

## 5) North Star & ilk 90 gün hedefleri
- **North Star: haftalık tamamlanan eşleşme (matched jobs/week).**
- Destek metrikleri: fill rate (ilan başına ≥1 kabul %), ortalama eşleşme süresi (<6 sa hedef), boş-dönüş azalması, haftalık aktif nakliyeci.
- 90 gün kaba hedef (tek ilçe kümesi): ~50 aktif nakliyeci, ~20 düzenli şantiye, **haftada 30+ eşleşen iş**, eşleşme süresi <6 sa.

---

## 6) Gelir — sıralama önemli
1. **Önce likidite, sonra para.** Başta komisyon büyümeyi boğar.
2. İlk gelir (likidite oturunca): **öne çıkarma + doğrulanmış rozet** (düşük sürtünme).
3. Asıl take-rate: **escrow + işlem komisyonu** (Supabase + ödeme gelince).
4. Büyük havuz (BlackBuck modeli): **hakediş finansmanı + akaryakıt + e-irsaliye** — değerlemenin çoğu buradan.

---

## 7) Hendek (moat) tohumları — baştan ek
- **Belediye / İl Çevre Müdürlüğü pilotu:** dijital hafriyat takip = kaçak döküm engelleme. Mecburi altyapı olursan kopyalanamazsın.
- **Fiyat/rota verisi biriktir:** "Anadolu Yakası ton-km fiyatı" senin elinde → fiyatlama + finansman riski + pazarlık gücü.
- **Tekrarlayan iş sözleşmeleri:** uzun şantiyelerde anlaşmalı nakliyeci → switching cost.

---

## 8) Riskler & önlem
| Risk | Önlem |
|---|---|
| Kayıt dışı / nakit kültür | Önce komisyonsuz değer ver, güven kur; escrow'u opsiyonel başlat |
| Komisyoncu direnci | Onları kanal/ortak yap, rakip değil |
| Mevsimsellik (kış yavaş) | Çok ilçeye değil, derinliğe odaklan; silobas/agrega ile dengele |
| Güven / dolandırıcılık | SMS + belge doğrulama, puanlama, ilk işlerde manuel kontrol |
| İki taraflı boşluk | Concierge + likidite garantisi (yukarıda) |

---

## 9) Bu plan için gereken (kod dışı)
- **Saha/operasyon kişisi** (sen + 1) — ilk eşleştirmeleri elle yapacak.
- Birkaç pilot müteahhit + ocak + 20–30 nakliyeci kontağı.
- Basit operasyon: WhatsApp + bu platform (kayıt/takip/belge).
- (Sonra) tüzel: şirket, KVKK, ETBİS, sigorta ortağı.

---

### Özet: sıradaki gerçek 3 hamle
1. **Beachhead'i kilitle** (Anadolu Yakası hafriyat) + 20–30 nakliyeci elle kaydet.
2. **İlk 10 işi elle eşleştir** (concierge), platformda kayıt/takip/irsaliye tut.
3. **Likidite garantisi**ni işlet (24 saatte 3 teklif) → "her zaman likit" algısı.

Bunlar tutarsa → Supabase + ödeme + e-irsaliye gerçek anlam kazanır (ölçeklenecek bir şey olur).
