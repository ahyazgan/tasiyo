// YÜKLET — KAMYONCU YÜK RADARI (Uber mantığı, gerçek ilanlara bağlı)
// Planın "kalbi": Türkiye haritası + iş ilanı pinleri + yön/yakınlık filtresi.
// Kamyoncu konumunu + gitmek istediği yönü seçer, koridorundaki yükü "kapar".
//
// Bu sayfa CANLI veriyi kullanır: App.jsx'ten gelen `listings` (iş ilanları) +
// `offers`. "Yükü Al" → onAddOffer ile bir CLAIM kaydı (kind:"claim") oluşturur;
// yük veren bunu mevcut teklif ekranından onaylar (status:"kabul") → sevkiyat
// akışı (DispatchPage/Takip) değişmeden çalışır. Teklif sistemine dokunulmaz.

import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentPosition } from "../native/geo";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { IL_COORDS } from "../data/ilCoords";
import { useToast } from "../components/Toast";
import { hapticSuccess } from "../native/haptics";

// ── SAHA token'ları ──
const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C",
  card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0",
  sub: "#5A5852", muted: "#9A968D", blue: "#1D5FA8",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'Archivo', sans-serif";

// TR karakter duyarsız il eşleştirme (listing.il "İstanbul" vs IL_COORDS anahtarı).
const TR = { "İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ç": "c", "ç": "c", "Ö": "o", "ö": "o", "Ü": "u", "ü": "u" };
const fold = (s = "") => String(s).split("").map((c) => TR[c] || c).join("").toLowerCase().trim();
const IL_KEYS = Object.keys(IL_COORDS);
function coordOf(il) {
  if (!il) return null;
  const key = IL_KEYS.find((k) => fold(k) === fold(il));
  return key ? IL_COORDS[key] : null;
}
// GPS noktasına en yakın il (etiket + yön filtresi referansı için).
function nearestCity(pos) {
  if (!pos) return null;
  let best = null, bestD = Infinity;
  for (const il of IL_KEYS) {
    const d = distanceKm(pos, IL_COORDS[il]);
    if (d < bestD) { bestD = d; best = il; }
  }
  return best;
}

// Araç tipi seçenekleri (filtre çubuğu). cat ile gevşek eşleşir.
const VEHICLE_FILTERS = [
  { key: "", label: "Hepsi" },
  { key: "hafriyat", label: "Damperli (hafriyat)" },
  { key: "silobas", label: "Silobas (döküme)" },
];

// Geçerli [lat, lng] çifti mi? (Türkiye sınırları içinde kaba kontrol)
function isLatLng(p) {
  return Array.isArray(p) && p.length === 2 &&
    Number.isFinite(p[0]) && Number.isFinite(p[1]) &&
    p[0] >= 35 && p[0] <= 43 && p[1] >= 25 && p[1] <= 45;
}

