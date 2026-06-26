import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, FileText } from "lucide-react";
import SEO from "../components/SEO";

// ── Yasal — SAHA design language (tab chips, hazard top strip, Archivo uppercase
// section titles, mono meta, 2px ink border). Slug routing + content preserved 1:1.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
};
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const BODY = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const LEGAL_PAGES = {
  "gizlilik": {
    title: "Gizlilik Politikasi",
    content: `YÜKLET Teknoloji A.Ş. ("YÜKLET") olarak, kullanicilarimizin gizliligine onem veriyoruz. Bu politika, kisisel verilerinizin nasil toplandigi, kullanildigi ve korundugu hakkinda bilgi vermektedir. YÜKLET, yuk sahibi ile nakliyeciyi bulusturan bir eslestirme platformudur.

## 1. Toplanan Veriler

Platform uzerinden asagidaki kisisel veriler toplanabilir:

- **Kimlik Bilgileri:** Ad, soyad, firma unvani, vergi numarasi
- **Iletisim Bilgileri:** E-posta adresi, telefon numarasi, adres
- **Ilan Bilgileri:** Yayinladiginiz is/arac ilanlari, yukleme ve bosaltma noktalari
- **Teklif Bilgileri:** Verdiginiz veya aldiginiz teklifler, mesajlasma gecmisi
- **Teknik Veriler:** IP adresi, tarayici bilgisi, cerez verileri
- **Kullanim Verileri:** Platform icindeki etkilesimler, arama gecmisi

## 2. Verilerin Kullanim Amaci

Toplanan veriler asagidaki amaclarla kullanilir:

- Ilan yayinlama ve eslestirme hizmetinin sunulmasi
- Kullanici hesaplarinin olusturulmasi ve yonetimi
- Taraflar arasinda iletisim ve teklif surecinin saglanmasi
- Karsilikli degerlendirme ve guven puani sisteminin isletilmesi
- Platform iyilestirme ve analiz calismalari
- Yasal yukumluluklerin yerine getirilmesi

## 3. Verilerin Paylasilmasi

Kisisel verileriniz, asagidaki durumlar disinda ucuncu taraflarla paylasilmaz:

- Eslestirme amaciyla, ilan verdiginiz/teklif aldiginiz karsi taraf ile
- Yasal zorunluluklar gerektirdiginde yetkili kurumlar
- Platform altyapisini saglayan teknik hizmet saglayicilar

## 4. Veri Guvenligi

- 256-bit SSL sifreleme ile veri iletimi
- Erisim kontrolu ve yetkilendirme mekanizmalari
- Duzenli guvenlik denetimleri

## 5. Cerez Politikasi

Platform, kullanici deneyimini iyilestirmek icin cerezler kullanir:

- **Zorunlu Cerezler:** Platform isleyisi icin gerekli
- **Analitik Cerezler:** Kullanim istatistikleri (Google Analytics)
- **Tercih Cerezleri:** Dil, tema gibi kullanici tercihleri

## 6. Haklariniz

6698 sayili KVKK kapsaminda asagidaki haklara sahipsiniz:

- Kisisel verilerinizin islenip islenmedigini ogrenme
- Islenen veriler hakkinda bilgi talep etme
- Verilerin duzeltilmesini veya silinmesini isteme
- Islemenin kisitlanmasini talep etme
- Verilerin tasinabilirligini talep etme

Basvurulariniz icin: kvkk@yuklet.co

## 7. Iletisim

YÜKLET Teknoloji A.Ş.
Buyukdere Cad. No:123 Kat:5, Levent, Istanbul
E-posta: info@yuklet.co
Telefon: +90 (212) 555 00 00`
  },
  "kullanim-kosullari": {
    title: "Kullanim Kosullari",
    content: `Bu kullanim kosullari, YÜKLET platformunu kullanan tum kullanicilar icin gecerlidir. Platformu kullanarak bu kosullari kabul etmis sayilirsiniz.

## 1. Tanimlar

- **Platform:** yuklet.co web sitesi ve mobil uygulamasi
- **Kullanici:** Platformu kullanan gercek veya tuzel kisi
- **Is Sahibi:** Tasinacak yuk icin is ilani veren taraf (muteahhit, firma, kisi)
- **Nakliyeci:** Arac ilani veren veya ise teklif veren tasiyici taraf

## 2. Platformun Niteligi

- YÜKLET, is sahibi ile nakliyeciyi bulusturan bir eslestirme/ilan platformudur
- Platform, tasima hizmetinin tarafi degildir; tasima sozlesmesi dogrudan kullanicilar arasinda kurulur
- Platform, ilan ve tekliflerin dogrulugunu garanti etmez

## 3. Uyelik Kosullari

- Uyelik icin gercek ve dogru bilgi verilmesi gerekir
- 18 yasindan kucukler platform uzerinden islem yapamaz
- Yanlis veya yaniltici bilgi vermek uyeligin iptaline yol acar

## 4. Ilan ve Teklif Kurallari

- Ilanlar gercek bir is veya arac icin verilmelidir
- Yaniltici, mukerrer veya konu disi ilanlar kaldirilabilir
- Verilen teklifler baglayici nitelikte olup iyi niyet kurallarina tabidir
- Anlasma ve odeme kosullari taraflar arasinda serbestce belirlenir

## 5. Sorumluluk Sinirlamasi

- Tasimanin yapilmasi, kalitesi ve odemesi taraflarin sorumlulugundadir
- Platform, kullanicilar arasindaki uyusmazliklarin tarafi degildir
- Arac belgeleri, yetki belgeleri (orn. K belgesi) ve sigorta yukumlulukleri ilgili tarafa aittir
- Platform, ucuncu taraf sitelere verilen linklerin iceriginden sorumlu degildir
- Mucbir sebepler nedeniyle olusan aksakliklardan sorumluluk kabul edilmez

## 6. Fikri Mulkiyet

- Platform uzerindeki tum icerik, tasarim ve yazilim YÜKLET'e aittir
- Izinsiz kopyalama, dagitma veya degistirme yasaktir

## 7. Uyusmazlik Cozumu

- Bu kosullar Turkiye Cumhuriyeti kanunlarina tabidir
- Uyusmazliklarda Istanbul Mahkemeleri ve Icra Daireleri yetkilidir`
  },
  "kvkk": {
    title: "KVKK Aydinlatma Metni",
    content: `6698 Sayili Kisisel Verilerin Korunmasi Kanunu ("KVKK") uyarinca, YÜKLET Teknoloji A.Ş. olarak veri sorumlusu sifatiyla sizleri bilgilendirmek isteriz.

## 1. Veri Sorumlusu

YÜKLET Teknoloji A.Ş.
Mersis No: 0123456789012345
Adres: Buyukdere Cad. No:123 Kat:5, Levent, Istanbul

## 2. Kisisel Verilerin Islenmesi

Kisisel verileriniz, KVKK'nin 5. ve 6. maddelerinde belirtilen hukuki sebeplere dayanilarak asagidaki amaclarla islenmektedir:

- Ilan yayinlama ve eslestirme hizmetinin yurutulmesi
- Taraflar arasinda iletisim ve teklif surecinin saglanmasi
- Kullanici iliskileri yonetimi ve guven puani sistemi
- Bilgi guvenligi sureclerinin yurutulmesi
- Hukuki sureclerin takibi

## 3. Kisisel Verilerin Aktarimi

Kisisel verileriniz, yukarida belirtilen amaclar dogrultusunda:

- Eslestirme amaciyla ilgili karsi tarafa
- Teknik altyapi ve hizmet saglayicilara
- Yasal zorunluluk halinde yetkili kamu kurumlarina

KVKK'nin 8. ve 9. maddelerinde belirtilen kosullara uygun olarak aktarilabilir.

## 4. Veri Toplama Yontemi ve Hukuki Sebebi

Kisisel verileriniz;
- Uyelik formu
- Ilan ve teklif formlari
- Iletisim formu
- Cerezler ve otomatik yontemler

araciligiyla, sozlesmenin ifasi, yasal yukumluluk ve mesru menfaat hukuki sebeplerine dayanilarak toplanmaktadir.

## 5. Veri Sahibi Haklari (KVKK Madde 11)

KVKK'nin 11. maddesi uyarinca;

a) Kisisel verilerinizin islenip islenmedigini ogrenme
b) Islenmisse buna iliskin bilgi talep etme
c) Isleme amacini ve amacina uygun kullanilip kullanilmadigini ogrenme
d) Yurt icinde veya yurt disinda aktarildigi ucuncu kisileri bilme
e) Eksik veya yanlis islenmisse duzeltilmesini isteme
f) KVKK'nin 7. maddesinde ongoren kosullar cercevesinde silinmesini/yok edilmesini isteme
g) Duzeltme ve silme islemlerinin aktarildigi ucuncu kisilere bildirilmesini isteme
h) Islenen verilerin munhasiran otomatik sistemler vasitasiyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya cikmasina itiraz etme
i) Kanuna aykiri olarak islenmesi sebebiyle zarara ugramaniz halinde zararin giderilmesini talep etme

haklarina sahipsiniz.

## 6. Basvuru Yontemi

Haklarinizi kullanmak icin:
- E-posta: kvkk@yuklet.co
- Posta: Buyukdere Cad. No:123 Kat:5, Levent, Istanbul
- KEP: yuklet@hs01.kep.tr

Basvurular en gec 30 gun icinde sonuclandirilir.`
  },
  "hesap-silme": {
    title: "Hesap ve Veri Silme",
    content: `YÜKLET hesabinizi ve hesabinizla iliskili tum verileri kalici olarak silebilirsiniz. Bu sayfa, Google Play ve App Store gerekleri uyarinca hesap silme yontemini ve silinen verileri aciklar.

## 1. Uygulama Icinden Silme (Onerilen)

En hizli yontem uygulama uzerinden silmektir:

- **Profil** sekmesini acin
- Sayfanin altindaki **"Hesabimi kalici olarak sil"** secenegine dokunun
- Onay adimini tamamlayin

Hesabiniz ve verileriniz aninda silinir, oturumunuz kapatilir.

## 2. Web Uzerinden Silme Talebi

Uygulamaya erisiminiz yoksa, hesabinizi web uzerinden silmek icin talep gonderebilirsiniz:

- **E-posta:** info@yuklet.co adresine, hesabinizla kayitli e-posta adresinden "Hesap Silme Talebi" konusuyla yazin
- Kimlik dogrulamasi sonrasi talebiniz **en gec 30 gun** icinde islenir

## 3. Silinen Veriler

Hesap silindiginde asagidaki veriler **kalici olarak** silinir:

- **Hesap Bilgileri:** Ad, e-posta, telefon, firma bilgileri
- **Ilanlariniz:** Yayinladiginiz tum is ve arac ilanlari
- **Teklifleriniz:** Verdiginiz ve aldiginiz tum teklifler
- **Mesajlariniz:** Tum mesajlasma gecmisi
- **Belgeleriniz:** Yukledginiz belgeler ve dogrulama kayitlari
- **Degerlendirmeler:** Verdiginiz puan ve yorumlar

## 4. Saklanabilecek Veriler

Yasal yukumlulukler geregi bazi veriler sinirli sure saklanabilir:

- Fatura ve odeme kayitlari (Vergi Usul Kanunu uyarinca 5 yil)
- Yasal uyusmazlik konusu olan kayitlar (uyusmazlik suresince)

Bu veriler yalnizca yasal zorunluluk kapsaminda tutulur ve baska amacla kullanilmaz.

## 5. Iletisim

Sorulariniz icin:
- E-posta: info@yuklet.co
- KVKK talepleri: kvkk@yuklet.co`
  }
};

