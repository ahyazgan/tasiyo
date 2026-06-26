# HamTed — "SAHA" Marka Dili + Mobil App Tasarım Promptu

> Yeni marka dili: **Endüstriyel / Saha** · Açık tema (manila/beton) · Dengeli sertlik.
> Aşağıdaki **PROMPT** bloğunu Claude Design / Figma'ya kopyala-yapıştır.

---

## 📋 PROMPT (bunu kopyala)

```
HamTed adlı mobil uygulama için ÖZGÜN bir marka dili ve mobil app tasarımı
yap. Önce aşağıdaki marka yönünü benimse, sonra ana sayfa (home) ekranını
bu dile göre tasarla. Telefon boyutu, gerçek Türkçe içerik (lorem yok).

══════════ MARKA DİLİ: "SAHA" ══════════
Karakter: ENDÜSTRİYEL / ŞANTİYE. Ağır iş, hafriyat, kamyon, toz-toprak,
beton dünyası. Güçlü, dürüst, sahaya yakın — ama modern ve okunaklı.
Klişe startup/SaaS görünümünden, mor gradyanlardan, yuvarlak dostane
"app" estetiğinden KESİNLİKLE kaçın. Bu bir iş aracı, oyuncak değil.

TEMA: AÇIK. Zemin manila/beton tonu (kirli bej / açık gri, örn #E8E4DC veya
#F0EEE9). Beyaz değil — kağıt/evrak/şantiye dokümanı hissi. "Sevk fişi /
irsaliye" çağrışımı olsun.

RENK:
• Vurgu: HAZARD SARISI #FACC15 / #F5C518 (inşaat uyarı sarısı, CAT sarısı)
• Kontrast: SİYAH #0A0A0A / antrasit #1A1A1A (siyah çerçeveler, başlıklar)
• Zemin: manila/beton bej #E8E4DC
• Kart: kırık beyaz #FAF9F6 üstünde SİYAH ince çerçeve
• Durum: yeşil (aktif), turuncu/amber (bekliyor), kırmızı (acil/iptal)
• Sarı-siyah diagonal hazard şerit motifi → ince aksanlarda, ayraçlarda

TİPOGRAFİ:
• Başlıklar: KALIN, SIKIŞIK, condensed/grotesk sans (örn Archivo, Anton,
  Oswald, Bebas) — BÜYÜK HARF başlıklar, sıkı harf aralığı.
• Rakamlar/veri: MONO font (örn Space Mono, JetBrains Mono) — sefer sayısı,
  ton, ₺, ilan no'su mono ile "teknik/ölçüm" hissi versin.
• Gövde: okunaklı nötr sans.

FORM / STİL (dengeli — sert ama kullanışlı):
• Kartlar: SİYAH ince çerçeve (1.5-2px), keskin/az yuvarlatılmış köşeler
  (radius 4-8px, pill değil). Yumuşak gölge YOK; düz, net.
• Etiketler: köşeli rozet, BÜYÜK HARF, mono veya condensed.
• Butonlar: dolu sarı + siyah metin VEYA siyah + sarı metin. Köşeli.
• İkonografi: kalın çizgili, teknik (damperli kamyon, silobas, koni, kask,
  dingil). Sevimli/yuvarlak emoji değil.
• Dokunuşlar: ilan no'su "HMT-0042" gibi, durum "● AKTİF" gibi, sefer
  sayacı "12/67 SEFER" gibi — operasyonel/teknik dil.

══════════ ÜRÜN (ne tasarlıyoruz) ══════════
HamTed = Türkiye'de HAFRİYAT ve SİLOBAS/DÖKME yük taşımacılığını buluşturan
İLAN & EŞLEŞTİRME platformu. E-ticaret DEĞİL (sepet/satın alma yok).
Akış: müteahhit iş ilanı açar → nakliyeci teklif verir → eşleşir → iş başlar.

İki tür: HAFRİYAT (toprak/moloz/kaya, damperli kamyon) ·
SİLOBAS (çimento/kum/mıcır, silobas/tanker).
Üç kullanıcı: müteahhit (iş açan), nakliyeci (taşıyan), tedarikçi (ocak).

══════════ ANA SAYFA İÇERİĞİ ══════════
(Düzeni sen kurgula — bu öğeler bulunsun:)
• Üst bar: HamTed logosu + "MERHABA, [İSİM]" + rol (MÜTEAHHİT/NAKLİYECİ) +
  bildirim + profil.
• Arama: "İL, MALZEME VEYA GÜZERGAH ARA"
• Hızlı durum: AKTİF İLAN · BEKLEYEN TEKLİF · CÜZDAN (mono rakamlar, iri)
• Öne çıkan aksiyon: "İLANINI AÇ — TEKLİF AL" (sarı, %0 komisyon)
• İki kategori: HAFRİYAT · SİLOBAS (teknik ikonlu)
• DÖNÜŞ YÜKÜ widget'ı: "BOŞ DÖNME — YOLDA YÜK AL" (platformun özgün özelliği)
• Son ilanlar listesi: her kart → kategori ikonu + başlık + GÜZERGAH
  (örn "DUDULLU → SAMANDIRA") + miktar (mono "1200 TON") + fiyat/durum rozeti
• Güven sayıları: "2.400+ İLAN · 850+ NAKLİYECİ · %0 KOMİSYON" (mono, iri)
• Alt tab bar: ANA · İLANLAR · (+İLAN VER) · MESAJLAR · PROFİL

Gerçek örnek ilanlar:
• "Dudullu şantiye hafriyat taşıma" — İstanbul/Ümraniye · 1200 ton
• "Çimento fabrikasından şantiyeye dökme çimento" — Kocaeli/Gebze · 28 ton · ₺4.500
• "Damperli kamyon boş — Anadolu yakası" — İstanbul/Pendik · boş araç
• "Limandan fabrikaya dökme mıcır" — İzmir/Aliağa · 120 ton

══════════ TON & DİL ══════════
Türkçe, saha dili: müteahhit, nakliyeci, sefer, güzergah, dökme, hafriyat,
irsaliye. Buton metinleri fiille/komutla: "İLAN AÇ", "TEKLİF VER",
"DÖNÜŞ YÜKÜ BUL". Kısa, net, operasyonel.

══════════ ÇIKTI ══════════
1) Önce kısa bir marka özeti (renk paleti + font + stil kararları).
2) Sonra yüksek çözünürlüklü mobil ANA SAYFA ekranı (gerçek içerikli).
3) 2-3 varyasyon üretip en SAHA'ya uygun olanı öner.
İstersen tutarlı bir mini tasarım sistemi (renk/font/kart/buton) de göster.
```

---

## 💡 Notlar
- Bu prompt **SAHA marka dilini** tanımlar + **ana sayfa** ister.
- Açık tema (manila/beton), dengeli sertlik, hazard sarısı + siyah çerçeve.
- Beğendiğin tasarımın **React kodunu** veya **ekran görüntüsünü** bana getir →
  bu yeni marka dilini DESIGN.md'ye işleyip tüm uygulamaya yayarım (rebrand).
- Bu bir **marka değişimi** — mevcut "MoveIQ LIGHT" yerine geçecek. Onayladığında
  diğer sayfaları da (ilan ver, detay, takip…) bu dile taşırım.

## 🔗 Entegrasyon
Tasarım şu props'larla uyumlu olursa entegrasyon anında:
`{ listings, user, pendingOffersCount, unreadCount, onLoginClick }`
(olmasa da ben uyarlarım — sen tasarıma odaklan.)
```
```