// ── Coğrafya yardımcıları (PostGIS'in JS karşılığı — demo/MVP için yeterli) ──
const R = 6371; // km
const rad = (d) => (d * Math.PI) / 180;
function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const dLat = rad(b[0] - a[0]);
  const dLng = rad(b[1] - a[1]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
// Yük, "konumum → hedef ilim" koridoruna doğru mu gidiyor? (vektör kosinüsü)
function towardTarget(myPos, targetPos, origin, dest, threshold = 0.4) {
  if (!myPos || !targetPos || !dest) return true; // hedef yoksa yön filtresi yok
  const want = [targetPos[0] - myPos[0], targetPos[1] - myPos[1]];
  const go = [dest[0] - origin[0], dest[1] - origin[1]];
  const wl = Math.hypot(want[0], want[1]);
  const gl = Math.hypot(go[0], go[1]);
  if (wl === 0 || gl === 0) return true;
  return (want[0] * go[0] + want[1] * go[1]) / (wl * gl) >= threshold;
}

const ilanNo = (id) => "HMT-" + String(id).padStart(4, "0");

// ── Yük pini (divIcon) ──
function loadIcon(l, active) {
  const fixed = l.priceType === "sabit";
  const bg = active ? C.ink : fixed ? C.yellow : C.card;
  const fg = active ? C.yellow : C.ink;
  const priceTxt = fixed && l.price ? `₺${(l.price / 1000).toFixed(0)}K` : "TEKLİF";
  const html = `
    <div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
      <div style="display:flex;align-items:center;gap:5px;font-family:${MONO};font-size:10px;font-weight:700;letter-spacing:.03em;white-space:nowrap;padding:3px 8px;background:${bg};color:${fg};border:2px solid ${C.ink};border-radius:5px;box-shadow:2px 2px 0 rgba(10,10,10,.25);">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${fg}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>
        ${priceTxt}
      </div>
      <div style="width:0;height:0;margin-top:-1px;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${C.ink};"></div>
    </div>`;
  return L.divIcon({ html, className: "saha-marker", iconSize: [0, 0], iconAnchor: [0, 26] });
}
function myPosIcon() {
  const html = `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);"><div style="width:16px;height:16px;border-radius:50%;background:${C.blue};border:3px solid #fff;box-shadow:0 0 0 2px ${C.ink},2px 2px 6px rgba(0,0,0,.4);"></div></div>`;
  return L.divIcon({ html, className: "saha-marker", iconSize: [0, 0], iconAnchor: [0, 8] });
}

// Konum değişince haritayı oraya uçur (GPS bulununca / şehir seçilince).
function Recenter({ pos, zoom, active }) {
  const map = useMap();
  const prev = useRef("");
  useEffect(() => {
    if (!pos) return;
    const key = pos.join(",");
    if (key === prev.current) return;
    prev.current = key;
    map.flyTo(pos, active ? zoom : map.getZoom(), { duration: 0.8 });
  }, [pos, zoom, active, map]);
  return null;
}

function ZoomControls() {
  const map = useMap();
  const btn = { width: 36, height: 36, background: C.card, border: `2px solid ${C.ink}`, color: C.ink, fontFamily: HEAD, fontSize: 20, fontWeight: 900, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" };
  return (
    <div style={{ position: "absolute", top: 12, right: 12, zIndex: 500, display: "flex", flexDirection: "column", borderRadius: 6, overflow: "hidden", boxShadow: "2px 2px 0 rgba(10,10,10,.2)" }}>
      <button type="button" aria-label="Yakınlaştır" onClick={() => map.zoomIn()} style={{ ...btn, borderBottom: "none" }}>+</button>
      <button type="button" aria-label="Uzaklaştır" onClick={() => map.zoomOut()} style={btn}>−</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0, flex: "1 1 130px" }}>
      <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, letterSpacing: ".06em", color: C.muted, textTransform: "uppercase" }}>{label}</span>
      {children}
    </label>
  );
}
const selStyle = { fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink, padding: "7px 8px", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 5, width: "100%", appearance: "none", cursor: "pointer" };