// Tab chips — slug-based navigation (routing preserved)
const TABS = [
  { slug: "gizlilik", label: "Gizlilik" },
  { slug: "kullanim-kosullari", label: "Kullanım" },
  { slug: "kvkk", label: "KVKK" },
  { slug: "hesap-silme", label: "Hesap Sil" },
];

const shell = { display: "flex", flexDirection: "column", minHeight: "100%", background: C.bg, fontFamily: BODY };

export default function LegalPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const page = LEGAL_PAGES[slug];

  if (!page) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "64px 20px", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #0A0A0A" }}>
          <FileText size={26} strokeWidth={2.2} color={C.ink} />
        </div>
        <div style={{ marginTop: 14, fontFamily: ARCHIVO, fontSize: 15, fontWeight: 900, textTransform: "uppercase", color: C.ink }}>Sayfa Bulunamadı</div>
        <Link to="/" style={{ marginTop: 10, fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: C.ink }}>Ana sayfaya dön →</Link>
      </div>
    );
  }

  return (
    <div style={shell}>
      <SEO title={page.title} description={page.title + " - YÜKLET Teknoloji A.Ş."} />

      {/* App bar */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 20, background: C.header,
          borderBottom: `2px solid ${C.ink}`, display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
        }}
      >
        <button
          onClick={() => navigate(-1)} aria-label="Geri"
          style={{ border: `2px solid ${C.ink}`, background: C.card, borderRadius: 6, width: 38, height: 38, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.ink }}
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Yasal</h1>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tab chips */}
        <div style={{ display: "flex", gap: 8 }}>
          {TABS.map((t) => {
            const active = t.slug === slug;
            return (
              <button
                key={t.slug}
                onClick={() => navigate(`/yasal/${t.slug}`)}
                style={{
                  flex: 1, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "9px 6px",
                  background: active ? C.ink : C.card, color: active ? C.yellow : C.ink,
                  fontFamily: MONO, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.02em", cursor: "pointer",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Content card — hazard top strip */}
        <div style={{ position: "relative", overflow: "hidden", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" }}>
          <div style={{ height: 7, backgroundImage: HAZARD }} />
          <div style={{ padding: 18 }}>
            <h2 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>{page.title}</h2>
            <div style={{ marginTop: 6, fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.muted }}>
              Son güncelleme: 1 Ocak 2026 · YÜKLET Teknoloji A.Ş.
            </div>

            <div style={{ marginTop: 16, fontFamily: BODY, fontSize: 13, lineHeight: 1.6, color: C.sub }}>
              {page.content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) {
                  return (
                    <h3 key={i} style={{ margin: "22px 0 8px", fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>
                      {line.replace("## ", "")}
                    </h3>
                  );
                }
                if (line.startsWith("- **")) {
                  const parts = line.replace("- **", "").split(":**");
                  return (
                    <div key={i} style={{ marginBottom: 6, paddingLeft: 4 }}>
                      <strong style={{ color: C.ink }}>{parts[0]}:</strong>{parts[1]}
                    </div>
                  );
                }
                if (line.startsWith("- ")) return <div key={i} style={{ marginBottom: 6, paddingLeft: 4 }}>{line.replace("- ", "• ")}</div>;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i} style={{ margin: "0 0 8px" }}>{line}</p>;
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
