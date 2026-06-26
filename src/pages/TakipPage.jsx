import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Check, MapPin, Phone, MessageSquare, FileCheck, Star, ShieldCheck, AlertTriangle, X, Scale, Camera, ClipboardCheck, Zap, Navigation } from "lucide-react";
import { LISTINGS } from "../data/listings";
import { CATS } from "../data/categories";
import { StarsDisplay } from "../components/Stars";
import ReportModal from "../components/ReportModal";
import SEO from "../components/SEO";
import { splitAmount, payableAmount, fmtTL, PAYMENT_LABEL, earlyPayout, EARLY_PAY_FEE_RATE } from "../utils/payments";
import { newId, nowIso } from "../utils/id";
import { haversineKm } from "../utils/priceEstimate";
import { watchPosition, distanceKm, getCurrentPosition } from "../native/geo";
import { getRoute } from "../utils/routing";
import { startTrip, publishLocation, endTrip, subscribeTrip } from "../utils/tripChannel";
import { hapticTap, hapticSuccess } from "../native/haptics";
import { pickPhotoDataUrl, cameraNative } from "../native/camera";
import { computeReliability } from "../utils/reliability";
import ReliabilityBadge from "../components/ReliabilityBadge";
import { readWeighTicket } from "../utils/ocr";
import { PAYMENTS_ENABLED } from "../config/features";

const TripMap = lazy(() => import("../components/TripMap"));
const SignaturePad = lazy(() => import("../components/SignaturePad"));

// ── "SAHA" sevkiyat takibi — dark tracking kunye card with embedded timeline +
//    live trip counter, white driver card, digital irsaliye card, green release CTA,
//    and a bottom-sheet review modal. 2px ink frames, hazard stripe, Archivo + Space Mono.
//    Tum eski islevsellik (faz akisi, escrow, degerlendirme, sikayet) korundu.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  yellowDeep: "#E0B400",
  green: "#16803C",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
  rose: "#DC2626",
  sheet: "#F1EDE5",
};
const MONO = "'Space Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace";
const ARCH = "'Archivo', system-ui, sans-serif";

const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const idText = (l) => "HMT-" + String(l.id).padStart(4, "0");

const PHASES = [["eslesti", "Eşleşti"], ["yuklendi", "Yüklendi"], ["yolda", "Yolda"], ["teslim", "Teslim"]];

const RATE_TAGS = ["Dakikti", "Belgeli", "İletişimi iyi", "Temiz araç", "Profesyonel"];
const RATE_WORD = ["", "Kötü", "İdare eder", "Orta", "İyi", "Mükemmel"];

const shell = {
  width: "100%",
  maxWidth: 460,
  margin: "0 auto",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  background: C.bg,
  color: C.ink,
  fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
};