export default function TentaliDemo({ listings = [], offers = [], user, onClaim, onRequireAuth }) {
  const navigate = useNavigate();
  const toast = useToast();

  const [myCity, setMyCity] = useState("İstanbul");
  const [targetCity, setTargetCity] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [radius, setRadius] = useState(200);
  const [selected, setSelected] = useState(null);

  // GPS konumu: aktifse 'Konumum' şehir seçiminin yerine geçer (gerçek lat/lng).
  const [gps, setGps] = useState(null);            // [lat,lng] | null
  const [gpsStatus, setGpsStatus] = useState("idle"); // idle | loading | ok | denied

  // Çözülen konum: GPS varsa o, yoksa seçili il merkezi.
  const myPos = gps || coordOf(myCity);
  const targetPos = coordOf(targetCity);
  const gpsCityLabel = gps ? nearestCity(gps) : null; // GPS chip + yön referansı

  const findMyLocation = async () => {
    setGpsStatus("loading");
    const p = await getCurrentPosition();
    if (!p) { setGpsStatus("denied"); toast("Konum alınamadı — izin verildi mi?", "error"); return; }
    setGps([p.lat, p.lng]);
    setGpsStatus("ok");
    setSelected(null);
    toast(`Konumun bulundu — ${nearestCity([p.lat, p.lng]) || "yakınındaki"} çevresi.`, "success");
  };
  const clearGps = () => { setGps(null); setGpsStatus("idle"); setSelected(null); };

  // Bu kullanıcının ilan başına claim durumu (listingId -> "beklemede"|"kabul"|"ret").
  // Tekrar kapamayı engellemek ve "onay bekleniyor" rozetini göstermek için.
  const myClaimStatus = useMemo(() => {
    const m = new Map();
    if (!user) return m;
    for (const o of offers) {
      if (String(o.fromUserId) === String(user.id)) m.set(String(o.listingId), o.status);
    }
    return m;
  }, [offers, user]);

  // ── Kapılabilir iş ilanları: type "is", aktif, koordinatı çözülebilen ──
  // Kalkış/varış için ÖNCE ilanın gerçek pin'i (pickup/dropoff [lat,lng]),
  // yoksa il merkezi fallback. Böylece kullanıcı ilanları gerçek koridor verir.
  const claimable = useMemo(() => {
    return listings
      .filter((l) => l.type === "is" && l.status === "aktif")
      .map((l) => {
        const o = isLatLng(l.pickup) ? l.pickup : coordOf(l.il);
        const d = isLatLng(l.dropoff) ? l.dropoff : (coordOf(l.varisIl || l.bosaltma) || o);
        const precise = isLatLng(l.pickup); // gerçek pin mi, il merkezi mi
        return { ...l, _o: o, _d: d, _precise: precise };
      })
      .filter((l) => l._o);
  }, [listings]);

  // ── Çekirdek eşleştirme sorgusu (plan §6'nın JS karşılığı) ──
  const matched = useMemo(() => {
    return claimable
      .map((l) => {
        const originDist = distanceKm(myPos, l._o);
        const near = originDist <= radius;
        const dirOk = towardTarget(myPos, targetPos, l._o, l._d);
        const vehOk = !vehicle || l.cat === vehicle;
        return { ...l, originDist, pass: near && dirOk && vehOk };
      })
      .sort((a, b) => (a.pass !== b.pass ? (a.pass ? -1 : 1) : a.originDist - b.originDist));
  }, [claimable, myPos, targetPos, vehicle, radius]);

  const visible = matched.filter((l) => l.pass);
  const sel = selected ? matched.find((l) => String(l.id) === String(selected)) : null;

  // ── "Yükü Al": claim oluştur. Otomatik onay kararı App.jsx'te (güvenilirlik). ──
  const claimLoad = async (l) => {
    if (!user) { onRequireAuth?.(); return; }
    if (myClaimStatus.has(String(l.id))) { toast("Bu yükü zaten aldın, onay bekleniyor.", "info"); return; }
    const res = await onClaim?.(l);
    if (!res?.ok) { toast("Yük alınamadı.", "error"); return; }
    hapticSuccess();
    if (res.autoApproved) toast("Yük onaylandı! ⚡ (doğrulanmış kamyoncu) — sevkiyata git.", "success");
    else toast("Yük alındı — yük verenin onayı bekleniyor.", "success");
  };

  const cityOptions = IL_KEYS;

  return (
    <div style={{ position: "relative", minHeight: "100dvh", background: C.stone, fontFamily: HEAD }}>
      {/* ── Başlık ── */}
      <header style={{ padding: "14px 16px 10px", borderBottom: `2px solid ${C.ink}`, background: C.card }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontFamily: HEAD, fontWeight: 900, fontSize: 18, textTransform: "uppercase", letterSpacing: "-.02em" }}>Yük Radarı</span>
          <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, padding: "2px 7px", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 4 }}>UBER MODU</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>{visible.length} / {claimable.length} yük</span>
        </div>
        <p style={{ fontFamily: MONO, fontSize: 10.5, color: C.sub, marginTop: 5, lineHeight: 1.5 }}>
          Konumun + gitmek istediğin yönü seç → koridorundaki yükü kap. Boş dönme.
        </p>
      </header>

      {/* ── GPS satırı ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px 0", background: C.stone }}>
        {gps ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0, background: C.blue, color: "#fff", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "8px 11px" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#fff", flexShrink: 0, boxShadow: `0 0 0 2px ${C.ink}` }} />
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              GPS AKTİF · {gpsCityLabel ? gpsCityLabel.toLocaleUpperCase("tr-TR") + " ÇEVRESİ" : "KONUMUN"}
            </span>
            <button type="button" onClick={clearGps} aria-label="GPS kapat" style={{ marginLeft: "auto", flexShrink: 0, background: "none", border: "none", color: "#fff", fontSize: 16, cursor: "pointer", lineHeight: 1 }}>×</button>
          </div>
        ) : (
          <button type="button" onClick={findMyLocation} disabled={gpsStatus === "loading"} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, flex: 1, fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".02em", padding: "10px 14px", borderRadius: 6, cursor: gpsStatus === "loading" ? "default" : "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, boxShadow: "3px 3px 0 rgba(10,10,10,.2)" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.yellow} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
            {gpsStatus === "loading" ? "Konum bulunuyor…" : gpsStatus === "denied" ? "Tekrar dene" : "Konumumu Bul"}
          </button>
        )}
      </div>

      {/* ── Filtre çubuğu ── */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: "10px 14px", background: C.stone, borderBottom: `2px solid ${C.ink}` }}>
        <Field label={gps ? "Konumum (GPS)" : "Konumum"}>
          <select style={{ ...selStyle, opacity: gps ? 0.5 : 1 }} value={myCity} disabled={Boolean(gps)} onChange={(e) => { setMyCity(e.target.value); setSelected(null); }}>
            {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Gitmek istediğim yön">
          <select style={selStyle} value={targetCity} onChange={(e) => { setTargetCity(e.target.value); setSelected(null); }}>
            <option value="">Farketmez</option>
            {cityOptions.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="Kategori">
          <select style={selStyle} value={vehicle} onChange={(e) => { setVehicle(e.target.value); setSelected(null); }}>
            {VEHICLE_FILTERS.map((v) => <option key={v.key} value={v.key}>{v.label}</option>)}
          </select>
        </Field>
        <Field label={`Yakınlık · ${radius} km`}>
          <input type="range" min="50" max="600" step="25" value={radius} onChange={(e) => { setRadius(Number(e.target.value)); setSelected(null); }} style={{ width: "100%", accentColor: C.ink, height: 30 }} />
        </Field>
      </div>

      {/* ── Harita ── */}
      <div style={{ position: "relative", height: "58vh", minHeight: 340, borderBottom: `2px solid ${C.ink}` }}>
        <MapContainer center={[39.3, 35.2]} zoom={6} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <Recenter pos={myPos} zoom={gps ? 9 : 7} active={Boolean(gps)} />
          {myPos && <Marker position={myPos} icon={myPosIcon()} />}
          {sel && sel._d && sel._d !== sel._o && (
            <Polyline positions={[sel._o, sel._d]} pathOptions={{ color: C.ink, weight: 3, dashArray: "6 6" }} />
          )}
          {visible.map((l) => (
            <Marker key={l.id} position={l._o} icon={loadIcon(l, String(selected) === String(l.id))} eventHandlers={{ click: () => setSelected(l.id) }} />
          ))}
          <ZoomControls />
        </MapContainer>

        {/* Lejant */}
        <div style={{ position: "absolute", top: 12, left: 12, zIndex: 500, display: "flex", flexDirection: "column", gap: 4, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "7px 9px", boxShadow: "2px 2px 0 rgba(10,10,10,.2)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.ink }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: C.blue, border: `1.5px solid ${C.ink}` }} /> KONUMUM</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.ink }}><span style={{ width: 11, height: 11, background: C.yellow, border: `1.5px solid ${C.ink}`, borderRadius: 2 }} /> SABİT FİYAT</span>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.sub }}><span style={{ width: 11, height: 11, background: C.card, border: `1.5px solid ${C.ink}`, borderRadius: 2 }} /> TEKLİFE AÇIK</span>
        </div>
      </div>

      {/* ── Detay kartı / liste ── */}
      {sel ? (
        <LoadDetail load={sel} claimStatus={myClaimStatus.get(String(sel.id))} onClose={() => setSelected(null)} onClaim={() => claimLoad(sel)} onDetail={() => navigate(`/ilan/${sel.id}`)} onGoDispatch={() => navigate("/sevkiyat")} />
      ) : (
        <div style={{ padding: "12px 14px 96px" }}>
          {visible.length === 0 ? (
            <div style={{ padding: "28px 16px", textAlign: "center", fontFamily: MONO, fontSize: 12, color: C.sub, background: C.card, border: `2px dashed ${C.border}`, borderRadius: 6 }}>
              Bu filtrede koridorunda yük yok.<br />Yakınlığı artır ya da yönü değiştir.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {visible.map((l) => {
                const fixed = l.priceType === "sabit";
                const claimed = myClaimStatus.has(String(l.id));
                return (
                  <button key={l.id} type="button" onClick={() => setSelected(l.id)} style={{ textAlign: "left", display: "flex", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden", boxShadow: "3px 3px 0 rgba(10,10,10,.12)", cursor: "pointer" }}>
                    <span style={{ width: 6, flexShrink: 0, background: fixed ? C.yellow : C.ink }} />
                    <div style={{ flex: 1, minWidth: 0, padding: "9px 11px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                        <span style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.muted }}>
                          {(l.il || "").toLocaleUpperCase("tr-TR")} → {((l.varisIl || l.bosaltma || l.il) || "").toLocaleUpperCase("tr-TR")} · {Math.round(l.originDist)} KM
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: fixed ? C.green : C.sub, whiteSpace: "nowrap" }}>{fixed && l.price ? `₺${l.price.toLocaleString("tr-TR")}` : "TEKLİFE AÇIK"}</span>
                      </div>
                      <div style={{ fontFamily: HEAD, textTransform: "uppercase", letterSpacing: "-.02em", fontSize: 14, fontWeight: 800, lineHeight: 1.15, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: claimed ? C.green : C.sub, marginTop: 4 }}>
                        {claimed ? "✓ ALINDI · ONAY BEKLENİYOR" : `${l.amount || "?"} ${(l.unit || "").toLocaleUpperCase("tr-TR")} · ${(l.cat || "").toLocaleUpperCase("tr-TR")}`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Yük detayı + "Yükü Al" ──
function LoadDetail({ load, claimStatus, onClose, onClaim, onDetail, onGoDispatch }) {
  const fixed = load.priceType === "sabit";
  const km = load._d && load._d !== load._o ? Math.round(distanceKm(load._o, load._d)) : null;
  const claimed = Boolean(claimStatus);            // herhangi bir claim var
  const approved = claimStatus === "kabul";        // yük veren onayladı
  return (
    <div style={{ padding: "12px 14px 96px" }}>
      <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 8, overflow: "hidden", boxShadow: "4px 4px 0 rgba(10,10,10,.18)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", background: C.ink }}>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.yellow }}>{ilanNo(load.id)}</span>
          <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: "#fff", marginLeft: "auto" }}>★ {(load.ownerRating || 0).toFixed(1)} · {load.owner || "—"}</span>
          <button type="button" onClick={onClose} aria-label="Kapat" style={{ background: "none", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", lineHeight: 1, marginLeft: 4 }}>×</button>
        </div>

        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontFamily: HEAD, textTransform: "uppercase", letterSpacing: "-.02em", fontSize: 18, fontWeight: 900, lineHeight: 1.1 }}>{load.title}</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontFamily: MONO, fontSize: 13, fontWeight: 700 }}>
            <span>{load.il}</span>
            <span style={{ flex: 1, height: 2, background: C.ink, position: "relative" }}>
              <span style={{ position: "absolute", right: -1, top: -4, borderLeft: `7px solid ${C.ink}`, borderTop: "5px solid transparent", borderBottom: "5px solid transparent" }} />
            </span>
            <span>{load.varisIl || load.bosaltma || load.il}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.muted }}>
            <span>{km ? `~${km} KM GÜZERGAH · ` : ""}BANA {Math.round(load.originDist)} KM</span>
            {load._precise && <span style={{ color: C.green }}>● GERÇEK PİN</span>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
            {[
              ["YÜK", load.material || load.cat || "—"],
              ["MİKTAR", `${load.amount || "?"} ${load.unit || ""}`],
              ["KATEGORİ", (load.cat || "").toLocaleUpperCase("tr-TR")],
              ["TARİH", load.dateText || load.date || "—"],
            ].map(([k, v]) => (
              <div key={k} style={{ border: `2px solid ${C.border}`, borderRadius: 5, padding: "7px 9px" }}>
                <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.muted, letterSpacing: ".06em" }}>{k}</div>
                <div style={{ fontFamily: MONO, fontSize: 12.5, fontWeight: 700, color: C.ink, marginTop: 2 }}>{v}</div>
              </div>
            ))}
          </div>

          {load.desc && <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.sub, lineHeight: 1.55, marginTop: 12 }}>{load.desc}</p>}

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.muted }}>{fixed ? "SABİT FİYAT" : "FİYAT"}</div>
              <div style={{ fontFamily: HEAD, fontSize: 22, fontWeight: 900, color: fixed ? C.green : C.ink }}>{fixed && load.price ? `₺${load.price.toLocaleString("tr-TR")}` : "Teklife açık"}</div>
            </div>
            {approved ? (
              <button type="button" onClick={onGoDispatch} style={{ marginLeft: "auto", fontFamily: HEAD, textTransform: "uppercase", letterSpacing: ".02em", fontSize: 15, fontWeight: 900, padding: "12px 22px", borderRadius: 6, cursor: "pointer", background: C.green, color: "#fff", border: `2px solid ${C.ink}`, boxShadow: "3px 3px 0 rgba(10,10,10,.25)" }}>
                Sevkiyata Git →
              </button>
            ) : (
              <button type="button" disabled={claimed} onClick={onClaim} style={{ marginLeft: "auto", fontFamily: HEAD, textTransform: "uppercase", letterSpacing: ".02em", fontSize: 15, fontWeight: 900, padding: "12px 22px", borderRadius: 6, cursor: claimed ? "default" : "pointer", background: claimed ? C.ink : C.yellow, color: claimed ? C.yellow : C.ink, border: `2px solid ${C.ink}`, boxShadow: claimed ? "none" : "3px 3px 0 rgba(10,10,10,.25)", transition: "all .12s" }}>
                {claimed ? "Onay Bekleniyor" : fixed ? "Yükü Al" : "Teklif Ver"}
              </button>
            )}
          </div>

          {approved ? (
            <div style={{ marginTop: 12, padding: "10px 12px", background: C.green, border: `2px solid ${C.ink}`, borderRadius: 6, fontFamily: MONO, fontSize: 11, color: "#fff", lineHeight: 1.55 }}>
              <strong>✓ Yük verenin onayı geldi!</strong> İşin sevkiyat sekmesinde aktif. Yola çık, durumu oradan güncelle.
            </div>
          ) : claimed ? (
            <div style={{ marginTop: 12, padding: "10px 12px", background: C.stone, border: `2px solid ${C.border}`, borderRadius: 6, fontFamily: MONO, fontSize: 11, color: C.sub, lineHeight: 1.55 }}>
              Yük verene bildirim gitti. <strong style={{ color: C.ink }}>Onay bekleniyor…</strong> Onaylanınca burada ve bildirimlerde haber alırsın.
            </div>
          ) : (
            <button type="button" onClick={onDetail} style={{ marginTop: 12, width: "100%", background: "none", border: `2px solid ${C.border}`, borderRadius: 6, padding: "9px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub, cursor: "pointer" }}>
              İlan detayını aç →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
