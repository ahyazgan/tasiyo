import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Navigation, Inbox, ArrowRight } from "lucide-react";
import { LISTINGS } from "../data/listings";
import SEO from "../components/SEO";
import { getTrip } from "../utils/tripChannel";
import { distanceKm } from "../native/geo";

const FleetMap = lazy(() => import("../components/FleetMap"));

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0",
  sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const ARCH = "'Archivo', system-ui, sans-serif";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const shell = { margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: SANS, display: "flex", flexDirection: "column" };

const PHASE_LABEL = { eslesti: "Eşleşti", yuklendi: "Yüklendi", yolda: "Yolda", teslim: "Teslim" };

export default function DispatchPage({ user, listings = LISTINGS, offers = [], onRequireAuth }) {
  const navigate = useNavigate();
  const [trips, setTrips] = useState({});

  // Kullanıcının aktif işleri: sahibi olduğu eşleşmiş ilanlar + sürücüsü olduğu işler.
  const jobs = useMemo(() => {
    if (!user) return [];
    const out = [];
    const seen = new Set();
    for (const l of listings) {
      const acc = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
      const isOwner = String(l.ownerId) === String(user.id);
      const isDriver = acc && String(acc.fromUserId) === String(user.id);
      const matched = l.status === "eslesti" || Boolean(acc);
      const done = l.status === "kapali" || l.phase === "teslim";
      if (matched && !done && (isOwner || isDriver) && !seen.has(String(l.id))) {
        seen.add(String(l.id));
        out.push({ l, role: isOwner ? "İş sahibi" : "Sürücü" });
      }
    }
    return out;
  }, [user, listings, offers]);

  // Tüm işlerin canlı konumunu izle (poll + storage).
  useEffect(() => {
    if (!jobs.length) return undefined;
    const refresh = () => {
      const next = {};
      for (const j of jobs) next[j.l.id] = getTrip(j.l.id);
      setTrips(next);
    };
    refresh();
    const iv = setInterval(refresh, 3000);
    window.addEventListener("dayim:trip", refresh);
    window.addEventListener("storage", refresh);
    return () => { clearInterval(iv); window.removeEventListener("dayim:trip", refresh); window.removeEventListener("storage", refresh); };
  }, [jobs]);

  if (!user) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 14, textAlign: "center" }}>
        <SEO title="Sevkiyat" description="Canlı sevkiyat takibi." />
        <Navigation size={40} color={C.muted} strokeWidth={2} />
        <h1 style={{ fontFamily: ARCH, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Sevkiyat için giriş yap</h1>
        <button onClick={() => onRequireAuth?.()} style={{ cursor: "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", boxShadow: "3px 3px 0 #0A0A0A" }}>Giriş yap</button>
      </div>
    );
  }

  const mapItems = jobs.map((j) => {
    const t = trips[j.l.id];
    return { id: j.l.id, label: `HMT-${String(j.l.id).slice(-4)}`, vehicle: t?.last || null, live: Boolean(t?.live) };
  }).filter((i) => i.vehicle);
  const liveCount = mapItems.filter((i) => i.live).length;

  return (
    <div style={shell}>
      <SEO title="Sevkiyat" description="Filonu ve aktif seferlerini canlı izle." />

      {/* App bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: C.header, borderBottom: `2px solid ${C.ink}`, position: "sticky", top: 0, zIndex: 40 }}>
        <button onClick={() => navigate(-1)} aria-label="Geri" style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, cursor: "pointer" }}>
          <ChevronLeft size={20} strokeWidth={2.6} color={C.ink} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCH, fontSize: 19, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase" }}>Sevkiyat</h1>
        <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub }}>
          {jobs.length} AKTİF{liveCount > 0 ? ` · ${liveCount} CANLI` : ""}
        </span>
      </div>

      {jobs.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 24px", textAlign: "center" }}>
          <Inbox size={44} color={C.muted} strokeWidth={1.8} />
          <div style={{ fontFamily: ARCH, fontSize: 17, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Aktif sefer yok</div>
          <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, margin: 0, maxWidth: 280, lineHeight: 1.6 }}>Eşleşen işlerin ve canlı seferlerin burada toplanır.</p>
        </div>
      ) : (
        <div style={{ padding: "12px 16px 96px", display: "flex", flexDirection: "column", gap: 12 }}>
          {mapItems.length > 0 && (
            <Suspense fallback={<div style={{ height: 300, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.stone }} />}>
              <FleetMap items={mapItems} />
            </Suspense>
          )}

          {jobs.map((j) => {
            const l = j.l;
            const t = trips[l.id];
            const ph = l.phase || "eslesti";
            const estTrips = l.amount && (l.unit === "ton" || l.unit === "m³") ? Math.ceil(l.amount / 18) : null;
            const remain = t?.last && Array.isArray(l.dropoff) ? distanceKm([t.last.lat, t.last.lng], l.dropoff) : null;
            const etaMin = remain != null ? Math.max(1, Math.round((remain / ((t?.last?.speed && t.last.speed > 1 ? t.last.speed * 3.6 : 40))) * 60)) : null;
            return (
              <button key={l.id} onClick={() => navigate(`/takip/${l.id}`)}
                style={{ display: "flex", flexDirection: "column", gap: 8, width: "100%", textAlign: "left", cursor: "pointer", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 13, boxShadow: "3px 3px 0 rgba(10,10,10,0.1)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: t?.live ? C.green : C.muted, textTransform: "uppercase" }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: t?.live ? C.green : C.muted }} />
                    {t?.live ? "Canlı" : "Çevrimdışı"}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.ink, background: C.stone, border: `1.5px solid ${C.ink}`, borderRadius: 4, padding: "2px 6px", textTransform: "uppercase" }}>{PHASE_LABEL[ph] || ph}</span>
                  <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9, color: C.muted, textTransform: "uppercase" }}>{j.role}</span>
                </div>
                <div style={{ fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 10, color: C.sub }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.il} → {l.bosaltma || l.varisIl || l.ilce || "—"}</span>
                  {estTrips && <span style={{ flexShrink: 0, color: C.ink, fontWeight: 700 }}>SEFER {l.tripsDone || 0}/{estTrips}</span>}
                  {etaMin != null && <span style={{ flexShrink: 0, color: C.green, fontWeight: 700 }}>ETA ~{etaMin}DK</span>}
                  <ArrowRight size={14} strokeWidth={2.6} color={C.muted} style={{ marginLeft: "auto", flexShrink: 0 }} />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
