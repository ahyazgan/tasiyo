import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Plus } from "lucide-react";
import SEO from "../components/SEO";
import Logo from "../components/Logo";

// ── SAHA "Panel" (dashboard). Visual: SAHA design language — 2px ink border,
// Archivo uppercase, Space Mono values, hard offset shadow, 2px-framed bar chart.
// All statistics / chart derivation / activity logic preserved 1:1.

// SAHA palette (exact values)
const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  red: "#DC2626",
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

// ── mobile column shell ──────────────────────────────────────────────
const shell = {
  position: "relative",
  margin: "0 auto",
  width: "100%",
  maxWidth: 460,
  minHeight: "100vh",
  background: C.bg,
  display: "flex",
  flexDirection: "column",
  color: C.ink,
  fontFamily: BODY,
};

// ── helpers (UNCHANGED behaviour) ────────────────────────────────────
// compact TL (e.g. ₺48B for 48.000) for stat tiles
function compactTry(n) {
  const v = Math.round(n || 0);
  if (v >= 1_000_000) return "₺" + (v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1).replace(".", ",") + "M";
  if (v >= 1000) return "₺" + (v / 1000).toFixed(v % 1000 === 0 ? 0 : 1).replace(".", ",") + "B";
  return "₺" + v.toLocaleString("tr-TR");
}
function fmtTime(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

// ── Section header (yellow bar) ──────────────────────────────────────
function SectionTitle({ children, right }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "0 0 10px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 4, height: 16, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 1 }} />
        <h2 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>
          {children}
        </h2>
      </div>
      {right}
    </div>
  );
}

// ── Stat tile (2px frame, mono value, mono uppercase label) ──────────
function Stat({ label, value, accent, sub }) {
  return (
    <div
      style={{
        background: C.card,
        border: `2px solid ${C.ink}`,
        borderRadius: 6,
        boxShadow: "3px 3px 0 rgba(10,10,10,.10)",
        padding: "13px 13px 12px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 78,
        justifyContent: "center",
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 26, lineHeight: 1, fontWeight: 700, color: accent || C.ink, letterSpacing: "-0.01em" }}>
          {value ?? "—"}
        </span>
        {sub && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 400, color: C.muted }}>{sub}</span>}
      </div>
      <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.sub }}>
        {label}
      </div>
    </div>
  );
}

