// YÜKLET - 3 tarafli platform: Alici/Muteahhit | Tedarikci | Nakliyeci
// Tasima kategorileri (hafriyat + silobas) + genisletilmis yuk/arac tipleri

export const CATS = [
  { id: "hafriyat", name: "Hafriyat", icon: "🚛", clr: "#C85A24", desc: "Kazi, toprak ve moloz tasima" },
  { id: "silobas", name: "Silobas & Dökme", icon: "🛢️", clr: "#2E6FA3", desc: "Dokme yuk: cimento, agrega, tahil, kimyasal" },
];

// Kullanici rolleri (3 taraf)
export const ROLES_EXTENDED = [
  { id: "muteahhit", label: "Müteahhit / Alıcı", icon: "🏗️", desc: "İş ilanı acar, yük ve nakliye arar" },
  { id: "tedarikci", label: "Tedarikçi", icon: "⛏️", desc: "Malzeme satar: ocak, beton, kum" },
  { id: "nakliyeci", label: "Nakliyeci / Taşıyıcı", icon: "🚚", desc: "Araç ilanı açar, yük taşır" },
];

// Ilan yonu
export const LISTING_TYPES = [
  { id: "is", name: "İş ilanı", desc: "Taşınacak yük / iş var" },
  { id: "arac", name: "Araç ilanı", desc: "Boş araç, iş arıyor" },
  { id: "urun", name: "Ürün ilanı", desc: "Malzeme satıyorum (ocak/santral)" },
];

// Urun ilani stok seviyeleri (tedarikci malzeme satisi)
export const STOCK_LEVELS = [
  { id: "bol", label: "Bol stok" },
  { id: "orta", label: "Orta stok" },
  { id: "az", label: "Az stok" },
];

// --- HAFRİYAT ---
export const HAFRIYAT_MATERIALS = [
  // Kazi / Toprak
  "Toprak (kazı)",
  "Bitkisel toprak (humus)",
  "Kil",
  "Dolgu toprağı",
  // Moloz / Yıkıntı
  "İnşaat molozi",
  "Yıkıntı molozi",
  "Tuğla kırığı",
  "Beton kırığı",
  // Kaya / Taş
  "Kaya / Taş",
  "Granit kırığı",
  "Bazalt",
  "Kırma taş (büyük)",
  // Özel
  "Asfalt kırığı / frezeleme",
  "Demir / metal hurda",
  "Hafriyat (karışık)",
];

export const HAFRIYAT_VEHICLES = [
  "Damperli kamyon (5–8 t)",
  "Damperli kamyon (10–12 t)",
  "Damperli kamyon (15–18 t)",
  "Damperli kamyon (20–25 t)",
  "Hafriyat kamyonu (kaya tipi)",
  "Kırk ayak – 4 dingil (30 t+)",
  "Treyler / lowbed",
  "Mini damper / traktör römork",
  "Ekskavatörlü + damper (komple)",
];

// --- SİLOBAŞ & DÖKÜME ---
export const SILOBAS_MATERIALS = [
  // İnşaat / Bağlayıcı
  "Çimento (döküme)",
  "Kireç (söndürülmüş/kalsit)",
  "Alçı (döküme)",
  "Uçucu kül (fly ash)",
  // Agrega / Kum
  "Kum (0–3 mm)",
  "İnce kum (0–1 mm)",
  "Çakıl (3–8 mm)",
  "Mıcır (8–16 mm)",
  "Mıcır (16–32 mm)",
  "Kırma taş (agrega)",
  "Bazalt agrega",
  // Gıda / Tarım
  "Buğday",
  "Arpa",
  "Mısır",
  "Yulaf",
  "Çeltik / Pirinç",
  "Ayçiçeği tohumu",
  "Kanola",
  "Katı hayvan yemi",
  "Un (döküme)",
  "Nişasta",
  "Şeker",
  "Tuz",
  // Kimyasal / Endüstriyel
  "Kimyasal granül",
  "Plastik granül (pelet)",
  "Gübre (granül)",
  "Gübre (toz)",
  "Soda külü",
  "Diğer döküme yük",
];

export const SILOBAS_VEHICLES = [
  "Silobas – Çimento (20 t)",
  "Silobas – Çimento (30 t)",
  "Silobas – Çimento (40 t)",
  "Silobas – Gıda / Tahıl (hyjienik)",
  "Silobas – Kimyasal (inox)",
  "Tanker – Sıvı gıda (paslanmaz)",
  "Tanker – Sıvı kimyasal",
  "Dökme yük dorsesi (açık üst)",
  "Kapalı kasa (toz yük)",
  "Flexitank (çuval dökme)",
];

// --- BIRLESIK export (geriye donuk uyumluluk) ---
export const MATERIALS = {
  hafriyat: HAFRIYAT_MATERIALS,
  silobas: SILOBAS_MATERIALS,
};

export const VEHICLE_TYPES = {
  hafriyat: HAFRIYAT_VEHICLES,
  silobas: SILOBAS_VEHICLES,
};

export const UNITS = ["ton", "m³", "sefer", "kamyon", "yük", "TIR"];

// İller listesi (App genelinde kullanilir)
export const IL_LIST = [
  "İstanbul", "Ankara", "İzmir", "Bursa", "Antalya",
  "Adana", "Konya", "Gaziantep", "Mersin", "Kocaeli",
  "Diyarbakır", "Şanlıurfa", "Samsun", "Trabzon", "Kayseri",
  "Eskişehir", "Sakarya", "Tekirdağ", "Balıkesir", "Malatya",
];
