// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET Akıllı Fiyat — şeffaf sezgisel taban + geçmişten öğrenme.   ║
// ║  Taban: il yakınlığı → ort. km, kategori çarpanı, sefer sayısı.    ║
// ║  Öğrenme: geçmiş KABUL teklifleri + sabit fiyatlı ilanlardan       ║
// ║  ₺/ton-km medyanı çıkarır, taban tahminle harmanlar. Veri          ║
// ║  biriktikçe güven artar (tahmin → düşük → orta → yüksek).          ║
// ║  Supabase + gerçek işlem verisiyle ileride aynı arayüzle kalibre.  ║
// ╚══════════════════════════════════════════════════════════════════╝

import { ilDistance, capacityTonOf, routeOf } from "./backhaul";

const KM_BAND = { 0: 18, 1: 90, 2: 220, 3: 520 };       // il yakınlığına göre ort. km
const CAT_RATE = { hafriyat: 1.0, silobas: 1.28 };       // silobas özel araç → daha pahalı
const BASE = 1200;                                        // sefer taban maliyeti (yükleme/operasyon)
const PER_KM = 22;                                        // ₺/km (araç + yakıt + sürücü)

const round50 = (n) => Math.round(n / 50) * 50;
const median = (arr) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
// Ağırlıklı medyan — items: [{ rate, w }] (ağırlığı yüksek örnek merkezi daha çok çeker).
const weightedMedian = (items) => {
  if (!items.length) return null;
  const s = [...items].sort((a, b) => a.rate - b.rate);
  const total = s.reduce((t, i) => t + i.w, 0);
  let acc = 0;
  for (const it of s) { acc += it.w; if (acc >= total / 2) return it.rate; }
  return s[s.length - 1].rate;
};

// Türkçe-duyarsız sadeleştirme ("Çimento" == "cimento").
const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();

// Malzeme yoğunluk/zorluk çarpanı (kategori tabanına göre). Ağır/sert/özel = pahalı.
export function materialFactor(material) {
  const f = fold(material);
  if (!f) return 1;
  // hafriyat
  if (/(kaya|granit|bazalt|kirma tas)/.test(f)) return 1.12;   // sert kaya — aşındırıcı, ağır
  if (/(toprak|humus|kil|dolgu)/.test(f)) return 0.93;          // hafif, kolay
  if (/(asfalt|frez)/.test(f)) return 1.05;
  if (/(metal|hurda)/.test(f)) return 1.08;
  // silobas
  if (/(cimento|kirec|alci|ucucu|kul)/.test(f)) return 1.15;    // bağlayıcı — tozlu, kapalı silobas
  if (/(kimyasal|plastik|granul|gubre|soda)/.test(f)) return 1.20; // özel/inox ekipman
  if (/(bugday|arpa|misir|yulaf|celtik|pirinc|aycicek|kanola|yem|un|nisasta|seker|tuz)/.test(f)) return 1.10; // gıda — hijyenik
  return 1; // moloz, kum, çakıl, mıcır, agrega vb. taban
}

