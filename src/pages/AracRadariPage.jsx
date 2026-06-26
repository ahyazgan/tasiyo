// YÜKLET — YAKINDAKİ ARAÇLAR (müteahhit tarafı canlı radar)
// Uber'in "yakındaki sürücüler" dinamiğinin yük veren karşılığı: çevrimiçi
// nakliyecileri haritada + mesafe/ETA sıralı listede canlı gösterir.
// Veri kaynağı: presence kanalı (utils/presence) — sürücüler Yük Radarı'nda
// "Çevrimiçi Ol" deyince buraya düşer. Şimdi localStorage, sonra Supabase Realtime.

import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentPosition } from "../native/geo";
import { subscribeOnline } from "../utils/presence";
import { sendPing, getPingsFromUser, subscribeDispatch } from "../utils/dispatch";
import { IL_COORDS } from "../data/ilCoords";
import { getTheme } from "../data/brandThemes";
import { useToast } from "../components/Toast";

const FleetMap = lazy(() => import("../components/FleetMap"));

// TR karakter duyarsız il eşleştirme.
const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();
const IL_KEYS = Object.keys(IL_COORDS);
const coordOf = (il) => { const k = IL_KEYS.find((x) => fold(x) === fold(il)); return k ? IL_COORDS[k] : null; };

const R = 6371, rad = (d) => (d * Math.PI) / 180;
function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const dLat = rad(b[0] - a[0]), dLng = rad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const etaMin = (km) => Math.max(1, Math.round((km / 45) * 60)); // ~45 km/sa ort. kamyon hızı

const CAT_FILTERS = [
  { key: "", label: "Tümü" },
  { key: "hafriyat", label: "Damperli (hafriyat)" },
  { key: "silobas", label: "Silobas (döküme)" },
];