export default function DashboardPage({ user, listings = [], offers = [], messages = [], onRequireAuth }) {
  const navigate = useNavigate();
  const uid = user?.id;

  // Tüm hook'lar koşulsuz ve user-null'a dayanıklı (erken return hook'lardan SONRA).
  const myListings = useMemo(() => (!uid ? [] : listings.filter((l) => l.ownerId === uid)), [listings, uid]);
  const myOffers = useMemo(() => (!uid ? [] : offers.filter((o) => String(o.fromUserId) === String(uid))), [offers, uid]);
  const acceptedOffers = useMemo(() => myOffers.filter((o) => o.status === "kabul"), [myOffers]);
  const totalEarnings = useMemo(() => acceptedOffers.reduce((sum, o) => sum + (o.price || 0), 0), [acceptedOffers]);
  const pendingOffers = useMemo(() => offers.filter((o) =>
    o.status === "beklemede" && myListings.some((l) => String(l.id) === String(o.listingId))
  ).length, [offers, myListings]);
  const totalVolume = useMemo(() => myListings.filter((l) => l.status === "eslesti").reduce((s, l) => s + (l.amount || 0), 0), [myListings]);

  // Eşleşen iş / hafta — son 6 haftanın haftalık eşleşme (kabul) sayıları → bar chart.
  const weekly = useMemo(() => {
    if (!uid) return [];
    const WEEKS = 6;
    const now = new Date();
    // matched events for this user: kabul edilen verdiği teklifler + ilanlarına gelen kabuller
    const events = [
      ...myOffers.filter((o) => o.status === "kabul").map((o) => o.createdAt),
      ...offers.filter((o) => o.status === "kabul" && myListings.some((l) => String(l.id) === String(o.listingId))).map((o) => o.createdAt),
    ].filter(Boolean);
    const buckets = Array.from({ length: WEEKS }, (_, i) => {
      const end = new Date(now); end.setDate(end.getDate() - (WEEKS - 1 - i) * 7);
      const start = new Date(end); start.setDate(start.getDate() - 7);
      return { start, end, count: 0 };
    });
    events.forEach((iso) => {
      const t = new Date(iso).getTime();
      const b = buckets.find((bk) => t > bk.start.getTime() && t <= bk.end.getTime());
      if (b) b.count += 1;
    });
    const labels = ["P5", "P4", "P3", "P2", "P1", "BU"];
    return buckets.map((b, i) => ({ count: b.count, label: labels[i] }));
  }, [uid, myOffers, offers, myListings]);

  const weeklyTotal = useMemo(() => weekly.reduce((s, w) => s + w.count, 0), [weekly]);
  const weeklyTrend = useMemo(() => {
    if (weekly.length < 2) return 0;
    const last = weekly[weekly.length - 1].count;
    const prev = weekly[weekly.length - 2].count;
    if (prev === 0) return last > 0 ? 100 : 0;
    return Math.round(((last - prev) / prev) * 100);
  }, [weekly]);

  // Ortalama eşleşme süresi (ilan oluşturma → teklif kabulü), gün cinsinden.
  const avgMatchDays = useMemo(() => {
    if (!uid) return null;
    const pairs = [];
    offers.forEach((o) => {
      if (o.status !== "kabul" || !o.createdAt) return;
      const l = listings.find((x) => String(x.id) === String(o.listingId));
      if (!l) return;
      const mine = String(l.ownerId) === String(uid) || String(o.fromUserId) === String(uid);
      if (!mine || !l.createdAt) return;
      const d = (new Date(o.createdAt) - new Date(l.createdAt)) / 86_400_000;
      if (d >= 0 && Number.isFinite(d)) pairs.push(d);
    });
    if (!pairs.length) return null;
    return pairs.reduce((s, d) => s + d, 0) / pairs.length;
  }, [uid, offers, listings]);

  const activity = useMemo(() => {
    if (!uid) return [];
    const items = [
      ...messages.filter((m) => String(m.fromId) === String(uid) || String(m.toId) === String(uid)).map((m) => ({
        key: `msg-${m.id}`, dot: "ink",
        text: m.fromId === uid ? `Mesaj gönderdiniz: "${m.text.slice(0, 36)}${m.text.length > 36 ? "…" : ""}"` : `${m.fromName} mesaj gönderdi`,
        bold: m.fromId === uid ? null : m.fromName, date: m.createdAt, link: "/mesajlar",
      })),
      ...offers.filter((o) => String(o.fromUserId) === String(uid)).map((o) => ({
        key: `offer-${o.id}`, dot: o.status === "kabul" ? "green" : o.status === "ret" ? "ink" : "yellow",
        text: `Teklif ${o.status === "kabul" ? "kabul edildi" : o.status === "ret" ? "reddedildi" : "gönderildi"}${o.price ? ` — ${o.price.toLocaleString("tr-TR")} ₺` : ""}`,
        bold: o.status === "kabul" ? "kabul edildi" : null, date: o.createdAt, link: `/ilan/${o.listingId}`,
      })),
      ...offers.filter((o) => o.status !== "beklemede" && myListings.some((l) => String(l.id) === String(o.listingId))).map((o) => ({
        key: `recv-${o.id}`, dot: o.status === "kabul" ? "green" : "ink",
        text: `${o.fromUser} teklifi ${o.status === "kabul" ? "kabul edildi" : "reddedildi"}${o.price ? ` — ${o.price.toLocaleString("tr-TR")} ₺` : ""}`,
        bold: o.fromUser, date: o.createdAt, link: "/ilanlarim",
      })),
    ];
    return items.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 10);
  }, [messages, offers, myListings, uid]);

  // ── not signed in ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Panelim" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, padding: 32, textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>
            Paneli görmek için giriş yapın
          </h1>
          <button
            onClick={() => onRequireAuth?.()}
            style={{
              border: `2px solid ${C.ink}`, background: C.ink, color: C.yellow, borderRadius: 6,
              padding: "12px 22px", fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.02em", cursor: "pointer",
            }}
          >Giriş yap / Kayıt ol</button>
        </div>
      </div>
    );
  }

  const isNakliyeci = user.role === "nakliyeci";
  const totalTrips = acceptedOffers.length;
  const activeVehicles = myListings.filter((l) => l.type === "arac" && l.status === "aktif").length;
  const activeListings = myListings.filter((l) => l.status === "aktif").length;
  const matchedListings = myListings.filter((l) => l.status === "eslesti").length;
  const roleLabel = isNakliyeci ? "Nakliyeci" : user.role === "tedarikci" ? "Tedarikçi" : "İş Veren";

  // Stat tiles (role-aware) — value + label, value uses Space Mono.
  // Nakliyeci: "Eşleşen İş/Hafta" = bu haftaki kabul; iş veren ek olarak bekleyen teklif.
  const thisWeekMatches = weekly.length ? weekly[weekly.length - 1].count : 0;
  const tiles = isNakliyeci
    ? [
        { label: "Eşleşen İş / Hafta", value: `${thisWeekMatches}`, sub: `${totalTrips} sefer` },
        { label: "Toplam Hakediş", value: totalEarnings > 0 ? compactTry(totalEarnings) : "—", accent: C.green },
        { label: "Açık Araç İlanı", value: String(activeVehicles) },
        { label: "Ort. Eşleşme Süresi", value: avgMatchDays != null ? `${avgMatchDays.toFixed(1)}g` : "—" },
      ]
    : [
        { label: "Eşleşen İş / Hafta", value: `${thisWeekMatches}`, sub: `${matchedListings} toplam` },
        { label: "Toplam Hakediş", value: totalEarnings > 0 ? compactTry(totalEarnings) : (totalVolume > 0 ? `${totalVolume.toLocaleString("tr-TR")}t` : "—"), accent: totalEarnings > 0 ? C.green : C.ink },
        { label: pendingOffers > 0 ? "Bekleyen Teklif" : "Açık İlan", value: pendingOffers > 0 ? String(pendingOffers) : String(activeListings), accent: pendingOffers > 0 ? C.yellow : C.ink },
        { label: "Ort. Eşleşme Süresi", value: avgMatchDays != null ? `${avgMatchDays.toFixed(1)}g` : "—" },
      ];

  // bar chart scaling
  const maxBar = Math.max(1, ...weekly.map((w) => w.count));

  const dotColor = (d) => (d === "green" ? C.green : d === "yellow" ? C.yellow : C.ink);

  return (
    <div style={shell}>
      <SEO title="Panelim" description="Kazanç özeti, eşleşme istatistikleri ve son hareketler." />

      {/* App bar */}
      <div
        style={{
          position: "sticky", top: 0, zIndex: 20, background: C.header, borderBottom: `2px solid ${C.ink}`,
          display: "flex", alignItems: "center", gap: 10, padding: "11px 12px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Geri"
          style={{
            border: `2px solid ${C.ink}`, background: C.card, borderRadius: 6, width: 38, height: 38,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.ink,
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Panel</h1>
        <div style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: C.sub }}>{roleLabel}</div>
      </div>

      {/* Scroll body (bottom padding for global tab bar) */}
      <div style={{ flex: 1, padding: "16px 16px 96px", display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Greeting + ilan ver */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: C.muted }}>Hoş geldin</div>
            <div style={{ fontFamily: ARCHIVO, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {user.name}
            </div>
          </div>
          <button
            onClick={() => navigate("/ilan-ver")}
            style={{
              flexShrink: 0, border: `2px solid ${C.ink}`, background: C.yellow, color: C.ink, borderRadius: 6,
              padding: "9px 14px", fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, textTransform: "uppercase",
              letterSpacing: "0.02em", cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
              boxShadow: "3px 3px 0 #0A0A0A",
            }}
          >
            <Plus size={16} strokeWidth={2.6} /> İlan Ver
          </button>
        </div>

        {/* Stat grid (2x2) */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {tiles.map((t) => (
            <Stat key={t.label} label={t.label} value={t.value} accent={t.accent} sub={t.sub} />
          ))}
        </div>

        {/* Weekly matching chart */}
        <div
          style={{
            background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6,
            boxShadow: "3px 3px 0 rgba(10,10,10,.10)", padding: 14,
          }}
        >
          <SectionTitle
            right={
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: weeklyTrend >= 0 ? C.green : C.red }}>
                {weeklyTrend >= 0 ? "▲" : "▼"} %{Math.abs(weeklyTrend)}
              </span>
            }
          >
            Haftalık Eşleşme
          </SectionTitle>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 7, height: 116, padding: "4px 2px 0" }}>
            {weekly.map((w, i) => {
              const isRecent = i >= weekly.length - 2; // son 1-2 bar sarı
              const h = Math.max(8, Math.round((w.count / maxBar) * 96));
              return (
                <div key={w.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, color: w.count ? C.ink : C.muted }}>{w.count}</span>
                  <div
                    style={{
                      width: "100%", height: h, borderRadius: 3,
                      border: `2px solid ${C.ink}`,
                      background: isRecent ? C.yellow : C.stone,
                    }}
                  />
                  <span style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", color: C.sub }}>{w.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: C.muted }}>
            Son 6 hafta · {weeklyTotal} eşleşme
          </div>
        </div>

        {/* İlanlarım özeti */}
        <div>
          <SectionTitle right={<button onClick={() => navigate("/ilanlarim")} style={{ border: "none", background: "none", fontFamily: MONO, fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: C.sub, cursor: "pointer" }}>Tümü →</button>}>
            {isNakliyeci ? "Araç İlanlarım" : "İlanlarım"}
          </SectionTitle>
          {myListings.length === 0 ? (
            <div
              style={{
                background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "22px 16px",
                textAlign: "center", color: C.sub, fontSize: 13,
              }}
            >
              Henüz ilan yok.
              <div>
                <button onClick={() => navigate("/ilan-ver")} style={{ marginTop: 8, border: "none", background: "none", fontFamily: ARCHIVO, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: C.ink, cursor: "pointer" }}>İlk ilanı ver →</button>
              </div>
            </div>
          ) : (
            <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden" }}>
              {myListings.slice(0, 5).map((l, idx) => {
                const lOffers = offers.filter((o) => String(o.listingId) === String(l.id));
                const sBg = l.status === "eslesti" ? C.green : l.status === "kapali" ? C.sub : C.yellow;
                const sFg = l.status === "eslesti" || l.status === "kapali" ? "#fff" : C.ink;
                const sLbl = l.status === "eslesti" ? "Eşleşti" : l.status === "kapali" ? "Kapalı" : "Aktif";
                return (
                  <div
                    key={l.id}
                    onClick={() => navigate(`/ilan/${l.id}`)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", cursor: "pointer",
                      borderTop: idx === 0 ? "none" : `1.5px solid ${C.border}`,
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontFamily: BODY, fontSize: 13.5, fontWeight: 700, color: C.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{l.title}</div>
                      <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 400, color: C.sub, marginTop: 2 }}>
                        {l.il?.toUpperCase()} · {lOffers.length} TEKLİF{l.recurring ? " · ↻ DÜZENLİ" : ""}
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0, fontFamily: MONO, fontSize: 8.5, fontWeight: 700, textTransform: "uppercase",
                        background: sBg, color: sFg, border: `2px solid ${C.ink}`, borderRadius: 4, padding: "3px 7px",
                      }}
                    >{sLbl}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Son Hareketler */}
        <div>
          <SectionTitle>Son Hareketler</SectionTitle>
          {activity.length === 0 ? (
            <div
              style={{
                background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "22px 16px",
                textAlign: "center", color: C.sub, fontSize: 13,
              }}
            >
              Henüz hareket yok.
              <div style={{ marginTop: 4, fontFamily: MONO, fontSize: 9, textTransform: "uppercase", color: C.muted }}>İlan ver ya da teklif gönder.</div>
            </div>
          ) : (
            <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden" }}>
              {activity.map((a, idx) => (
                <div
                  key={a.key}
                  onClick={() => navigate(a.link)}
                  style={{
                    display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 13px", cursor: "pointer",
                    borderTop: idx === 0 ? "none" : `1.5px solid ${C.border}`,
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0, marginTop: 3, width: 11, height: 11, borderRadius: 2,
                      background: dotColor(a.dot), border: `2px solid ${C.ink}`,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: BODY, fontSize: 12.5, fontWeight: 500, lineHeight: 1.35, color: C.ink }}>
                      {a.bold ? renderWithBold(a.text, a.bold) : a.text}
                    </div>
                  </div>
                  {a.date && (
                    <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 9, fontWeight: 400, color: C.muted, marginTop: 1 }}>{fmtTime(a.date)}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Renders text with the matched substring in bold (no markup parsing).
function renderWithBold(text, bold) {
  const i = text.indexOf(bold);
  if (i < 0) return text;
  return (
    <>
      {text.slice(0, i)}
      <strong style={{ fontWeight: 800 }}>{bold}</strong>
      {text.slice(i + bold.length)}
    </>
  );
}