// Araç tipi çarpanı — özel/paslanmaz ekipman ve büyük tonaj primi.
export function vehicleFactor(vehicle) {
  const f = fold(vehicle);
  if (!f) return 1;
  if (/(inox|kimyasal|hijyen|gida|tanker|sivi|paslanmaz)/.test(f)) return 1.10;
  if (/(treyler|lowbed|kirk ayak|dingil)/.test(f)) return 1.05;
  return 1;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// Hacim/ölçek çarpanı — büyük partilerde ₺/ton-km düşer (toplu nakliye).
export function volumeFactor(tons) {
  if (!tons) return 1;
  if (tons < 30) return 1.05;     // küçük parti — primli
  if (tons < 150) return 1.0;
  if (tons < 600) return 0.96;
  return 0.92;                     // çok büyük iş — toplu indirim
}

// Aciliyet/esneklik çarpanı — acil iş primli, düzenli/esnek iş indirimli.
export function urgencyFactor({ dateText, recurring } = {}) {
  const f = fold(dateText);
  if (/(acil|bugun|yarin|ivedi)/.test(f)) return 1.06;
  if (recurring) return 0.95;     // süreklilik taahhüdü → indirim
  return 1;
}

// Mevsimsellik çarpanı — ay bazlı talep (0=Ocak … 11=Aralık).
// Hafriyat: inşaat sezonu (ilkbahar–sonbahar) zirve. Silobas: hasat (yaz sonu–güz).
const SEASON = {
  hafriyat: [0.95, 0.95, 0.98, 1.02, 1.04, 1.05, 1.05, 1.04, 1.03, 1.01, 0.97, 0.94],
  silobas: [0.97, 0.97, 0.98, 1.00, 1.01, 1.02, 1.03, 1.05, 1.05, 1.03, 1.00, 0.98],
};
export function seasonFactor(cat, month = new Date().getMonth()) {
  const arr = SEASON[cat];
  return arr ? arr[((month % 12) + 12) % 12] : 1;
}

// Backhaul (dönüş yükü) çarpanı — varış ilinde alınabilecek yük varsa
// kamyon boş dönmez → maliyet düşer. Fiyatı boş-dönüş ağına bağlar.
export function backhaulFactor({ cat, toIl }, { listings = [] } = {}) {
  if (!toIl) return { factor: 1, returns: 0 };
  let returns = 0;
  listings.forEach((l) => {
    if (l.status === "kapali" || l.type !== "is") return;
    if (cat && l.cat !== cat) return;
    if (ilDistance(toIl, routeOf(l).fromIl) <= 1) returns++;   // varış yakınında yük
  });
  const factor = returns >= 3 ? 0.92 : returns >= 1 ? 0.95 : 1;
  return { factor, returns };
}

// İki [lat,lng] arası kuş uçuşu km (Haversine) — gerçek mesafe (anahtarsız).
export function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371, toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b[0] - a[0]), dLng = toR(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

// İlanın km'sini çöz: gerçek harita km'si > il yakınlık bandı.
function kmOf(l) {
  if (l.km != null && l.km > 0) return l.km;
  const r = routeOf(l);
  return KM_BAND[ilDistance(r.fromIl, r.toIl)] ?? 220;
}

// İlanın taşınan ton miktarını çöz (ton/m³ direkt; sefer/kamyon → kapasite × adet).
function tonsOf(l) {
  const amt = Number(l.amount) || 0;
  if (!amt) return null;
  if (l.unit === "ton" || l.unit === "m³") return amt;
  const cap = capacityTonOf(l.capacity) || capacityTonOf(l.vehicle) || 20;
  return amt * cap; // sefer/kamyon/yük/TIR → toplam ton
}

// ── Geçmişten ₺/ton-km örnekleri çıkar ──────────────────────────────
// Kabul edilmiş teklifler (gerçek işlem) + sabit fiyatlı iş ilanları (talep fiyatı).
// Her iş ilanından bir ₺/ton-km örneği çıkar (kabul teklif > sabit fiyat).
// Hem fiyat tahmini hem Piyasa Nabzı bu havuzu kullanır.
export function collectSamples({ listings = [], offers = [] }) {
  const acceptedByListing = {};
  offers.forEach((o) => {
    if (o.status === "kabul" && Number(o.price) > 0) {
      (acceptedByListing[o.listingId] ||= []).push({ price: Number(o.price), date: o.createdAt || null });
    }
  });

  const samples = [];
  listings.forEach((l) => {
    if (l.type !== "is") return;
    const lkm = kmOf(l);
    if (!lkm) return;
    // Gerçekleşen (tamamlanmış) iş: teslim kanıtındaki GERÇEK tonajı kullan → en doğru oran.
    const settled = l.status === "kapali" || l.phase === "teslim";
    const actualTons = settled && Number(l.deliveryProof?.tonnage) > 0 ? Number(l.deliveryProof.tonnage) : null;
    const tons = actualTons || tonsOf(l);
    if (!tons) return;
    const tonkm = tons * lkm;
    if (tonkm <= 0) return;
    const r = routeOf(l);
    const acc = acceptedByListing[l.id];
    if (acc && acc.length) {
      // kabul edilen teklif = işin toplam bedeli (gerçek işlem sinyali)
      const lastDate = acc.map((a) => a.date).filter(Boolean).sort().pop() || null;
      samples.push({ rate: median(acc.map((a) => a.price)) / tonkm, cat: l.cat, material: l.material || "", fromIl: r.fromIl, toIl: r.toIl, km: lkm, accepted: true, settled, date: lastDate });
    } else if (l.priceType === "sabit" && Number(l.price) > 0) {
      samples.push({ rate: Number(l.price) / tonkm, cat: l.cat, material: l.material || "", fromIl: r.fromIl, toIl: r.toIl, km: lkm, accepted: false, settled: false, date: null });
    }
  });
  return samples;
}

// Aynı kategori + benzer mesafe bandındaki örnekler — AĞIRLIKLI.
// Ağırlık: kabul edilmiş (×2) · aynı malzeme (×1.6) · aynı güzergah (×1.6) ·
// taze (<30g ×1.4, <90g ×1.15). Böylece "en alakalı" örnekler tahmini çeker.
function learnRates({ cat, km, material, fromIl, toIl }, history) {
  const matF = fold(material);
  const now = Date.now();
  const weighted = [];
  const rawRates = [];
  const laneRates = [];                 // tam bu güzergahın (fromIl→toIl) oranları
  let accepted = 0, laneAccepted = 0, settledCount = 0, laneSettled = 0;
  collectSamples(history).forEach((s) => {
    if (s.cat !== cat) return;
    if (km && (s.km < km * 0.4 || s.km > km * 2.5)) return;   // yerel ↔ şehirlerarası karışmasın
    let w = 1;
    if (s.accepted) { w *= 2; accepted++; }
    if (s.settled) { w *= 2.5; settledCount++; }              // gerçekleşen sefer = en güçlü sinyal
    if (matF && fold(s.material) === matF) w *= 1.6;
    const sameLane = fromIl && toIl && s.fromIl === fromIl && s.toIl === toIl;
    if (sameLane) { w *= 1.6; laneRates.push(s.rate); if (s.accepted) laneAccepted++; if (s.settled) laneSettled++; }
    if (s.date) {
      const days = (now - new Date(s.date)) / 86400000;
      if (days < 30) w *= 1.4; else if (days < 90) w *= 1.15;
    }
    weighted.push({ rate: s.rate, w });
    rawRates.push(s.rate);
  });
  return { weighted, rawRates, laneRates, accepted, laneAccepted, settledCount, laneSettled, laneSamples: laneRates.length, n: weighted.length };
}

// Dizinin q-yüzdelik değeri (lineer interpolasyon).
const percentile = (arr, q) => {
  if (!arr.length) return null;
  const s = [...arr].sort((a, b) => a - b);
  const idx = (s.length - 1) * q, lo = Math.floor(idx), hi = Math.ceil(idx);
  return s[lo] + (s[hi] - s[lo]) * (idx - lo);
};

// ── Arz/talep dengesi: güzergah başında boş araç (arz) vs iş (talep) ──────
// Fiyat baskısı yönü + çarpan. Yakın il (komşuluk ≤1) referans alınır.
export function supplyDemand({ cat, fromIl }, { listings = [] } = {}) {
  if (!fromIl) return null;
  let demand = 0, supply = 0;
  listings.forEach((l) => {
    if (l.status === "kapali") return;
    if (cat && l.cat !== cat) return;
    if (l.type !== "is" && l.type !== "arac") return;
    const near = ilDistance(fromIl, routeOf(l).fromIl) <= 1;
    if (!near) return;
    if (l.type === "is") demand++; else supply++;
  });
  const ratio = demand / Math.max(1, supply);
  let factor = 1, label = "Dengeli", tone = "ok";
  if (supply + demand >= 2) {
    if (ratio >= 1.6) { factor = 1.07; label = "Talep yüksek"; tone = "up"; }
    else if (ratio <= 0.6) { factor = 0.94; label = "Araç bol"; tone = "down"; }
  } else {
    label = "Veri az";
  }
  return { supply, demand, ratio, factor, label, tone };
}

// ── İl bazlı arz/talep yoğunluğu (likidite ısı haritası) ──────────────
// Açık iş (talep) vs açık araç (arz) sayısı. tone: "up"=yük bol (nakliyeci
// fırsatı) · "down"=araç bol (rekabet) · "ok"=dengeli.
export function densityByIl({ listings = [] } = {}, limit = 8) {
  const map = {};
  listings.forEach((l) => {
    if (l.status === "kapali") return;
    if (l.type !== "is" && l.type !== "arac") return;
    if (!l.il) return;
    const e = map[l.il] || { il: l.il, demand: 0, supply: 0 };
    if (l.type === "is") e.demand++; else e.supply++;
    map[l.il] = e;
  });
  return Object.values(map).map((e) => {
    const total = e.demand + e.supply;
    const ratio = e.demand / Math.max(1, e.supply);
    let tone = "ok", label = "Dengeli";
    if (total >= 2) {
      if (ratio >= 1.6) { tone = "up"; label = "Yük bol"; }
      else if (ratio <= 0.6) { tone = "down"; label = "Araç bol"; }
    } else { label = "Az veri"; }
    return { ...e, total, ratio, tone, label };
  }).sort((a, b) => b.total - a.total).slice(0, limit);
}

// ── Piyasa Nabzı: güzergah/malzeme/kategori bazlı ₺/ton-km referansı ──
export function marketPulse(history) {
  const all = collectSamples(history);
  const accepted = all.filter((s) => s.accepted).length;
  const settled = all.filter((s) => s.settled).length;

  const byCat = {};
  ["hafriyat", "silobas"].forEach((c) => {
    const rs = all.filter((s) => s.cat === c);
    const m = median(rs.map((s) => s.rate));
    byCat[c] = m ? { rate: m, n: rs.length, accepted: rs.filter((s) => s.accepted).length, settled: rs.filter((s) => s.settled).length, min: m * 0.85, max: m * 1.15 } : null;
  });

  // güzergah hatları (fromIl → toIl)
  const laneMap = {};
  all.forEach((s) => { if (s.fromIl && s.toIl) (laneMap[`${s.fromIl}→${s.toIl}`] ||= []).push(s); });
  const lanes = Object.entries(laneMap).map(([k, arr]) => {
    const rate = median(arr.map((a) => a.rate));
    const km = Math.round(median(arr.map((a) => a.km)));
    const [from, to] = k.split("→");
    return { from, to, rate, km, n: arr.length, accepted: arr.filter((a) => a.accepted).length, settled: arr.filter((a) => a.settled).length, sampleTrip: round50(rate * 20 * km) };
  }).sort((a, b) => b.settled - a.settled || b.n - a.n || b.rate - a.rate).slice(0, 6);

  // malzeme bazlı ortalama
  const matMap = {};
  all.forEach((s) => { if (s.material) (matMap[s.material] ||= []).push(s.rate); });
  const materials = Object.entries(matMap)
    .map(([material, rs]) => ({ material, rate: median(rs), n: rs.length }))
    .sort((a, b) => b.n - a.n || b.rate - a.rate).slice(0, 6);

  // trend: tarihli kabul örneklerini eski/yeni yarıya bölüp medyan ₺/ton-km kıyası
  const dated = all.filter((s) => s.accepted && s.date).sort((a, b) => new Date(a.date) - new Date(b.date));
  let trend = null;
  if (dated.length >= 4) {
    const mid = Math.floor(dated.length / 2);
    const older = median(dated.slice(0, mid).map((s) => s.rate));
    const recent = median(dated.slice(mid).map((s) => s.rate));
    if (older && recent) {
      const pct = Math.round(((recent - older) / older) * 100);
      trend = { pct, dir: pct > 1 ? "up" : pct < -1 ? "down" : "flat" };
    }
  }

  return { samples: all.length, accepted, settled, byCat, lanes, materials, trend };
}

const CONF_LEVELS = ["tahmin", "düşük", "orta", "yüksek"];
const CONF = (n) => (n >= 6 ? "yüksek" : n >= 3 ? "orta" : n >= 1 ? "düşük" : "tahmin");
const bumpConf = (c) => CONF_LEVELS[Math.min(CONF_LEVELS.length - 1, CONF_LEVELS.indexOf(c) + 1)];

export function estimatePrice({ cat, amount, unit, fromIl, toIl, material, capacity, vehicle, dateText, recurring, kmOverride, history, config, month }) {
  if (!amount || (!fromIl && !kmOverride)) return null;
  const d = ilDistance(fromIl, toIl || fromIl);
  const km = kmOverride != null ? kmOverride : (KM_BAND[d] ?? 220);
  const catRate = CAT_RATE[cat] || 1;
  const cap = capacityTonOf(capacity) || capacityTonOf(vehicle) || 20;

  let trips = 1;
  if (unit === "ton" || unit === "m³") trips = Math.max(1, Math.ceil(amount / cap));
  else if (["sefer", "kamyon", "yük", "TIR"].includes(unit)) trips = Math.max(1, amount);

  const tons = (unit === "ton" || unit === "m³") ? amount : trips * cap;

  // ── çarpanlar: malzeme · araç · hacim · aciliyet · backhaul ──
  const matF = materialFactor(material);
  const vehF = vehicleFactor(vehicle);
  const volF = volumeFactor(tons);
  const urgF = urgencyFactor({ dateText, recurring });
  const bh = history ? backhaulFactor({ cat, toIl: toIl || fromIl }, history) : { factor: 1, returns: 0 };
  const bhF = bh.factor;
  const fuelIndex = (config && Number(config.fuelIndex)) || 1;
  const seasonF = seasonFactor(cat, month);

  const baseTrip = BASE;
  const distBase = km * PER_KM * catRate;          // nötr yakıttaki mesafe maliyeti
  const distTrip = distBase * fuelIndex;           // yakıt endeksli
  const unit0 = baseTrip + distTrip;               // çarpansız (malzeme vb. öncesi) sefer maliyeti

  // ── sıralı döküm: her çarpanın ₺ katkısı (toplam = heuristic) ──
  const breakdown = [
    { key: "taban", label: "Yükleme / operasyon", value: round50(baseTrip * trips) },
    { key: "mesafe", label: `Mesafe (~${km} km${trips > 1 ? ` × ${trips} sefer` : ""})`, value: round50(distBase * trips) },
  ];
  if (fuelIndex !== 1) breakdown.push({ key: "yakit", label: `Yakıt endeksi (${fuelIndex > 1 ? "+" : ""}${Math.round((fuelIndex - 1) * 100)}%)`, value: round50(distBase * (fuelIndex - 1) * trips) });
  let run = unit0;
  const factorLine = (key, label, f) => {
    if (f === 1) return;
    const next = run * f;
    breakdown.push({ key, label: `${label} (${f > 1 ? "+" : ""}${Math.round((f - 1) * 100)}%)`, value: round50((next - run) * trips) });
    run = next;
  };
  factorLine("malzeme", "Malzeme", matF);
  factorLine("arac", "Araç tipi", vehF);
  factorLine("hacim", tons >= 150 ? "Hacim indirimi" : "Küçük parti", volF);
  factorLine("aciliyet", urgF > 1 ? "Acil iş" : "Düzenli/esnek", urgF);
  factorLine("backhaul", bhF !== 1 ? `Dönüş yükü (${bh.returns})` : "Dönüş yükü", bhF);
  factorLine("sezon", seasonF >= 1 ? "Sezon (yoğun)" : "Sezon (sakin)", seasonF);

  const perTripRaw = run;                           // unit0 × tüm çarpanlar
  const perTrip = round50(perTripRaw);
  const heuristic = perTripRaw * trips;

  // ── geçmişten ağırlıklı öğren + harmanla ──
  let blended = heuristic, sampleSize = 0, accepted = 0, rawRates = [], laneRates = [], laneSamples = 0, laneAccepted = 0, settledSamples = 0, laneSettled = 0;
  if (history) {
    const lr = learnRates({ cat, km, material, fromIl, toIl }, history);
    const r = weightedMedian(lr.weighted);
    if (r && tons && km) {
      const dataMid = r * tons * km;
      // Gerçekleşen sefer verisi varsa veriye güveni biraz daha artır (tavan 0.8).
      const w = Math.min(lr.settledCount > 0 ? 0.8 : 0.7, lr.n / 10);
      blended = w * dataMid + (1 - w) * heuristic;
      sampleSize = lr.n; accepted = lr.accepted; rawRates = lr.rawRates;
      laneRates = lr.laneRates; laneSamples = lr.laneSamples; laneAccepted = lr.laneAccepted;
      settledSamples = lr.settledCount; laneSettled = lr.laneSettled;
    }
  }
  if (sampleSize > 0) breakdown.push({ key: "veri", label: `Geçmiş işler (${sampleSize})`, value: round50(blended - heuristic) });

  // ── arz/talep çarpanı ──
  const sd = history ? supplyDemand({ cat, fromIl }, history) : null;
  const sdFactor = sd ? sd.factor : 1;
  const mid = round50(blended * sdFactor);
  if (sdFactor !== 1) breakdown.push({ key: "arztalep", label: sd.label + ` (${sdFactor > 1 ? "+" : ""}${Math.round((sdFactor - 1) * 100)}%)`, value: round50(mid - blended) });

  // yuvarlama artığını mesafe satırına yedir → döküm tam olarak mid'e toplanır
  const resid = mid - breakdown.reduce((t, b) => t + b.value, 0);
  if (resid) breakdown[1].value += resid;

  // ── güzergah kalibrasyonu: bu hat yeterince örneklendiyse güven artar ──
  const laneCalibrated = laneSamples >= 3;
  let confidence = CONF(sampleSize);
  if (laneCalibrated) confidence = bumpConf(confidence);
  // Bu hatta gerçekleşen (tamamlanmış) sefer varsa güven bir kademe daha artar.
  if (laneSettled >= 2) confidence = bumpConf(confidence);

  // ── aralık: güzergahın kendi dağılımı (varsa) > genel dağılım > sabit ±% ──
  const bandRates = laneRates.length >= 4 ? laneRates : rawRates;
  let lowR, highR;
  const spread = (laneCalibrated ? 0.06 : 0) + (sampleSize >= 6 ? 0.08 : sampleSize >= 3 ? 0.11 : 0.15) * (laneCalibrated ? 0.6 : 1);
  if (bandRates.length >= 4) {
    const p25 = percentile(bandRates, 0.25), p50 = percentile(bandRates, 0.5), p75 = percentile(bandRates, 0.75);
    if (p50 > 0) { lowR = clamp(p25 / p50, 0.70, 0.98); highR = clamp(p75 / p50, 1.02, 1.35); }
    else { lowR = 1 - spread; highR = 1 + spread; }
  } else { lowR = 1 - spread; highR = 1 + spread; }

  return {
    perTrip, trips, total: round50(heuristic), km,
    mid,
    min: round50(mid * lowR),
    max: round50(mid * highR),
    real: kmOverride != null,
    sampleSize, accepted, settledSamples,
    dataDriven: sampleSize > 0,
    bandFromData: bandRates.length >= 4,
    laneSamples, laneAccepted, laneSettled, laneCalibrated,
    confidence,
    distLabel: kmOverride != null ? "harita mesafesi" : ["aynı il", "yakın il", "bölge içi", "uzak"][Math.min(d, 3)],
    materialFactor: matF, vehicleFactor: vehF, volumeFactor: volF, urgencyFactor: urgF, backhaul: bh,
    seasonFactor: seasonF, fuelIndex,
    supplyDemand: sd, breakdown,
  };
}

// ── Bir teklif fiyatının piyasaya göre konumu (nakliyeci için canlı sinyal) ──
// tone: "win" rekabetçi · "ok" piyasa seviyesi · "high" piyasa üstü · "low" maliyet altı
export function priceSignal(price, est) {
  const p = Number(price);
  if (!est || !p || p <= 0) return null;
  const { mid, min } = est;
  if (p < min * 0.92) return { tone: "low", label: "Maliyetin altı olabilir", hint: "Bu fiyat zarar ettirebilir." };
  if (p <= mid * 0.95) return { tone: "win", label: "Rekabetçi teklif", hint: "Kabul edilme şansı yüksek." };
  if (p <= mid * 1.1) return { tone: "ok", label: "Piyasa seviyesinde", hint: "Dengeli bir teklif." };
  return { tone: "high", label: "Piyasa üstü", hint: "Daha düşük teklifler öne geçebilir." };
}

export const fmtTL = (n) => "₺" + Math.round(n).toLocaleString("tr-TR");