export default function AracRadariPage({ user, listings = [], onRequireAuth }) {
  const navigate = useNavigate();
  const toast = useToast();
  const C = getTheme("saha");
  const MONO = C.mono, HEAD = C.head;

  const [city, setCity] = useState(user?.il && coordOf(user.il) ? user.il : "İstanbul");
  const [cat, setCat] = useState("");
  const [radius, setRadius] = useState(150);
  const [gps, setGps] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [myPings, setMyPings] = useState([]);
  const [callDriver, setCallDriver] = useState(null); // iş seçim sheet'i için

  // Çevrimiçi sürücülere canlı abone ol (kendini hariç tut).
  useEffect(() => subscribeOnline(setDrivers, user?.id), [user?.id]);
  // Gönderdiğim çağrıların durumuna abone ol (çalıyor/kabul/ret).
  useEffect(() => subscribeDispatch(() => setMyPings(getPingsFromUser(user?.id))), [user?.id]);

  // Sürücü id -> bana ait en güncel çağrı durumu.
  const pingByDriver = useMemo(() => {
    const m = new Map();
    for (const p of [...myPings].sort((a, b) => a.createdAt - b.createdAt)) m.set(String(p.toId), p);
    return m;
  }, [myPings]);

  // Müteahhitin çağrı gönderebileceği aktif iş ilanları.
  const myJobs = useMemo(
    () => listings.filter((l) => l.type === "is" && l.status === "aktif" && String(l.ownerId) === String(user?.id)),
    [listings, user?.id]
  );

  const base = gps || coordOf(city);

  // Çağrı gönder: iş + sürücü → ping. Tek iş varsa direkt, çoğunda sheet açılır.
  const callWithJob = (driver, job) => {
    sendPing({
      listingId: job.id, jobTitle: job.title, jobCat: job.cat,
      fromId: user.id, fromName: user.name || "Yük veren", toId: driver.id, toName: driver.name,
      price: job.priceType === "sabit" ? job.price : null, priceType: job.priceType,
      originIl: job.il, dist: Number.isFinite(driver.dist) ? driver.dist : null,
    });
    setCallDriver(null);
    toast(`${driver.name || "Sürücü"} çağrıldı — yanıtı bekleniyor.`, "success");
  };
  const onCall = (driver) => {
    if (!user) { onRequireAuth?.(); return; }
    if (myJobs.length === 0) { toast("Önce bir iş ilanı aç, sonra çağır.", "info"); navigate("/ilan-ver"); return; }
    if (myJobs.length === 1) { callWithJob(driver, myJobs[0]); return; }
    setCallDriver(driver);
  };

  const findMe = async () => {
    const p = await getCurrentPosition();
    if (!p) { toast("Konum alınamadı — izin verildi mi?", "error"); return; }
    setGps([p.lat, p.lng]);
    toast("Konumun bulundu — çevrendeki araçlar listeleniyor.", "success");
  };

  const ranked = useMemo(() => {
    return drivers
      .filter((d) => Number.isFinite(d.lat) && Number.isFinite(d.lng))
      .map((d) => ({ ...d, dist: distanceKm(base, [d.lat, d.lng]) }))
      .filter((d) => (!cat || d.cat === cat) && d.dist <= radius)
      .sort((a, b) => a.dist - b.dist);
  }, [drivers, base, cat, radius]);

  const mapItems = ranked.map((d) => ({
    id: d.id,
    label: `${Math.round(d.dist)}KM`,
    vehicle: { lat: d.lat, lng: d.lng, heading: d.heading || 0 },
    live: true,
  }));

  const card = { background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6 };
  const selStyle = { fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.text, padding: "7px 8px", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 5, width: "100%", appearance: "none", cursor: "pointer" };

  return (
    <div style={{ minHeight: "100dvh", background: C.stone, fontFamily: HEAD }}>
      {/* Başlık */}
      <header style={{ padding: "14px 16px 10px", borderBottom: `2px solid ${C.ink}`, background: C.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 18, textTransform: "uppercase", letterSpacing: "-.02em" }}>Yakındaki Araçlar</span>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, padding: "2px 7px", background: C.green, color: "#fff", border: `2px solid ${C.ink}`, borderRadius: 4 }}>CANLI</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>{ranked.length} araç çevrimiçi</span>
        </div>
        <p style={{ fontFamily: MONO, fontSize: 10.5, color: C.sub, marginTop: 5, lineHeight: 1.5 }}>
          Çevrendeki çevrimiçi nakliyecileri canlı gör. Yakınındaki aracı bul, iş ilanını aç → en hızlı sana ulaşan kapsın.
        </p>
      </header>

      {/* Filtreler */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end", padding: "10px 14px", background: C.stone, borderBottom: `2px solid ${C.ink}` }}>
        <label style={{ display: "flex", flexDirection: "column", gap: 3, flex: "1 1 130px", minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: ".06em", color: C.muted, textTransform: "uppercase" }}>{gps ? "Konumum (GPS)" : "Konumum"}</span>
          <select style={{ ...selStyle, opacity: gps ? 0.5 : 1 }} value={city} disabled={Boolean(gps)} onChange={(e) => setCity(e.target.value)}>
            {IL_KEYS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 3, flex: "1 1 130px", minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: ".06em", color: C.muted, textTransform: "uppercase" }}>Araç tipi</span>
          <select style={selStyle} value={cat} onChange={(e) => setCat(e.target.value)}>
            {CAT_FILTERS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </label>
        <label style={{ display: "flex", flexDirection: "column", gap: 3, flex: "1 1 130px", minWidth: 0 }}>
          <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: ".06em", color: C.muted, textTransform: "uppercase" }}>Yakınlık · {radius} km</span>
          <input type="range" min="50" max="600" step="25" value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: "100%", accentColor: C.accent, height: 30 }} />
        </label>
        <button type="button" onClick={gps ? () => setGps(null) : findMe} style={{ fontFamily: HEAD, fontSize: 12, fontWeight: 800, textTransform: "uppercase", padding: "9px 12px", borderRadius: 5, cursor: "pointer", background: gps ? C.green : C.ink, color: gps ? "#fff" : C.yellow, border: `2px solid ${C.ink}`, whiteSpace: "nowrap" }}>
          {gps ? "GPS ✓" : "Konumumu Bul"}
        </button>
      </div>

      {/* Harita */}
      <div style={{ padding: "12px 14px 0" }}>
        <Suspense fallback={<div style={{ height: 300, ...card, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 12, color: C.sub }}>Harita yükleniyor…</div>}>
          <FleetMap items={mapItems} />
        </Suspense>
      </div>

      {/* Liste */}
      <div style={{ padding: "12px 14px 96px" }}>
        {ranked.length === 0 ? (
          <div style={{ padding: "28px 16px", textAlign: "center", fontFamily: MONO, fontSize: 12, color: C.sub, background: C.card, border: `2px dashed ${C.border}`, borderRadius: 6 }}>
            Bu çevrede şu an çevrimiçi araç yok.<br />Yakınlığı artır ya da daha sonra tekrar bak.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ranked.map((d) => {
              const p = pingByDriver.get(String(d.id));
              const st = p?.status;
              return (
              <div key={d.id} style={{ padding: "10px 12px", ...card, boxShadow: "3px 3px 0 rgba(10,10,10,.12)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: "50%", background: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name || "Nakliyeci"}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.sub, marginTop: 2 }}>
                      ★ {(d.rating || 0).toFixed(1)} · {(d.cat || "araç").toLocaleUpperCase("tr-TR")}{d.capacity ? ` · ${d.capacity}` : ""}{d.target ? ` · ${d.target} yönü` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontFamily: HEAD, fontSize: 17, fontWeight: 900, color: C.ink, lineHeight: 1 }}>{Math.round(d.dist)}<span style={{ fontSize: 10, fontWeight: 700 }}> km</span></div>
                    <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.green }}>~{etaMin(d.dist)} dk</div>
                  </div>
                </div>
                {/* Çağrı aksiyonu / durumu */}
                <div style={{ marginTop: 9 }}>
                  {st === "accepted" ? (
                    <button type="button" onClick={() => navigate("/sevkiyat")} style={{ width: "100%", fontFamily: HEAD, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", padding: "9px", borderRadius: 6, cursor: "pointer", background: C.green, color: "#fff", border: `2px solid ${C.ink}` }}>
                      ✓ Kabul etti — sevkiyata git
                    </button>
                  ) : st === "ringing" ? (
                    <div style={{ width: "100%", textAlign: "center", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub, padding: "9px", borderRadius: 6, border: `2px solid ${C.border}`, background: C.stone }}>
                      ⏳ Çağrı gönderildi · yanıt bekleniyor…
                    </div>
                  ) : (
                    <button type="button" onClick={() => onCall(d)} style={{ width: "100%", fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".02em", padding: "9px", borderRadius: 6, cursor: "pointer", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, boxShadow: "2px 2px 0 rgba(10,10,10,.18)" }}>
                      {st === "rejected" ? "Reddetti — tekrar çağır" : st === "expired" ? "Yanıt yok — tekrar çağır" : "Çağır →"}
                    </button>
                  )}
                </div>
              </div>
              );
            })}
            <button type="button" onClick={() => navigate("/ilan-ver")} style={{ marginTop: 4, fontFamily: HEAD, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".02em", padding: "13px", borderRadius: 6, cursor: "pointer", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, boxShadow: "3px 3px 0 rgba(10,10,10,.2)" }}>
              İş İlanı Aç → araçlar teklif versin
            </button>
          </div>
        )}
      </div>

      {/* İş seçim sheet'i — birden çok aktif iş varsa hangisine çağrılacağını seç */}
      {callDriver && (
        <div role="dialog" aria-label="İş seç" onClick={() => setCallDriver(null)} style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(10,10,10,.6)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 14 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 -6px 0 rgba(10,10,10,.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: C.ink }}>
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.yellow }}>{(callDriver.name || "SÜRÜCÜ").toLocaleUpperCase("tr-TR")} İÇİN İŞ SEÇ</span>
              <button type="button" onClick={() => setCallDriver(null)} aria-label="Kapat" style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: "10px 12px 14px", display: "flex", flexDirection: "column", gap: 8, maxHeight: "50vh", overflowY: "auto" }}>
              {myJobs.map((j) => (
                <button key={j.id} type="button" onClick={() => callWithJob(callDriver, j)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 6, cursor: "pointer", background: C.stone, border: `2px solid ${C.ink}` }}>
                  <div style={{ fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{j.title}</div>
                  <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.sub, marginTop: 2 }}>
                    {(j.il || "—").toLocaleUpperCase("tr-TR")} · {(j.cat || "").toLocaleUpperCase("tr-TR")} · {j.priceType === "sabit" && j.price ? `₺${Number(j.price).toLocaleString("tr-TR")}` : "TEKLİFE AÇIK"}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
