import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, History, Inbox, ArrowRight, TrendingUp } from "lucide-react";
import { LISTINGS } from "../data/listings";
import SEO from "../components/SEO";

// ── Sefer Geçmişi & Hat Performansı — tamamlanan işlerden türetilen özet.
// Biriken sefer/teslim verisini görünür değere çevirir (veri moat'ı).

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", green: "#16803C",
  bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0",
  sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const ARCH = "'Archivo', system-ui, sans-serif";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const shell = { margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: SANS, display: "flex", flexDirection: "column" };

const fmtN = (n) => Math.round(n || 0).toLocaleString("tr-TR");
const fmtDate = (iso) => { try { return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" }); } catch { return ""; } };
const routeOf = (l) => `${l.il || "—"} → ${l.bosaltma || l.varisIl || l.ilce || "—"}`;

export default function TripHistoryPage({ user, listings = LISTINGS, offers = [], onRequireAuth }) {
  const navigate = useNavigate();

  const { jobs, stats, lanes } = useMemo(() => {
    if (!user) return { jobs: [], stats: null, lanes: [] };
    const uid = String(user.id);
    const done = listings.filter((l) => {
      const acc = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
      const party = String(l.ownerId) === uid || (acc && String(acc.fromUserId) === uid);
      return party && (l.status === "kapali" || l.phase === "teslim");
    });
    const tonOf = (l) => (l.deliveryProof?.tonnage || ((l.unit === "ton" || l.unit === "m³") ? l.amount : 0) || 0);
    const valOf = (l) => l.paymentAmount || l.price || 0;
    const s = {
      jobs: done.length,
      trips: done.reduce((a, l) => a + (l.tripsDone || 0), 0),
      ton: done.reduce((a, l) => a + tonOf(l), 0),
      value: done.reduce((a, l) => a + valOf(l), 0),
    };
    const laneMap = {};
    for (const l of done) {
      const key = routeOf(l);
      const e = laneMap[key] || { route: key, count: 0, ton: 0, priceSum: 0, priceCount: 0 };
      e.count += 1; e.ton += tonOf(l);
      if (valOf(l)) { e.priceSum += valOf(l); e.priceCount += 1; }
      laneMap[key] = e;
    }
    const laneArr = Object.values(laneMap).sort((a, b) => b.count - a.count).slice(0, 6);
    const sorted = [...done].sort((a, b) => String(b.deliveryProof?.submittedAt || "").localeCompare(String(a.deliveryProof?.submittedAt || "")));
    return { jobs: sorted, stats: s, lanes: laneArr };
  }, [user, listings, offers]);

  if (!user) {
    return (
      <div style={{ ...shell, alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: 14, textAlign: "center" }}>
        <SEO title="Sefer Geçmişi" />
        <History size={40} color={C.muted} strokeWidth={2} />
        <h1 style={{ fontFamily: ARCH, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Geçmiş için giriş yap</h1>
        <button onClick={() => onRequireAuth?.()} style={{ cursor: "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 22px", fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", boxShadow: "3px 3px 0 #0A0A0A" }}>Giriş yap</button>
      </div>
    );
  }

  return (
    <div style={shell}>
      <SEO title="Sefer Geçmişi" description="Tamamlanan işler, hat performansı ve toplam tonaj." />

      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: C.header, borderBottom: `2px solid ${C.ink}`, position: "sticky", top: 0, zIndex: 40 }}>
        <button onClick={() => navigate(-1)} aria-label="Geri" style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, cursor: "pointer" }}>
          <ChevronLeft size={20} strokeWidth={2.6} color={C.ink} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCH, fontSize: 19, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase" }}>Sefer Geçmişi</h1>
      </div>

      {jobs.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "60px 24px", textAlign: "center" }}>
          <Inbox size={44} color={C.muted} strokeWidth={1.8} />
          <div style={{ fontFamily: ARCH, fontSize: 17, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Tamamlanan iş yok</div>
          <p style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, margin: 0, maxWidth: 280, lineHeight: 1.6 }}>İşlerin tamamlandıkça performans özetin burada birikir.</p>
        </div>
      ) : (
        <div style={{ padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Özet */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              ["Tamamlanan iş", fmtN(stats.jobs)],
              ["Toplam sefer", fmtN(stats.trips)],
              ["Toplam tonaj", `${fmtN(stats.ton)} t`],
              ["Toplam tutar", `₺${fmtN(stats.value)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 14px" }}>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{k}</div>
                <div style={{ fontFamily: MONO, fontSize: 21, fontWeight: 700, color: C.ink, marginTop: 5 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* Hat performansı */}
          {lanes.length > 0 && (
            <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
                <TrendingUp size={15} strokeWidth={2.4} color={C.ink} />
                <h2 style={{ margin: 0, fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>Hat Performansı</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {lanes.map((ln) => (
                  <div key={ln.route} style={{ display: "flex", alignItems: "center", gap: 10, borderTop: `1px solid ${C.border}`, paddingTop: 8 }}>
                    <span style={{ flex: 1, minWidth: 0, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ln.route}</span>
                    <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10, color: C.sub }}>{ln.count} iş</span>
                    {ln.ton > 0 && <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10, color: C.sub }}>{fmtN(ln.ton)} t</span>}
                    {ln.priceCount > 0 && <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.green }}>~₺{fmtN(ln.priceSum / ln.priceCount)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tamamlanan işler */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {jobs.map((l) => (
              <button key={l.id} onClick={() => navigate(`/takip/${l.id}`)}
                style={{ display: "flex", flexDirection: "column", gap: 5, width: "100%", textAlign: "left", cursor: "pointer", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#fff", background: C.green, border: `1.5px solid ${C.ink}`, borderRadius: 4, padding: "2px 6px", textTransform: "uppercase" }}>Tamamlandı</span>
                  <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 9.5, color: C.muted }}>{fmtDate(l.deliveryProof?.submittedAt)}</span>
                </div>
                <div style={{ fontFamily: ARCH, fontSize: 13.5, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: MONO, fontSize: 10, color: C.sub }}>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{routeOf(l)}</span>
                  {(l.deliveryProof?.tonnage || l.amount) ? <span style={{ flexShrink: 0, fontWeight: 700, color: C.ink }}>{fmtN(l.deliveryProof?.tonnage || l.amount)} {(l.unit || "ton").toUpperCase()}</span> : null}
                  <ArrowRight size={14} strokeWidth={2.6} color={C.muted} style={{ marginLeft: "auto", flexShrink: 0 }} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