export default function TakipPage({ listings = LISTINGS, user, offers = [], getContact, reviews = [], onAddReview, getUserRating, onUpdateListing, onReport, onPayToEscrow, onReleasePayment, onRefundPayment, onEarlyPayout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rateVal, setRateVal] = useState(0);
  const [rateComment, setRateComment] = useState("");
  const [rateTags, setRateTags] = useState([]);
  const [showRate, setShowRate] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payMsg, setPayMsg] = useState("");
  const [proofForm, setProofForm] = useState({ tonnage: "", ticketNo: "", note: "", photo: null, signature: null });
  const [proofBusy, setProofBusy] = useState(false);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [ocrHint, setOcrHint] = useState("");
  const [trip, setTrip] = useState(null);          // canlı sefer (kanaldan)
  const [tracking, setTracking] = useState(false); // sürücü konum paylaşıyor mu
  const [route, setRoute] = useState(null);        // gerçek yol rotası + süre (OSRM)
  const watchStopRef = useRef(null);
  const lastRouteRef = useRef(null);

  // Sefer kanalına abone ol (canlı konum yayını). Unmount'ta izleme durur.
  useEffect(() => {
    const unsub = subscribeTrip(id, setTrip);
    return () => { unsub(); if (watchStopRef.current) { watchStopRef.current(); watchStopRef.current = null; } };
  }, [id]);

  // Geofence: sürücü konumu yükleme/boşaltma alanına girince fazı otomatik ilerlet.
  // (Erken return'den önce; gerekli değerler içeride null-güvenli türetilir.)
  useEffect(() => {
    const lst = listings.find((x) => String(x.id) === String(id));
    const v = trip?.last;
    if (!lst || !v) return;
    const acc = offers.find((o) => String(o.listingId) === String(lst.id) && o.status === "kabul");
    const driver = acc && user && String(user.id) === String(acc.fromUserId);
    const done = lst.phase === "teslim" || lst.status === "kapali";
    if (!driver || done) return;
    const ph = lst.phase || "eslesti";
    const R = 0.2; // km (≈200 m) geofence yarıçapı
    const dPick = Array.isArray(lst.pickup) ? distanceKm([v.lat, v.lng], lst.pickup) : null;
    const dDrop = Array.isArray(lst.dropoff) ? distanceKm([v.lat, v.lng], lst.dropoff) : null;
    // Çok seferli (mekik) iş mi? — ton/m³ miktarından tahmini sefer.
    const eTrips = lst.amount && (lst.unit === "ton" || lst.unit === "m³") ? Math.ceil(lst.amount / 18) : null;

    if (eTrips) {
      // ── MEKİK: her yükleme→boşaltma = +1 sefer (döngü sayımı) ──
      const stage = lst.cycleStage || "await_load";
      if (stage === "await_load" && dPick != null && dPick <= R) {
        hapticSuccess();
        onUpdateListing?.(lst.id, { cycleStage: "loaded", ...(ph === "eslesti" ? { phase: "yuklendi" } : {}) });
        return;
      }
      if (stage === "loaded" && dDrop != null && dDrop <= R) {
        const tDone = (lst.tripsDone || 0) + 1;
        hapticSuccess();
        const patch = { tripsDone: tDone, cycleStage: "await_load", ...(ph !== "yolda" ? { phase: "yolda" } : {}) };
        if (tDone >= eTrips && !lst.arrivedAt) patch.arrivedAt = nowIso(); // son sefer → teslim kanıtı istenir (kapatma yok)
        onUpdateListing?.(lst.id, patch);
      }
      return;
    }

    // ── TEK SEFER: doğrusal faz akışı ──
    if (ph === "eslesti" && dPick != null && dPick <= R) { hapticSuccess(); onUpdateListing?.(lst.id, { phase: "yuklendi" }); return; }
    if (ph === "yuklendi" && dPick != null && dPick > R * 3) { onUpdateListing?.(lst.id, { phase: "yolda" }); return; }
    if ((ph === "yolda" || ph === "yuklendi") && dDrop != null && dDrop <= R && !lst.arrivedAt) { hapticSuccess(); onUpdateListing?.(lst.id, { arrivedAt: nowIso() }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.last?.lat, trip?.last?.lng, id, listings, offers, user]);

  // Gerçek yol rotası + ETA: araç → boşaltma. Throttle (>300m harekette yeniden iste).
  useEffect(() => {
    const lst = listings.find((x) => String(x.id) === String(id));
    const v = trip?.last;
    const drop = lst && Array.isArray(lst.dropoff) ? lst.dropoff : null;
    if (!v || !drop) return undefined;
    const last = lastRouteRef.current;
    if (last && distanceKm([v.lat, v.lng], last) <= 0.3) return undefined;
    lastRouteRef.current = [v.lat, v.lng];
    let alive = true;
    getRoute([v.lat, v.lng], drop).then((r) => { if (alive && r) setRoute(r); });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.last?.lat, trip?.last?.lng, id]);

  const l = listings.find((x) => String(x.id) === String(id));

  if (!l) {
    return (
      <div style={shell}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 20px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, border: `2px solid ${C.ink}`, background: C.card, boxShadow: `3px 3px 0 ${C.ink}` }}>
            <MapPin size={26} />
          </div>
          <h1 style={{ fontFamily: ARCH, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Takip kaydı bulunamadı</h1>
          <button
            onClick={() => navigate("/ilanlar")}
            style={{ background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 22px", fontFamily: MONO, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.ink }}
          >
            İLANLARA DÖN
          </button>
        </div>
      </div>
    );
  }

  const cat = CATS.find((c) => c.id === l.cat);
  const accepted = offers.find((o) => String(o.listingId) === String(l.id) && o.status === "kabul");
  const nakliyeci = accepted?.fromUser || "Atanmadı";
  const nakContact = accepted ? getContact?.(accepted.fromUserId) : null;
  const matched = l.status === "eslesti" || Boolean(accepted);
  const hasOffers = (l.offers || 0) > 0 || offers.some((o) => String(o.listingId) === String(l.id));

  const from = l.il;
  const to = l.bosaltma ? l.bosaltma.split(",")[0] : (l.ilce || "Saha");
  const statusLabel = matched ? "Yolda" : hasOffers ? "Teklif aşaması" : "İlan yayında";

  // ── Karşılıklı değerlendirme (eşleşince) ──
  const isOwner = user && String(user.id) === String(l.ownerId);
  const isNakliyeci = accepted && user && String(user.id) === String(accepted.fromUserId);
  const counterpart = matched
    ? (isOwner ? { id: accepted?.fromUserId, name: nakliyeci, role: "Nakliyeci" }
      : isNakliyeci ? { id: l.ownerId, name: l.owner, role: "İş sahibi" } : null)
    : null;
  const myReview = counterpart && reviews.find(
    (r) => String(r.fromId) === String(user.id) && String(r.toId) === String(counterpart.id) && String(r.listingId) === String(l.id)
  );
  const counterpartRating = counterpart ? getUserRating?.(counterpart.id) : null;
  const driverRel = accepted ? computeReliability(accepted.fromUserId, { listings, offers, reviews }) : null;

  // ── İş durumu akışı ──
  const canManage = matched && (isOwner || isNakliyeci);
  const phase = l.phase || (matched ? "eslesti" : null);
  const phaseIdx = PHASES.findIndex((p) => p[0] === phase);
  const nextPhase = phaseIdx >= 0 && phaseIdx < PHASES.length - 1 ? PHASES[phaseIdx + 1] : null;
  const estTrips = l.amount && (l.unit === "ton" || l.unit === "m³") ? Math.ceil(l.amount / 18) : null;
  const isDone = phase === "teslim" || l.status === "kapali";
  const advancePhase = () => {
    if (!nextPhase) return;
    onUpdateListing?.(l.id, { phase: nextPhase[0], ...(nextPhase[0] === "teslim" ? { status: "kapali" } : {}) });
  };

  // ── Canlı konum (sürücü = nakliyeci) ──
  const startTracking = async () => {
    hapticTap();
    startTrip(l.id);
    setTracking(true);
    watchStopRef.current = await watchPosition(
      (pt) => publishLocation(l.id, pt),
      () => { setTracking(false); }
    );
  };
  const stopTracking = () => {
    if (watchStopRef.current) { watchStopRef.current(); watchStopRef.current = null; }
    endTrip(l.id);
    setTracking(false);
  };
  // Canlı araç + ETA (mesafe → tahmini süre).
  const vehicle = trip?.last || null;
  const liveDropoff = Array.isArray(l.dropoff) ? l.dropoff : null;
  // Mesafe & ETA: gerçek yol rotası (varsa) > kuş uçuşu yedeği.
  const hvKm = vehicle && liveDropoff ? haversineKm([vehicle.lat, vehicle.lng], liveDropoff) : null;
  const speedKmh = vehicle?.speed && vehicle.speed > 1 ? vehicle.speed * 3.6 : 40;
  const remainKm = route ? Math.round(route.distanceKm) : hvKm;
  const etaMin = route ? route.durationMin : (hvKm != null ? Math.max(1, Math.round((hvKm / speedKmh) * 60)) : null);
  const etaReal = Boolean(route);
  const showTripMap = matched && !isDone && (vehicle || isNakliyeci || trip?.trail?.length);

  // Canli sefer sayaci — gercek l.tripsDone / estTrips (yoksa faz bazli)
  const tripsDone = l.tripsDone || 0;
  const tripsTotal = estTrips || PHASES.length;
  const tripsCurrent = estTrips ? tripsDone : Math.max(0, phaseIdx + 1);
  const tripsPct = tripsTotal > 0 ? Math.min(100, Math.round((tripsCurrent / tripsTotal) * 100)) : 0;

  // ── Ödeme / Escrow (emanet) ──
  const payStatus = l.paymentStatus || "yok";
  const amountToPay = payableAmount(l, accepted);
  const split = splitAmount(l.paymentAmount || amountToPay);
  const canPay = matched && isOwner && payStatus === "yok" && amountToPay > 0;        // müteahhit emanete öder

  // ── Teslim Kanıtı (kantar fişi) — tonaj anlaşmazlığını çözen güven kilidi ──
  const proof = l.deliveryProof || null;
  const canSubmitProof = isNakliyeci && matched && !proof;                            // nakliyeci kanıt ekler
  const canReviewProof = isOwner && proof && proof.status === "beklemede";            // müteahhit onaylar/itiraz eder
  // Serbest bırakma artık teslim kanıtının ONAYINA bağlı (sadece faza değil):
  const canRelease = isOwner && payStatus === "bloke" && proof?.status === "onay";
  // Kantar fişi / teslim fotoğrafı — native kamera (galeri) veya dosya seçici.
  const pickProofPhoto = async (e) => {
    if (cameraNative()) {
      e?.preventDefault?.();
      const dataUrl = await pickPhotoDataUrl();
      if (dataUrl) setProofForm((f) => ({ ...f, photo: dataUrl }));
    }
  };
  const onProofFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2_500_000) { setPayMsg("Fotoğraf 2.5 MB'tan küçük olmalı."); e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => setProofForm((ff) => ({ ...ff, photo: reader.result }));
    reader.readAsDataURL(f);
    e.target.value = "";
  };
  // Kantar fişinden tonajı oku (OCR) → alanı doldur (kullanıcı doğrular).
  const readTicket = async () => {
    if (!proofForm.photo || ocrBusy) return;
    setOcrBusy(true); setOcrHint("Fiş okunuyor…");
    const res = await readWeighTicket(proofForm.photo, l.unit || "ton");
    setOcrBusy(false);
    if (res.ok && res.best != null) {
      setProofForm((f) => ({ ...f, tonnage: String(res.best) }));
      setOcrHint(`Okundu: ${res.best} ${(l.unit || "ton").toUpperCase()} — lütfen doğrula.`);
    } else {
      setOcrHint(res.ok ? "Fişten sayı okunamadı, elle gir." : "OCR başarısız (çevrimdışı olabilir), elle gir.");
    }
  };

  const submitProof = async () => {
    const tonnage = Number(proofForm.tonnage) || 0;
    if (!tonnage) { setPayMsg("Teslim edilen miktarı girin."); return; }
    setProofBusy(true);
    // Teslim konumunu yakala (kanıtı sağlamlaştırır; başarısızsa kanıt yine gönderilir).
    const loc = await getCurrentPosition().catch(() => null);
    onUpdateListing?.(l.id, {
      deliveryProof: {
        tonnage, unit: l.unit || "ton", ticketNo: proofForm.ticketNo.trim(),
        note: proofForm.note.trim(),
        photo: proofForm.photo || null,
        signature: proofForm.signature || null,
        location: loc ? { lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy } : null,
        byId: user.id, byName: user.name, submittedAt: nowIso(), status: "beklemede",
      },
    });
    hapticSuccess();
    setProofForm({ tonnage: "", ticketNo: "", note: "", photo: null, signature: null });
    setProofBusy(false);
    setPayMsg(loc ? "Teslim kanıtı (konum doğrulandı) gönderildi, müteahhit onayında." : "Teslim kanıtı gönderildi, müteahhit onayında.");
  };
  const reviewProof = (ok) => {
    onUpdateListing?.(l.id, ok
      ? { deliveryProof: { ...proof, status: "onay", reviewedAt: nowIso() }, phase: "teslim", status: "kapali" }
      : { deliveryProof: { ...proof, status: "itiraz", reviewedAt: nowIso() } });
    setPayMsg(ok ? "Teslim onaylandı. Ödemeyi serbest bırakabilirsin." : "Teslim kanıtına itiraz edildi. Anlaşmazlık çözümü açıldı.");
  };
  // ── Anlaşmazlık çözümü (teslim itirazı sonrası) ──
  const acceptAfterDispute = () => {     // müteahhit yine de teslimi kabul eder
    onUpdateListing?.(l.id, { deliveryProof: { ...proof, status: "onay", reviewedAt: nowIso() }, phase: "teslim", status: "kapali" });
    setPayMsg("Teslim kabul edildi. Ödemeyi serbest bırakabilirsin.");
  };
  const resubmitProof = () => {          // nakliyeci düzeltilmiş kanıt için sıfırlar
    onUpdateListing?.(l.id, { deliveryProof: null });
    setPayMsg("Kanıt sıfırlandı. Düzeltilmiş kantar fişini tekrar gönderebilirsin.");
  };
  const doRefund = async () => {         // müteahhite iade
    setPayBusy(true); setPayMsg("");
    const res = await onRefundPayment?.(l);
    setPayBusy(false);
    setPayMsg(res?.ok ? "Ödeme müteahhite iade edildi." : (res?.error || "İade başarısız."));
  };
  // ── Hızlı Ödeme (erken hakediş) — teslim onaylı işte nakliyeci anında alır ──
  const early = earlyPayout(split.payout);
  const canEarlyPay = isNakliyeci && payStatus === "bloke" && proof?.status === "onay";
  const doEarlyPay = async () => {
    setPayBusy(true); setPayMsg("");
    const res = await onEarlyPayout?.(l);
    setPayBusy(false);
    setPayMsg(res?.ok ? `Hızlı ödeme yapıldı: ${fmtTL(res.net ?? early.net)} hesabına geçti.` : (res?.error || "Hızlı ödeme başarısız."));
  };
  const doPay = async () => {
    setPayBusy(true); setPayMsg("");
    const res = await onPayToEscrow?.(l.id, amountToPay);
    setPayBusy(false);
    setPayMsg(res?.ok ? (res.mock ? "Ödeme alındı (demo). Para emanette bloke." : "Ödeme alındı. Para emanette.") : (res?.error || "Ödeme başarısız."));
  };
  const doRelease = async () => {
    setPayBusy(true); setPayMsg("");
    const res = await onReleasePayment?.(l);
    setPayBusy(false);
    setPayMsg(res?.ok ? "Ödeme nakliyeciye serbest bırakıldı." : (res?.error || "İşlem başarısız."));
  };

  const toggleTag = (t) => setRateTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const submitReview = () => {
    if (!counterpart || !rateVal) return;
    const tagSuffix = rateTags.length ? ` [${rateTags.join(", ")}]` : "";
    onAddReview?.({
      id: newId(), listingId: l.id, offerId: accepted?.id,
      fromId: user.id, fromName: user.name, toId: counterpart.id, toName: counterpart.name,
      rating: rateVal, comment: (rateComment.trim() + tagSuffix).trim(), createdAt: nowIso(),
    });
    setRateVal(0); setRateComment(""); setRateTags([]); setShowRate(false);
  };

  // ── Künye spec grid ──
  const SPECS = [
    ["MİKTAR", l.amount ? `${l.amount} ${l.unit || ""}` : "—"],
    ["MALZEME", l.material || cat?.name || "—"],
    ["TARİH", l.dateText || "—"],
    ["KATEGORİ", cat?.name || "—"],
  ];

  // ── Shared inline-style helpers ──
  const whiteCard = {
    background: C.card,
    border: `2px solid ${C.ink}`,
    borderRadius: 6,
    padding: 16,
    boxShadow: `3px 3px 0 rgba(10,10,10,0.10)`,
  };
  const labelTiny = { fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.muted, textTransform: "uppercase" };
  const archTitle = { fontFamily: ARCH, fontSize: 14, fontWeight: 900, letterSpacing: "-0.01em", margin: 0, color: C.ink, textTransform: "uppercase" };

  // ── Tracking status (mockup: ● Yolda) ──
  const trackBadge = isDone
    ? { label: "TESLİM", bg: C.green, color: "#fff", dot: "#7BE3A0" }
    : matched
      ? { label: statusLabel.toUpperCase(), bg: C.yellow, color: C.ink, dot: C.ink }
      : { label: "BEKLEMEDE", bg: "#2A2A2A", color: "#9A968D", dot: "#5A5852" };

  return (
    <div style={shell}>
      <SEO title={`Takip · ${l.title}`} description="Eşleşen işin sevkiyat takibi." />

      {/* ── HEADER (manila, 2px alt çizgi) ── */}
      <div style={{ background: C.header, borderBottom: `2px solid ${C.ink}`, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={() => navigate(-1)}
          aria-label="Geri"
          style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 38, height: 38, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, color: C.ink, cursor: "pointer", flexShrink: 0 }}
        >
          <ChevronLeft size={20} />
        </button>
        <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", color: C.ink, textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {idText(l)} · İŞ TAKİBİ
        </span>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, padding: "16px 14px 110px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── KOYU TAKİP KARTI (rota + timeline + sefer ilerlemesi gömülü) ── */}
        <div style={{ position: "relative", background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, color: "#fff", overflow: "hidden", boxShadow: `5px 5px 0 rgba(10,10,10,0.18)` }}>
          {/* Üst kısım */}
          <div style={{ position: "relative", padding: "16px 18px 18px" }}>
            <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: "100%", backgroundImage: HAZARD, opacity: 0.9 }} />
            <div style={{ paddingRight: 28 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: C.yellow }}>{idText(l)}</span>
                <span
                  style={{
                    fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                    padding: "5px 9px", borderRadius: 5, border: `2px solid ${C.ink}`,
                    background: trackBadge.bg, color: trackBadge.color,
                    display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap",
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: trackBadge.dot }} />
                  {trackBadge.label}
                </span>
              </div>

              <h1 style={{ fontFamily: ARCH, fontSize: 19, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase", color: "#fff", margin: "12px 0 0", lineHeight: 1.15 }}>
                {l.title}
              </h1>

              {/* Güzergah */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 14 }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: C.yellow, flexShrink: 0 }} />
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.yellow, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{from}</span>
                <span style={{ flex: 1, height: 0, borderTop: `2px dashed ${C.yellow}`, minWidth: 16 }} />
                <span style={{ width: 9, height: 9, borderRadius: "50%", border: `2px solid #9A968D`, flexShrink: 0 }} />
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "#9A968D", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{to}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {phase && (
            <div style={{ background: "#161616", borderTop: `1.5px solid #2A2824`, padding: "16px 18px 14px" }}>
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                {PHASES.slice(1).map(([k, lbl], idx, arr) => {
                  // mockup: 3 adim (Yuklendi / Yolda / Teslim). i = index in full PHASES
                  const i = idx + 1;
                  const done = i < phaseIdx;
                  const active = i === phaseIdx;
                  const stepBg = done ? C.green : active ? C.yellow : "#0A0A0A";
                  const stepBorder = done ? C.green : active ? C.yellow : "#2A2824";
                  const stepColor = done ? "#fff" : active ? C.ink : "#5A5852";
                  const isLast = idx === arr.length - 1;
                  const lineDone = i < phaseIdx;
                  return (
                    <div key={k} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                        <span
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center",
                            width: 26, height: 26, borderRadius: 5,
                            background: stepBg, border: `2px solid ${stepBorder}`, color: stepColor, flexShrink: 0,
                          }}
                        >
                          {done ? <Check size={14} /> : active ? <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.ink }} /> : <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#5A5852" }} />}
                        </span>
                        <span style={{ fontFamily: MONO, fontSize: 8, fontWeight: 700, letterSpacing: "0.06em", color: done || active ? "#fff" : "#5A5852", textTransform: "uppercase" }}>{lbl}</span>
                      </div>
                      {!isLast && (
                        <span style={{ flex: 1, height: 2, margin: "0 4px", marginBottom: 18, background: lineDone ? C.yellow : "#2A2824", minWidth: 14 }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Sefer ilerlemesi */}
              <div style={{ marginTop: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", color: "#9A968D" }}>
                    {estTrips ? "SEFER İLERLEMESİ" : "AŞAMA İLERLEMESİ"}
                  </span>
                  <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.yellow }}>
                    {tripsCurrent}/{tripsTotal}
                  </span>
                </div>
                <div style={{ height: 12, border: `2px solid ${C.yellow}`, borderRadius: 4, padding: 2, background: "#0A0A0A" }}>
                  <div style={{ height: "100%", width: `${tripsPct}%`, background: C.yellow, borderRadius: 1, transition: "width 0.4s ease" }} />
                </div>
              </div>

              {/* Faz ilerletme (sadece taraflar) */}
              {canManage && (nextPhase || (estTrips && phaseIdx >= 1 && tripsDone < estTrips)) && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                  {nextPhase && (
                    <button
                      onClick={advancePhase}
                      style={{ flex: 1, minWidth: 140, background: C.yellow, color: C.ink, border: `2px solid ${C.yellow}`, borderRadius: 5, padding: "10px 12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      {nextPhase[1].toUpperCase()} İŞARETLE →
                    </button>
                  )}
                  {estTrips && phaseIdx >= 1 && tripsDone < estTrips && (
                    <button
                      onClick={() => onUpdateListing?.(l.id, { tripsDone: tripsDone + 1 })}
                      style={{ background: "transparent", color: C.yellow, border: `2px solid #2A2824`, borderRadius: 5, padding: "10px 14px", fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                    >
                      +1 SEFER
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* CANLI SEFER HARİTASI + sürücü kontrolü */}
        {showTripMap && (
          <div style={whiteCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ ...labelTiny, display: "flex", alignItems: "center", gap: 6 }}>
                <Navigation size={13} strokeWidth={2.4} color={C.ink} /> CANLI KONUM
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: trip?.live ? C.green : C.muted, textTransform: "uppercase" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: trip?.live ? C.green : C.muted }} />
                {trip?.live ? "Canlı" : "Çevrimdışı"}
              </span>
            </div>

            {etaMin != null && (
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink }}>
                <span>~{remainKm} KM KALDI</span>
                <span style={{ color: C.green }}>ETA ~{etaMin} DK</span>
                <span style={{ fontSize: 8.5, fontWeight: 700, color: etaReal ? C.green : C.muted, border: `1.5px solid ${etaReal ? C.green : C.muted}`, borderRadius: 4, padding: "1px 5px", textTransform: "uppercase" }}>
                  {etaReal ? "Yol" : "Kuş uçuşu"}
                </span>
              </div>
            )}

            {estTrips && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "3px 9px" }}>
                  SEFER {tripsDone}/{estTrips}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub, textTransform: "uppercase" }}>
                  {l.cycleStage === "loaded" ? "● Yükte — boşaltmaya gidiyor" : "○ Dönüşte — yüke gidiyor"}
                </span>
              </div>
            )}

            {l.arrivedAt && !isDone && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, background: "#E6F4EA", border: `2px solid ${C.green}`, borderRadius: 6, padding: "9px 11px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.green }}>
                <MapPin size={14} strokeWidth={2.6} /> Boşaltma noktasına varıldı — teslim kanıtı ekle.
              </div>
            )}

            <Suspense fallback={<div style={{ height: 280, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.stone, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 11, color: C.muted }}>Harita yükleniyor…</div>}>
              <TripMap pickup={Array.isArray(l.pickup) ? l.pickup : null} dropoff={liveDropoff} vehicle={vehicle} trail={trip?.trail || []} routeCoords={route?.coords || null} />
            </Suspense>

            {isNakliyeci && (
              <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 9.5, color: C.muted, lineHeight: 1.5 }}>
                {estTrips
                  ? "Otomatik mekik: her yükleme→boşaltma 1 sefer sayılır. Manuel “+1 sefer” yedek olarak çalışır."
                  : "Otomatik: yükleme alanına girince “yüklendi”, ayrılınca “yolda”, boşaltmaya varınca kanıt istenir."}
              </div>
            )}

            {isNakliyeci ? (
              tracking ? (
                <button onClick={stopTracking}
                  style={{ width: "100%", marginTop: 12, background: C.red, color: "#fff", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: `3px 3px 0 ${C.ink}` }}>
                  ● Konum paylaşımını durdur
                </button>
              ) : (
                <button onClick={startTracking}
                  style={{ width: "100%", marginTop: 12, background: C.green, color: "#fff", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px", fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", cursor: "pointer", boxShadow: `3px 3px 0 ${C.ink}` }}>
                  Seferi başlat — konumu paylaş
                </button>
              )
            ) : (
              !vehicle && (
                <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 10.5, color: C.muted, lineHeight: 1.5 }}>
                  Sürücü seferi başlattığında canlı konum ve tahmini varış burada görünür.
                </div>
              )
            )}
          </div>
        )}

        {/* AÇIK KÜNYE KARTI (spec grid) */}
        <div style={whiteCard}>
          <span style={labelTiny}>İŞ KÜNYESİ</span>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 16px", marginTop: 12 }}>
            {SPECS.map(([k, v]) => (
              <div key={k} style={{ minWidth: 0 }}>
                <span style={labelTiny}>{k}</span>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SÜRÜCÜ KARTI */}
        {matched && (
          <div style={{ ...whiteCard, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, borderRadius: 6, background: C.ink, color: C.yellow, fontFamily: ARCH, fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
                {(nakliyeci || "?").charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <span style={{ fontFamily: ARCH, fontSize: 14, fontWeight: 800, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nakliyeci}</span>
                  {accepted?.fromUserVerified || l.ownerVerified ? <ShieldCheck size={14} color={C.green} style={{ flexShrink: 0 }} /> : null}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {(l.vehicle || "Araç")}{l.capacity ? ` · ${l.capacity}` : ""}
                </div>
                {driverRel?.score != null && (
                  <div style={{ marginTop: 6 }}><ReliabilityBadge data={driverRel} /></div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
              {nakContact?.phone ? (
                <a
                  href={`tel:${nakContact.phone}`}
                  aria-label="Ara"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6 }}
                >
                  <Phone size={16} />
                </a>
              ) : (
                <span
                  aria-label="Telefon yok"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: C.stone, color: C.muted, border: `2px solid ${C.border}`, borderRadius: 6 }}
                >
                  <Phone size={16} />
                </span>
              )}
              <button
                onClick={() => navigate("/mesajlar")}
                aria-label="Mesaj gönder"
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, cursor: "pointer" }}
              >
                <MessageSquare size={16} />
              </button>
            </div>
          </div>
        )}

        {/* ÖDEME / ESCROW (emanet) — yayın öncesi PAYMENTS_ENABLED ile gizli */}
        {PAYMENTS_ENABLED && matched && amountToPay > 0 && (
          <div style={whiteCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={archTitle}>Güvenli Ödeme</h2>
              <span
                style={{
                  fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em",
                  padding: "5px 9px", border: `2px solid ${C.ink}`, borderRadius: 5,
                  background: payStatus === "serbest" ? C.green : payStatus === "bloke" ? C.yellow : payStatus === "iade" ? C.rose : C.stone,
                  color: payStatus === "serbest" || payStatus === "iade" ? "#fff" : C.ink,
                }}
              >
                {PAYMENT_LABEL[payStatus]}
              </span>
            </div>

            {/* Tutar dökümü */}
            <div style={{ background: C.stone, border: `2px solid ${C.border}`, borderRadius: 6, padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.sub }}>İş bedeli</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: C.ink }}>{fmtTL(split.total)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ color: C.sub }}>Platform komisyonu (%{Math.round(split.feeRate * 100)})</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: C.rose }}>−{fmtTL(split.fee)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, borderTop: `2px solid ${C.border}`, paddingTop: 9 }}>
                <span style={{ fontWeight: 700, color: C.ink }}>Nakliyecinin eline geçen</span>
                <span style={{ fontFamily: MONO, fontWeight: 700, color: C.green }}>{fmtTL(split.payout)}</span>
              </div>
            </div>

            {/* Açıklama */}
            {payStatus === "yok" && (
              <p style={{ fontSize: 12, lineHeight: 1.6, color: C.sub, margin: "12px 0 0" }}>
                Ödemeyi <b style={{ color: C.ink }}>emanete</b> yatır. Para platformda bloke kalır; <b>teslim aldığında</b> serbest bırakırsın. İş yapılmazsa iade edilir.
              </p>
            )}
            {payStatus === "bloke" && (
              <p style={{ fontSize: 12, lineHeight: 1.6, color: C.yellowDeep, margin: "12px 0 0" }}>
                Para emanette güvende. Yük <b>teslim edildiğinde</b> “Ödemeyi serbest bırak” ile nakliyeciye aktarılır.
              </p>
            )}
            {payStatus === "serbest" && (
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, margin: "12px 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check size={14} /> Ödeme tamamlandı, nakliyeciye {fmtTL(split.payout)} aktarıldı.
              </p>
            )}
            {payStatus === "iade" && (
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.rose, margin: "12px 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <AlertTriangle size={14} /> Anlaşmazlık sonucu {fmtTL(split.total)} müteahhite iade edildi.
              </p>
            )}

            {canPay && (
              <button
                onClick={doPay}
                disabled={payBusy}
                style={{ marginTop: 14, width: "100%", background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 0", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink, cursor: payBusy ? "default" : "pointer", opacity: payBusy ? 0.6 : 1 }}
              >
                {payBusy ? "İŞLENİYOR…" : `${fmtTL(split.total)} EMANETE ÖDE`}
              </button>
            )}
            {payStatus === "bloke" && !canRelease && isOwner && proof?.status !== "onay" && (
              <p style={{ fontSize: 11, color: C.muted, margin: "12px 0 0" }}>Serbest bırakma, <b>teslim kanıtı onaylandığında</b> açılır.</p>
            )}
            {isNakliyeci && payStatus === "bloke" && !canEarlyPay && (
              <p style={{ fontSize: 12, fontWeight: 700, color: C.yellowDeep, margin: "12px 0 0" }}>İş bedeli emanette güvende. Teslim onaylanınca hesabına geçecek.</p>
            )}
            {canEarlyPay && (
              <div style={{ marginTop: 14, background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 14, position: "relative", overflow: "hidden", boxShadow: `4px 4px 0 rgba(10,10,10,.18)` }}>
                <div style={{ fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: C.yellow, display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <Zap size={16} strokeWidth={2.6} /> Hızlı Ödeme
                </div>
                <p style={{ fontSize: 12, lineHeight: 1.55, color: "#C9C6BD", margin: "8px 0 12px" }}>
                  Teslim onaylandı. Müteahhitin serbest bırakmasını bekleme — hakedişini <b style={{ color: "#fff" }}>şimdi al</b>.
                </p>
                <div style={{ background: "rgba(255,255,255,0.06)", border: `2px solid #2A2A2A`, borderRadius: 6, padding: 12, display: "flex", flexDirection: "column", gap: 7 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "#9A988E" }}>Hakediş</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: "#fff" }}>{fmtTL(split.payout)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5 }}>
                    <span style={{ color: "#9A988E" }}>Erken ödeme ücreti (%{Math.round(EARLY_PAY_FEE_RATE * 100)})</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: C.rose }}>−{fmtTL(early.fee)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderTop: `2px solid #2A2A2A`, paddingTop: 7 }}>
                    <span style={{ fontWeight: 700, color: "#fff" }}>Şimdi hesabına</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: C.green2 || "#4ADE80" }}>{fmtTL(early.net)}</span>
                  </div>
                </div>
                <button onClick={doEarlyPay} disabled={payBusy}
                  style={{ width: "100%", marginTop: 12, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 0", fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: C.ink, cursor: payBusy ? "default" : "pointer", opacity: payBusy ? 0.6 : 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <Zap size={16} /> {payBusy ? "İŞLENİYOR…" : `${fmtTL(early.net)} Şimdi Al`}
                </button>
                <p style={{ fontFamily: MONO, fontSize: 9.5, color: "#7A786E", margin: "9px 0 0", textAlign: "center" }}>Beklersen müteahhit serbest bıraktığında {fmtTL(split.payout)} alırsın.</p>
              </div>
            )}
            {isNakliyeci && payStatus === "serbest" && (
              <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, margin: "12px 0 0", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Check size={14} /> {fmtTL(split.payout)} hesabına aktarıldı.
              </p>
            )}

            {payMsg && (
              <div style={{ marginTop: 12, background: C.stone, border: `2px solid ${C.border}`, borderRadius: 6, padding: "10px 14px", fontSize: 12, fontWeight: 600, color: C.ink }}>{payMsg}</div>
            )}
          </div>
        )}

        {/* TESLİM KANITI (kantar fişi) — güven kilidi */}
        {matched && accepted && (
          <div style={whiteCard}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <h2 style={{ ...archTitle, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <Scale size={17} strokeWidth={2.4} /> Teslim Kanıtı
              </h2>
              {proof && (
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.04em", padding: "4px 9px", borderRadius: 5, border: `2px solid ${C.ink}`,
                  background: proof.status === "onay" ? C.green : proof.status === "itiraz" ? C.rose : C.yellow,
                  color: proof.status === "beklemede" ? C.ink : "#fff", textTransform: "uppercase" }}>
                  {proof.status === "onay" ? "ONAYLANDI" : proof.status === "itiraz" ? "İTİRAZ" : "ONAY BEKLİYOR"}
                </span>
              )}
            </div>

            {/* Kanıt yok — nakliyeci ekler */}
            {!proof && canSubmitProof && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ fontSize: 12, lineHeight: 1.6, color: C.sub, margin: 0 }}>
                  Yükü teslim ettin mi? <b style={{ color: C.ink }}>Kantar fişini</b> gir. Müteahhit onaylayınca ödemen serbest kalır.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={labelTiny}>TESLİM EDİLEN ({(l.unit || "ton").toUpperCase()})</label>
                    <input type="number" min="0" inputMode="decimal" value={proofForm.tonnage} onChange={(e) => setProofForm((f) => ({ ...f, tonnage: e.target.value }))}
                      placeholder="0" style={{ width: "100%", marginTop: 6, boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px", fontFamily: MONO, fontSize: 18, fontWeight: 700, color: C.ink, outline: "none" }} />
                  </div>
                  <div>
                    <label style={labelTiny}>KANTAR FİŞ NO</label>
                    <input value={proofForm.ticketNo} onChange={(e) => setProofForm((f) => ({ ...f, ticketNo: e.target.value }))}
                      placeholder="Örn: 2026-4471" style={{ width: "100%", marginTop: 6, boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink, outline: "none" }} />
                  </div>
                </div>
                <div>
                  <label style={labelTiny}>NOT (opsiyonel)</label>
                  <input value={proofForm.note} onChange={(e) => setProofForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Teslim koşulu, alıcı adı…" style={{ width: "100%", marginTop: 6, boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 12px", fontFamily: "inherit", fontSize: 13, fontWeight: 600, color: C.ink, outline: "none" }} />
                </div>
                {/* Kantar fişi / teslim fotoğrafı */}
                {proofForm.photo ? (
                  <div>
                    <div style={{ position: "relative" }}>
                      <img src={proofForm.photo} alt="Kantar fişi" style={{ width: "100%", maxHeight: 200, objectFit: "cover", borderRadius: 6, border: `2px solid ${C.ink}` }} />
                      <button type="button" onClick={() => { setProofForm((f) => ({ ...f, photo: null })); setOcrHint(""); }}
                        style={{ position: "absolute", top: 8, right: 8, width: 30, height: 30, borderRadius: 6, background: C.card, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <X size={15} strokeWidth={2.6} color={C.ink} />
                      </button>
                    </div>
                    <button type="button" onClick={readTicket} disabled={ocrBusy}
                      style={{ width: "100%", marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 0", fontFamily: ARCH, fontSize: 12, fontWeight: 800, textTransform: "uppercase", cursor: ocrBusy ? "default" : "pointer", opacity: ocrBusy ? 0.7 : 1 }}>
                      <Scale size={15} /> {ocrBusy ? "Okunuyor…" : "Fişten tonajı oku"}
                    </button>
                    {ocrHint && <p style={{ margin: "6px 0 0", fontFamily: MONO, fontSize: 10, color: C.sub }}>{ocrHint}</p>}
                  </div>
                ) : (
                  <label onClick={pickProofPhoto} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.stone, border: `2px dashed ${C.ink}`, borderRadius: 6, padding: "12px 0", cursor: "pointer" }}>
                    <Camera size={16} color={C.ink} /> <span style={{ fontFamily: ARCH, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: C.ink }}>Fiş / teslim fotoğrafı</span>
                    <input type="file" accept="image/*" capture="environment" onChange={onProofFile} style={{ display: "none" }} />
                  </label>
                )}

                {/* Parmakla imza (teslim alan) */}
                <div>
                  <label style={labelTiny}>TESLİM İMZASI (opsiyonel)</label>
                  <div style={{ marginTop: 6 }}>
                    <Suspense fallback={<div style={{ height: 150, border: `2px solid ${C.ink}`, borderRadius: 6, background: "#fff" }} />}>
                      <SignaturePad onChange={(sig) => setProofForm((f) => ({ ...f, signature: sig }))} />
                    </Suspense>
                  </div>
                </div>

                <button onClick={submitProof} disabled={proofBusy}
                  style={{ width: "100%", background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 0", fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: C.ink, cursor: proofBusy ? "default" : "pointer", opacity: proofBusy ? 0.6 : 1, boxShadow: `3px 3px 0 ${C.ink}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                  <ClipboardCheck size={16} /> {proofBusy ? "Konum alınıyor…" : "Teslim Kanıtını Gönder"}
                </button>
              </div>
            )}

            {/* Kanıt yok — müteahhit bekliyor */}
            {!proof && !canSubmitProof && (
              <p style={{ fontSize: 12, lineHeight: 1.6, color: C.sub, margin: 0 }}>
                Nakliyeci yükü teslim edip <b style={{ color: C.ink }}>kantar fişini</b> girince burada görünecek. Onayınla ödeme serbest kalır.
              </p>
            )}

            {/* Kanıt var — özet */}
            {proof && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ background: C.stone, border: `2px solid ${C.border}`, borderRadius: 6, padding: 14, display: "flex", flexDirection: "column", gap: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: C.sub }}>Teslim edilen</span>
                    <span style={{ fontFamily: MONO, fontWeight: 700, color: C.ink }}>{proof.tonnage} {(proof.unit || "ton").toUpperCase()}</span>
                  </div>
                  {l.amount > 0 && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                      <span style={{ color: C.sub }}>İlandaki miktar</span>
                      <span style={{ fontFamily: MONO, fontWeight: 700, color: Math.abs(proof.tonnage - l.amount) > l.amount * 0.05 ? C.rose : C.ink }}>
                        {l.amount} {(l.unit || "ton").toUpperCase()}
                        {Math.abs(proof.tonnage - l.amount) > l.amount * 0.05 ? "  ⚠" : ""}
                      </span>
                    </div>
                  )}
                  {proof.ticketNo && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, borderTop: `2px solid ${C.border}`, paddingTop: 9 }}>
                      <span style={{ color: C.sub }}>Kantar fiş no</span>
                      <span style={{ fontFamily: MONO, fontWeight: 700, color: C.ink }}>{proof.ticketNo}</span>
                    </div>
                  )}
                  {proof.note && <p style={{ margin: 0, fontSize: 12, color: C.sub, lineHeight: 1.5 }}>“{proof.note}”</p>}

                  {(proof.photo || proof.signature) && (
                    <div style={{ display: "flex", gap: 10, borderTop: `2px solid ${C.border}`, paddingTop: 10 }}>
                      {proof.photo && (
                        <a href={proof.photo} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ ...labelTiny, display: "block", marginBottom: 4 }}>FİŞ / FOTO</span>
                          <img src={proof.photo} alt="Kantar fişi" style={{ width: "100%", height: 90, objectFit: "cover", borderRadius: 5, border: `2px solid ${C.ink}` }} />
                        </a>
                      )}
                      {proof.signature && (
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ ...labelTiny, display: "block", marginBottom: 4 }}>İMZA</span>
                          <img src={proof.signature} alt="İmza" style={{ width: "100%", height: 90, objectFit: "contain", background: "#fff", borderRadius: 5, border: `2px solid ${C.ink}` }} />
                        </div>
                      )}
                    </div>
                  )}

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                    <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, color: C.muted }}>Nakliyeci: {proof.byName}</p>
                    {proof.location && (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.green, textTransform: "uppercase" }}>
                        <MapPin size={11} strokeWidth={2.6} /> Konum doğrulandı
                        <a href={`https://www.openstreetmap.org/?mlat=${proof.location.lat}&mlon=${proof.location.lng}#map=16/${proof.location.lat}/${proof.location.lng}`} target="_blank" rel="noopener noreferrer" style={{ color: C.green, textDecoration: "underline" }}>haritada</a>
                      </span>
                    )}
                  </div>
                </div>

                {canReviewProof && (
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={() => reviewProof(false)}
                      style={{ flex: 1, background: C.card, border: `2px solid ${C.rose}`, borderRadius: 6, padding: "12px 0", fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", color: C.rose, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <AlertTriangle size={15} /> İtiraz Et
                    </button>
                    <button onClick={() => reviewProof(true)}
                      style={{ flex: 1, background: C.green, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 0", fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", color: "#fff", cursor: "pointer", boxShadow: `3px 3px 0 ${C.ink}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                      <Check size={15} /> Teslimi Onayla
                    </button>
                  </div>
                )}
                {proof.status === "beklemede" && isNakliyeci && (
                  <p style={{ fontSize: 12, fontWeight: 700, color: C.yellowDeep, margin: 0 }}>Kanıt gönderildi, müteahhit onayı bekleniyor.</p>
                )}
                {proof.status === "onay" && (
                  <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.green, margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Check size={14} /> Teslim onaylandı.
                  </p>
                )}
                {proof.status === "itiraz" && payStatus !== "iade" && (
                  <div style={{ background: "#FEF2F2", border: `2px solid ${C.rose}`, borderRadius: 6, padding: 14 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: C.rose }}>
                      <AlertTriangle size={16} /> Anlaşmazlık açık
                    </div>
                    <p style={{ fontSize: 12, lineHeight: 1.6, color: C.sub, margin: "8px 0 12px" }}>
                      Teslim kanıtına itiraz edildi. Para <b style={{ color: C.ink }}>emanette güvende</b>. Taraflar anlaşana kadar serbest bırakılmaz.
                    </p>
                    {isOwner && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ display: "flex", gap: 10 }}>
                          <button onClick={doRefund} disabled={payBusy}
                            style={{ flex: 1, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 0", fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", color: C.ink, cursor: payBusy ? "default" : "pointer", opacity: payBusy ? 0.6 : 1 }}>
                            {payBusy ? "İŞLENİYOR…" : "İadeyi Başlat"}
                          </button>
                          <button onClick={acceptAfterDispute}
                            style={{ flex: 1, background: C.green, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 0", fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", color: "#fff", cursor: "pointer", boxShadow: `3px 3px 0 ${C.ink}` }}>
                            Yine de Onayla
                          </button>
                        </div>
                        <p style={{ fontFamily: MONO, fontSize: 10, color: C.muted, margin: 0 }}>İade = para sana döner · Onayla = nakliyeciye ödenir.</p>
                      </div>
                    )}
                    {isNakliyeci && (
                      <button onClick={resubmitProof}
                        style={{ width: "100%", background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 0", fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", color: C.ink, cursor: "pointer", boxShadow: `3px 3px 0 ${C.ink}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
                        <ClipboardCheck size={15} /> Düzeltilmiş Kanıt Gönder
                      </button>
                    )}
                    <button onClick={() => setShowReport(true)}
                      style={{ width: "100%", marginTop: 10, background: "none", border: "none", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.rose, cursor: "pointer", textDecoration: "underline" }}>
                      Çözülemedi mi? Platforma şikâyet aç
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* DİJİTAL İRSALİYE KARTI */}
        {matched && accepted && (
          <button
            onClick={() => navigate(`/sozlesme/${accepted.id}`)}
            style={{ ...whiteCard, display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
          >
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, border: `2px solid ${C.green}`, borderRadius: 6, color: C.green, flexShrink: 0 }}>
              <FileCheck size={20} />
            </span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontFamily: ARCH, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>Dijital İrsaliye</div>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.green, marginTop: 3, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Check size={11} /> {estTrips ? `${tripsDone} sefer kayıtlı` : "Sözleşme hazır"}
              </div>
            </div>
            <ChevronLeft size={18} color={C.muted} style={{ transform: "rotate(180deg)", flexShrink: 0 }} />
          </button>
        )}

        {/* DEĞERLENDİRME açma kartı (eşleşince) */}
        {counterpart && (
          myReview ? (
            <div style={{ ...whiteCard, display: "flex", alignItems: "center", gap: 10 }}>
              <Star size={20} color={C.yellow} fill={C.yellow} strokeWidth={2} style={{ flexShrink: 0 }} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: C.green }}>Değerlendirdin</div>
                <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>
                  <StarsDisplay value={myReview.rating} className="text-xs" /> · teşekkürler
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowRate(true)}
              style={{ ...whiteCard, ...(isDone ? { borderColor: C.yellow, boxShadow: `3px 3px 0 ${C.yellow}` } : {}), display: "flex", alignItems: "center", gap: 12, cursor: "pointer", textAlign: "left", width: "100%" }}
            >
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 42, height: 42, border: `2px solid ${C.ink}`, borderRadius: 6, color: C.ink, flexShrink: 0 }}>
                <Star size={20} strokeWidth={2} />
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontFamily: ARCH, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>{counterpart.role}'yi Değerlendir</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 3 }}>
                  {counterpartRating?.count ? `${Number(counterpartRating.avg).toFixed(1)} ★ · ${counterpartRating.count} değerlendirme` : "Henüz puanlanmadı"}
                </div>
              </div>
              <ChevronLeft size={18} color={C.muted} style={{ transform: "rotate(180deg)", flexShrink: 0 }} />
            </button>
          )
        )}

        {/* Henüz eşleşmedi bilgisi */}
        {!matched && (
          <div style={{ background: C.stone, border: `2px dashed ${C.border}`, borderRadius: 6, padding: "16px 18px", textAlign: "center" }}>
            <p style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.sub, margin: 0 }}>BU İŞ HENÜZ EŞLEŞMEDİ</p>
            <p style={{ fontSize: 12, color: C.muted, margin: "8px 0 0", lineHeight: 1.6 }}>
              {user ? "Teklifler geldikçe takip burada güncellenir." : "Takip detayları eşleşme sonrası canlanır."}
            </p>
          </div>
        )}

        {/* Şikayet / anlaşmazlık */}
        <button
          onClick={() => setShowReport(true)}
          style={{ alignSelf: "center", background: "transparent", border: "none", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.muted, cursor: "pointer", letterSpacing: "0.04em", padding: "4px 0", display: "inline-flex", alignItems: "center", gap: 5 }}
        >
          <AlertTriangle size={12} /> SORUN BİLDİR / ANLAŞMAZLIK
        </button>
      </div>

      {/* ── ALT SABİT: İŞİ TAMAMLA & ÖDEMEYİ SERBEST BIRAK ── */}
      {canRelease && (
        <div style={{ position: "sticky", bottom: 0, padding: "12px 14px 16px", background: `linear-gradient(to top, ${C.bg} 70%, transparent)`, maxWidth: 460, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
          <button
            onClick={doRelease}
            disabled={payBusy}
            style={{ width: "100%", background: C.green, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "15px 0", fontFamily: ARCH, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#fff", cursor: payBusy ? "default" : "pointer", opacity: payBusy ? 0.6 : 1, boxShadow: `4px 4px 0 ${C.ink}`, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <Check size={18} /> {payBusy ? "İŞLENİYOR…" : "İşi Tamamla & Ödemeyi Serbest Bırak"}
          </button>
        </div>
      )}

      {/* ── DEĞERLENDİRME BOTTOM SHEET ── */}
      {showRate && counterpart && (
        <div
          onClick={() => setShowRate(false)}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,10,10,0.55)", display: "flex", alignItems: "flex-end", justifyContent: "center" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 460, background: C.sheet, border: `2px solid ${C.ink}`, borderBottom: "none", borderTopLeftRadius: 12, borderTopRightRadius: 12, overflow: "hidden" }}
          >
            {/* Hazard şeridi */}
            <div style={{ height: 8, backgroundImage: HAZARD }} />

            <div style={{ padding: "18px 18px 22px" }}>
              {/* Başlık satırı */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 44, height: 44, borderRadius: 6, background: C.ink, color: C.yellow, fontFamily: ARCH, fontSize: 18, fontWeight: 900, flexShrink: 0 }}>
                  {(counterpart.name || "?").charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", color: C.green, textTransform: "uppercase" }}>● İŞ TAMAMLANDI</div>
                  <h2 style={{ fontFamily: ARCH, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink, margin: "3px 0 0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {counterpart.name}'i Değerlendir
                  </h2>
                </div>
                <button
                  onClick={() => setShowRate(false)}
                  aria-label="Kapat"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, color: C.ink, cursor: "pointer", flexShrink: 0 }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Yıldızlar */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 22 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => setRateVal(n)}
                    aria-label={`${n} yıldız`}
                    style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
                  >
                    <Star size={38} strokeWidth={2} color={C.ink} fill={n <= rateVal ? C.yellow : C.card} />
                  </button>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 10, fontFamily: MONO, fontSize: 12, fontWeight: 700, color: rateVal ? C.ink : C.muted }}>
                {rateVal ? `${rateVal}/5 · ${RATE_WORD[rateVal]}` : "Puanını seç"}
              </div>

              {/* Yorum */}
              <textarea
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
                placeholder="Kısa yorum (opsiyonel)"
                style={{ marginTop: 16, minHeight: 70, width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 14px", fontSize: 13, color: C.ink, outline: "none", resize: "vertical", fontFamily: "inherit" }}
              />

              {/* Etiket chip'leri */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                {RATE_TAGS.map((t) => {
                  const on = rateTags.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTag(t)}
                      style={{
                        background: on ? C.yellow : C.card, color: C.ink,
                        border: `2px solid ${C.ink}`, borderRadius: 5,
                        padding: "7px 12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, cursor: "pointer",
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>

              {/* Gönder */}
              <button
                onClick={submitReview}
                disabled={!rateVal}
                style={{ marginTop: 18, width: "100%", background: C.green, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px 0", fontFamily: ARCH, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: "#fff", cursor: rateVal ? "pointer" : "default", opacity: rateVal ? 1 : 0.5, boxShadow: rateVal ? `3px 3px 0 ${C.ink}` : "none" }}
              >
                Değerlendirmeyi Gönder
              </button>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <ReportModal
          targetLabel={counterpart ? `${counterpart.role}: ${counterpart.name}` : `İlan: ${l.title}`}
          onClose={() => setShowReport(false)}
          onSubmit={(p) => { onReport?.({ type: counterpart ? "user" : "listing", targetId: counterpart?.id || l.id, listingId: l.id, fromId: user?.id || null, fromName: user?.name || "misafir", ...p }); }}
        />
      )}
    </div>
  );
}
