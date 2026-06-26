// YÜKLET — "İlan Ver" — SAHA marka dili (çok adımlı akış).
// Visual: industrial/site, manila/concrete palette, Space Mono numerics,
// 2px black-framed cards, hazard accent, Archivo uppercase headings.
// Flow: Adım 1/2 (kategori + tür + yük) → Adım 2/2 (güzergah + detay) → Yayınlandı.
// ALL original functionality preserved: edit mode, validation, price
// estimate, map location picker, recurring job, every form field.

import { useState, lazy, Suspense } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { CATS, LISTING_TYPES, VEHICLE_TYPES, MATERIALS, UNITS, STOCK_LEVELS } from "../data/categories";
import { IL_LIST } from "../data/listings";
import CategoryIcon from "../components/CategoryIcon";
import { estimatePrice, fmtTL, haversineKm } from "../utils/priceEstimate";
import { loadOffers, loadPricingConfig } from "../utils/storage";
import { newId } from "../utils/id";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import { shareUrl } from "../native/share";
import { hapticTap, hapticSuccess } from "../native/haptics";
import {
  ChevronLeft, ArrowRight, Truck, Package, Boxes, Check, CheckCircle2,
  MapPin, Plus, Share2, Pencil, ChevronDown,
} from "lucide-react";

const LocationPicker = lazy(() => import("../components/LocationPicker"));

// ── SAHA tokens ──
const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", yellowDeep: "#E0B400",
  green: "#16803C", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  border: "#E3DDD0", line: "#F0ECE3", sub: "#5A5852", muted: "#9A968D", faint: "#A8A39A",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const ARCH = "'Archivo', sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = {
  margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh",
  background: C.bg, color: C.ink, fontFamily: SANS,
};

// ── shared field styles (2px ink frame signature) ──
const fieldBox = {
  width: "100%", background: C.card, border: `2px solid ${C.ink}`,
  borderRadius: 6, padding: "12px 13px", fontSize: 14, fontWeight: 600, color: C.ink,
  outline: "none", fontFamily: SANS, boxSizing: "border-box",
};
const selectBox = { ...fieldBox, appearance: "none", WebkitAppearance: "none", paddingRight: 36 };

// mono uppercase micro-label
const labelStyle = {
  display: "block", fontFamily: MONO, fontSize: 9.5, fontWeight: 700,
  letterSpacing: "0.06em", textTransform: "uppercase", color: C.sub, marginBottom: 6,
};
// section heading (Archivo, big, uppercase)
const sectionTitle = {
  fontFamily: ARCH, fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em",
  textTransform: "uppercase", margin: 0,
};

function Field({ label, hint, children }) {
  return (
    <div>
      {label && (
        <label style={labelStyle}>
          {label}
          {hint && <span style={{ fontWeight: 400, color: C.muted }}> · {hint}</span>}
        </label>
      )}
      {children}
    </div>
  );
}

// styled select with chevron overlay
function SelectField({ label, hint, value, onChange, children }) {
  return (
    <Field label={label} hint={hint}>
      <div style={{ position: "relative" }}>
        <select style={selectBox} value={value} onChange={onChange}>{children}</select>
        <ChevronDown size={16} color={C.ink} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
      </div>
    </Field>
  );
}

// generic white block card with 2px ink frame
function Block({ children, style }) {
  return (
    <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 16, boxShadow: "4px 4px 0 rgba(10,10,10,.08)", ...style }}>
      {children}
    </div>
  );
}

// AppBar: back + Archivo title + step + progress bar (framed yellow fill)
function AppBar({ title, step, total, onBack }) {
  const pct = total > 0 ? Math.min(100, Math.round((step / total) * 100)) : 0;
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.header, borderBottom: `2px solid ${C.ink}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
        <button onClick={onBack} aria-label="Geri"
          style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, color: C.ink, cursor: "pointer" }}>
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <h1 style={{ flex: 1, margin: 0, fontFamily: ARCH, fontSize: 17, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase" }}>{title}</h1>
        {step != null && (
          <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.ink }}>ADIM {step}/{total}</span>
        )}
      </div>
      {step != null && (
        <div style={{ padding: "0 16px 12px" }}>
          <div style={{ height: 12, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 4, padding: 0, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, background: C.yellow, transition: "width 0.3s ease" }} />
          </div>
        </div>
      )}
    </div>
  );
}

export default function IlanVerPage({ onPublish, onUpdate, listings = [], user, onRequireAuth }) {
  const navigate = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const editListing = editing ? listings.find((l) => String(l.id) === String(id)) : null;

  // Yeni ilanda URL ön-doldurma (örn. malzeme siparişi sonrası "Nakliye Ayarla").
  const [sp] = useSearchParams();
  const pf = editing ? {} : Object.fromEntries(sp.entries());

  const [type, setType] = useState(editListing?.type || (["is", "arac", "urun"].includes(pf.type) ? pf.type : "is"));
  const [cat, setCat] = useState(editListing?.cat || (["hafriyat", "silobas"].includes(pf.cat) ? pf.cat : "hafriyat"));
  const [form, setForm] = useState(() => editListing ? {
    title: editListing.title || "", il: editListing.il || "İstanbul", ilce: editListing.ilce || "",
    varisIl: editListing.varisIl || editListing.il || "İstanbul",
    yukleme: editListing.yukleme || "", bosaltma: editListing.bosaltma || "",
    material: editListing.material || "", amount: editListing.amount != null ? String(editListing.amount) : "", unit: editListing.unit || "ton",
    vehicle: editListing.vehicle || "", capacity: editListing.capacity || "",
    dateText: editListing.dateText || "", priceType: editListing.priceType || "teklif",
    price: editListing.price != null ? String(editListing.price) : "", desc: editListing.desc || "",
    owner: editListing.owner || user?.name || "",
    recurring: editListing.recurring || false,
    recurringFreq: editListing.recurringFreq || "haftalik",
    recurringDuration: editListing.recurringDuration || "",
    dailyTrips: editListing.dailyTrips != null ? String(editListing.dailyTrips) : "",
    // urun ilani alanlari
    stock: editListing.stock || "bol",
    deliveryIncluded: editListing.deliveryIncluded || false,
  } : {
    title: pf.title || "", il: pf.il || "İstanbul", ilce: pf.ilce || "", varisIl: pf.varisIl || pf.il || "İstanbul",
    yukleme: pf.yukleme || "", bosaltma: pf.bosaltma || "",
    material: pf.material || "", amount: pf.amount || "", unit: pf.unit || "ton", vehicle: "", capacity: "",
    dateText: "", priceType: "teklif", price: "", desc: pf.desc || "", owner: user?.name || "",
    recurring: false, recurringFreq: "haftalik", recurringDuration: "", dailyTrips: "",
    stock: "bol", deliveryIncluded: false,
  });
  const [error, setError] = useState("");
  const [pickup, setPickup] = useState(editListing?.pickup || null);
  const [dropoff, setDropoff] = useState(editListing?.dropoff || null);
  const [showMap, setShowMap] = useState(false);
  // step: 1 = kategori+tür+yük, 2 = güzergah+detay, 3 = yayınlandı
  const [step, setStep] = useState(1);
  const [published, setPublished] = useState(null);
  const realKm = haversineKm(pickup, dropoff);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (type === "urun") {
      submitUrun();
      return;
    }
    if (!form.title.trim() || !form.ilce.trim() || !form.owner.trim()) {
      setError("Başlık, ilçe ve ad/firma alanları zorunludur.");
      return;
    }
    const data = {
      type, cat,
      title: form.title.trim(),
      il: form.il, ilce: form.ilce.trim(),
      yukleme: form.yukleme.trim(), bosaltma: form.bosaltma.trim(),
      varisIl: type === "is" ? form.varisIl : undefined,
      pickup: type === "is" ? pickup : undefined, dropoff: type === "is" ? dropoff : undefined, km: type === "is" ? realKm : undefined,
      material: form.material, amount: Number(form.amount) || 0, unit: form.unit,
      vehicle: type === "arac" ? form.vehicle : undefined,
      capacity: type === "arac" ? form.capacity.trim() : undefined,
      dateText: form.dateText.trim() || "Belirtilmedi",
      priceType: form.priceType, price: form.priceType === "sabit" ? Number(form.price) || 0 : null,
      desc: form.desc.trim(),
      recurring: form.recurring,
      recurringFreq: form.recurring ? form.recurringFreq : undefined,
      recurringDuration: form.recurring ? form.recurringDuration.trim() : undefined,
      dailyTrips: form.recurring && form.dailyTrips ? Number(form.dailyTrips) : undefined,
      recurringText: form.recurring
        ? [form.dailyTrips ? `Günde ${form.dailyTrips} sefer` : "", form.recurringDuration ? `• ${form.recurringDuration}` : ""].filter(Boolean).join(" ")
        : "",
    };

    if (editing) {
      onUpdate?.(editListing.id, data);
      navigate(`/ilan/${editListing.id}`);
      return;
    }

    const listing = {
      id: newId(),
      ...data,
      date: "", recurring: false, recurringText: "",
      owner: user?.name || form.owner.trim(),
      ownerId: user?.id,
      ownerVerified: user?.verified || false,
      ownerRating: user?.rating || 5.0,
      status: "aktif", offers: 0, createdText: "az önce", createdAt: new Date().toISOString(),
    };
    onPublish?.(listing);
    setPublished(listing);
    setStep(3);
    hapticSuccess();
  };

  const goStep2 = () => { setError(""); setStep(2); };

  // ── urun ilani submit (tedarikci malzeme satisi) ──
  const submitUrun = () => {
    const productName = form.title.trim();
    if (!productName || !form.ilce.trim() || !form.owner.trim()) {
      setError("Ürün adı, ilçe ve ad/firma alanları zorunludur.");
      return;
    }
    const stockLabel = (STOCK_LEVELS.find((s) => s.id === form.stock) || {}).label || "";
    const data = {
      type: "urun", cat,
      title: productName,
      productName,
      material: form.material,
      il: form.il, ilce: form.ilce.trim(),
      priceType: "sabit",
      price: Number(form.price) || 0,
      priceUnit: "₺/ton",
      stock: form.stock,
      stockText: stockLabel,
      deliveryIncluded: form.deliveryIncluded,
      desc: form.desc.trim(),
    };

    if (editing) {
      onUpdate?.(editListing.id, data);
      navigate(`/ilan/${editListing.id}`);
      return;
    }

    const listing = {
      id: newId(),
      ...data,
      owner: user?.name || form.owner.trim(),
      ownerId: user?.id,
      ownerVerified: user?.verified || false,
      ownerRating: user?.rating || 5.0,
      status: "aktif", offers: 0, createdText: "az önce", createdAt: new Date().toISOString(),
    };
    onPublish?.(listing);
    setPublished(listing);
    setStep(3);
    hapticSuccess();
  };

  const materials = MATERIALS[cat] || [];
  const vehicles = VEHICLE_TYPES[cat] || [];
  const est = type === "is" && Number(form.amount) > 0
    ? estimatePrice({ cat, amount: Number(form.amount), unit: form.unit, fromIl: form.il, toIl: form.varisIl, material: form.material, vehicle: form.vehicle, dateText: form.dateText, recurring: form.recurring, kmOverride: realKm, history: { listings, offers: loadOffers() }, config: loadPricingConfig() })
    : null;

  // ── gate: not logged in ──
  if (!user) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="İlan ver" description="Taşınacak yükünüzü veya boş aracınızı yayınlayın." />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "64px 24px 0", textAlign: "center" }}>
          <Logo size="lg" />
          <h1 style={{ margin: 0, fontFamily: ARCH, fontSize: 22, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase" }}>İlan vermek için giriş yapın</h1>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.sub }}>İlan yayınlamak ücretsizdir. Devam etmek için hesabınıza giriş yapın veya hızlıca kayıt olun.</p>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 6 }}>
            <button onClick={onRequireAuth} style={{ background: C.ink, color: C.yellow, fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 20px", cursor: "pointer" }}>Giriş yap / Kayıt ol</button>
            <button onClick={() => navigate("/ilanlar")} style={{ background: C.card, color: C.ink, fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 20px", cursor: "pointer" }}>İlanlara dön</button>
          </div>
        </div>
      </div>
    );
  }

  // ── gate: edit target not found ──
  if (editing && !editListing) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 24px 0", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontFamily: ARCH, fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>İlan bulunamadı</h1>
          <button onClick={() => navigate("/ilanlarim")} style={{ background: C.yellow, color: C.ink, fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 20px", cursor: "pointer" }}>İlanlarım</button>
        </div>
      </div>
    );
  }
  // ── gate: not owner ──
  if (editing && editListing.ownerId !== user.id) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "72px 24px 0", textAlign: "center" }}>
          <h1 style={{ margin: 0, fontFamily: ARCH, fontSize: 20, fontWeight: 900, textTransform: "uppercase" }}>Bu ilanı düzenleme yetkiniz yok</h1>
          <button onClick={() => navigate("/ilanlar")} style={{ background: C.yellow, color: C.ink, fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 20px", cursor: "pointer" }}>İlanlara dön</button>
        </div>
      </div>
    );
  }

  // ── DONE screen ──
  if (step === 3 && published) {
    const isUrun = published.type === "urun";
    const fmtPrice = isUrun
      ? (published.price ? "₺" + published.price.toLocaleString("tr-TR") + " /ton" : "Fiyat sorun")
      : published.priceType === "sabit" && published.price
        ? "₺" + published.price.toLocaleString("tr-TR") : "Teklife açık";
    const shareListing = async () => {
      hapticTap();
      const url = `${window.location.origin}/ilan/${published.id}`;
      await shareUrl({ title: published.title, text: `${published.title} — YÜKLET`, url });
    };
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="İlan yayınlandı" description="İlanınız yayında." />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "56px 20px 0", textAlign: "center" }}>
          <div style={{ width: 72, height: 72, display: "flex", alignItems: "center", justifyContent: "center", background: C.green, border: `2px solid ${C.ink}`, borderRadius: 8, boxShadow: "4px 4px 0 #0A0A0A" }}>
            <Check size={38} color="#fff" strokeWidth={3} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontFamily: ARCH, fontSize: 24, fontWeight: 900, letterSpacing: "-0.02em", textTransform: "uppercase" }}>İlanın yayında!</h1>
            <p style={{ margin: "8px 0 0", fontSize: 14, color: C.sub }}>{isUrun ? "Müteahhitler artık ürününü görebilir ve iletişime geçebilir." : "Nakliyeci ve iş sahipleri artık ilanına teklif verebilir."}</p>
          </div>

          {/* summary card — dark header block + hazard stripe */}
          <div style={{ width: "100%", textAlign: "left", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden", boxShadow: "4px 4px 0 #0A0A0A" }}>
            <div style={{ background: C.ink, color: C.yellow, fontFamily: MONO, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", padding: "9px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative" }}>
              <span>HMT-{String(published.id).padStart(4, "0")}</span>
              <span style={{ color: "#fff", display: "inline-flex", alignItems: "center", gap: 4, marginRight: 14 }}><CheckCircle2 size={12} /> AKTİF</span>
              <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 8, backgroundImage: HAZARD }} />
            </div>
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: ARCH, fontSize: 17, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase" }}>{published.title}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6, fontFamily: MONO, fontSize: 12, color: C.sub }}>
                <MapPin size={13} /> {published.il}{published.ilce ? ` / ${published.ilce}` : ""}
                {published.amount ? ` · ${published.amount} ${(published.unit || "").toUpperCase()}` : ""}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, background: cat === "hafriyat" ? C.yellow : C.ink, color: cat === "hafriyat" ? C.ink : C.yellow, border: `2px solid ${C.ink}`, padding: "2px 8px", borderRadius: 4 }}>
                  {cat === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700 }}>{fmtPrice}</span>
              </div>
            </div>
          </div>

          {/* share / edit */}
          <div style={{ display: "flex", gap: 10, width: "100%" }}>
            <button onClick={shareListing} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.card, color: C.ink, fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 0", cursor: "pointer" }}>
              <Share2 size={16} /> Paylaş
            </button>
            <button onClick={() => navigate(`/ilan-duzenle/${published.id}`)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.card, color: C.ink, fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 0", cursor: "pointer" }}>
              <Pencil size={16} /> Düzenle
            </button>
          </div>

          <button onClick={() => navigate(`/ilan/${published.id}`)} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.ink, color: C.yellow, fontFamily: ARCH, fontSize: 15, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px 0", cursor: "pointer" }}>
            İlanı gör <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  const title = editing ? "İlanı düzenle" : "İlan oluştur";
  const onBack = () => { if (step === 2) { setStep(1); setError(""); } else navigate(-1); };

  // primary full-width ink button (Devam Et / İlanı Oluştur)
  const inkBtn = {
    width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    background: C.ink, color: C.yellow, fontFamily: ARCH, fontSize: 16, fontWeight: 800,
    textTransform: "uppercase", letterSpacing: "0.01em", border: `2px solid ${C.ink}`,
    borderRadius: 6, padding: "15px 0", cursor: "pointer", boxShadow: "4px 4px 0 rgba(10,10,10,.18)",
  };

  return (
    <div style={{ ...shell, paddingBottom: 110 }}>
      <SEO title={title} description="Taşınacak yükünüzü veya boş aracınızı yayınlayın; nakliyeci ve iş sahiplerinden teklif alın." />
      <AppBar title="İlan oluştur" step={step} total={2} onBack={onBack} />

      {/* ──────────────── STEP 1: ne taşınacak + ilan türü ──────────────── */}
      {step === 1 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 22, padding: 16 }}>

          {/* NE TAŞINACAK? — kategori kartları */}
          <div>
            <h2 style={sectionTitle}>Ne taşınacak?</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
              {CATS.map((c) => {
                const active = cat === c.id;
                return (
                  <button type="button" key={c.id}
                    onClick={() => { setCat(c.id); set("material", ""); set("vehicle", ""); }}
                    style={{
                      position: "relative", overflow: "hidden", textAlign: "left", cursor: "pointer", width: "100%",
                      display: "flex", alignItems: "center", gap: 14,
                      background: active ? C.yellow : C.card,
                      border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px 16px",
                      boxShadow: active ? "4px 4px 0 #0A0A0A" : "3px 3px 0 rgba(10,10,10,.08)",
                      transition: "all 0.12s ease",
                    }}>
                    {/* icon box: active = ink bg / yellow icon, passive = stone bg / ink icon */}
                    <span style={{ width: 52, height: 52, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? C.card : C.stone, border: `2px solid ${C.ink}`, borderRadius: 6 }}>
                      <CategoryIcon catId={c.id} size={28} fallback={c.icon} />
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontFamily: ARCH, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{c.name}</span>
                      <span style={{ display: "block", fontFamily: MONO, fontSize: 11, color: active ? "#3a3a2a" : C.sub, marginTop: 2 }}>{c.desc}</span>
                    </span>
                    {/* selection box: ink square with yellow check */}
                    <span style={{ width: 24, height: 24, flexShrink: 0, marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center", background: active ? C.ink : C.card, border: `2px solid ${C.ink}`, borderRadius: 4 }}>
                      {active && <Check size={15} color={C.yellow} strokeWidth={3.5} />}
                    </span>
                    {/* hazard stripe on selected (right edge) */}
                    {active && <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 8, backgroundImage: HAZARD }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* İLAN TÜRÜ — iş / araç */}
          <div>
            <h2 style={sectionTitle}>İlan türü</h2>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              {LISTING_TYPES.map((lt) => {
                const active = type === lt.id;
                const Icon = lt.id === "arac" ? Truck : lt.id === "urun" ? Boxes : Package;
                return (
                  <button type="button" key={lt.id} onClick={() => setType(lt.id)}
                    style={{
                      flex: "1 1 0", minWidth: 0, textAlign: "center", cursor: "pointer",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
                      background: active ? C.ink : C.card, color: active ? C.yellow : C.ink,
                      border: `2px solid ${C.ink}`, borderRadius: 6, padding: "16px 8px",
                      boxShadow: active ? "4px 4px 0 #0A0A0A" : "3px 3px 0 rgba(10,10,10,.08)",
                      transition: "all 0.12s ease",
                    }}>
                    <Icon size={26} color={active ? C.yellow : C.ink} strokeWidth={2} />
                    <span style={{ fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase", lineHeight: 1.1 }}>{lt.name}</span>
                    <span style={{ fontFamily: MONO, fontSize: 9.5, color: active ? "#cfc89a" : C.sub, lineHeight: 1.35 }}>{lt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MALZEME — chip seçici (ürün ilanında Adım 2'de seçilir) */}
          {type !== "urun" && (
          <div>
            <h2 style={sectionTitle}>Malzeme</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {materials.length === 0 && <span style={{ fontSize: 13, color: C.muted }}>Bu kategoride malzeme listesi yok.</span>}
              {materials.map((m) => {
                const active = form.material === m;
                return (
                  <button type="button" key={m} onClick={() => set("material", active ? "" : m)}
                    style={{
                      fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "7px 13px", borderRadius: 5, cursor: "pointer",
                      background: active ? C.yellow : C.card,
                      border: `2px solid ${C.ink}`, color: C.ink,
                      boxShadow: active ? "2px 2px 0 #0A0A0A" : "none",
                      transition: "all 0.1s ease",
                    }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>
          )}

          {/* TAHMİNİ MİKTAR + birim toggle (ürün ilanında yok) */}
          {type !== "urun" && (
          <div>
            <h2 style={sectionTitle}>{type === "arac" ? "Taşıma kapasitesi" : "Tahmini miktar"}</h2>
            <div style={{ display: "flex", alignItems: "stretch", gap: 12, marginTop: 12 }}>
              <input type="number" min="0" inputMode="numeric" value={form.amount} onChange={(e) => set("amount", e.target.value)} placeholder="0"
                style={{ ...fieldBox, flex: 1, fontFamily: MONO, fontSize: 26, fontWeight: 700, padding: "10px 14px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {UNITS.slice(0, 4).map((u) => {
                  const active = form.unit === u;
                  return (
                    <button type="button" key={u} onClick={() => set("unit", u)}
                      style={{
                        flex: 1, fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "0 14px", borderRadius: 5, cursor: "pointer", minWidth: 66,
                        background: active ? C.yellow : C.card, color: C.ink,
                        border: `2px solid ${active ? C.ink : C.border}`, textTransform: "uppercase",
                      }}>
                      {u}
                    </button>
                  );
                })}
              </div>
            </div>
            {/* extra units beyond first 4 (select fallback so no unit is lost) */}
            {UNITS.length > 4 && (
              <div style={{ position: "relative", marginTop: 10 }}>
                <select value={UNITS.slice(0, 4).includes(form.unit) ? "" : form.unit} onChange={(e) => e.target.value && set("unit", e.target.value)}
                  style={{ ...selectBox, fontFamily: MONO }}>
                  <option value="">Diğer birim…</option>
                  {UNITS.slice(4).map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                <ChevronDown size={16} color={C.ink} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              </div>
            )}
          </div>
          )}

          <button type="button" onClick={goStep2} style={inkBtn}>
            Devam Et <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ──────────────── STEP 2 (ÜRÜN): tedarikçi malzeme satışı ──────────────── */}
      {step === 2 && type === "urun" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>

          {/* özet chip'leri */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "5px 11px" }}>
              {cat === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "5px 11px" }}>
              ÜRÜN İLANI
            </span>
          </div>

          {/* MALZEME TÜRÜ — chip seçici */}
          <div>
            <h2 style={sectionTitle}>Malzeme türü</h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {materials.length === 0 && <span style={{ fontSize: 13, color: C.muted }}>Bu kategoride malzeme listesi yok.</span>}
              {materials.map((m) => {
                const active = form.material === m;
                return (
                  <button type="button" key={m} onClick={() => set("material", active ? "" : m)}
                    style={{
                      fontFamily: MONO, fontSize: 12, fontWeight: 700, padding: "7px 13px", borderRadius: 5, cursor: "pointer",
                      background: active ? C.yellow : C.card,
                      border: `2px solid ${C.ink}`, color: C.ink,
                      boxShadow: active ? "2px 2px 0 #0A0A0A" : "none",
                      transition: "all 0.1s ease",
                    }}>
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ÜRÜN ADI + FİYAT/STOK */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Ürün adı *">
              <input style={fieldBox} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Örn: Yıkanmış 0-5 mm kum" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "end" }}>
              <Field label="Fiyat" hint="ton başı">
                <div style={{ display: "flex", alignItems: "stretch", gap: 8 }}>
                  <input type="number" min="0" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="0"
                    style={{ ...fieldBox, flex: 1, fontFamily: MONO, fontSize: 26, fontWeight: 700, padding: "10px 14px" }} />
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", background: C.ink, color: C.yellow, fontFamily: MONO, fontSize: 13, fontWeight: 700, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "0 12px", whiteSpace: "nowrap" }}>₺/ton</span>
                </div>
              </Field>
              <SelectField label="Stok" value={form.stock} onChange={(e) => set("stock", e.target.value)}>
                {STOCK_LEVELS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </SelectField>
            </div>
          </Block>

          {/* OCAK / KONUM */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span style={{ ...labelStyle, marginBottom: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
              <MapPin size={13} /> OCAK / KONUM
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <SelectField label="İl" value={form.il} onChange={(e) => set("il", e.target.value)}>
                {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
              </SelectField>
              <Field label="İlçe *">
                <input style={fieldBox} value={form.ilce} onChange={(e) => set("ilce", e.target.value)} placeholder="Örn: Aliağa" />
              </Field>
            </div>
          </Block>

          {/* NAKLİYE DAHİL ET — toggle satırı */}
          <Block style={{ background: form.deliveryIncluded ? "#F0FBF3" : C.card }}>
            <button type="button" onClick={() => set("deliveryIncluded", !form.deliveryIncluded)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
              <span style={{ width: 42, height: 42, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6 }}>
                <Truck size={22} color={C.ink} strokeWidth={2} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: ARCH, fontSize: 15, fontWeight: 900, textTransform: "uppercase", color: form.deliveryIncluded ? C.green : C.ink }}>Nakliye dahil et</span>
                <span style={{ display: "block", fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 1 }}>Fiyata teslimat dahil (sahaya getiriyorum)</span>
              </span>
              {/* green-framed switch */}
              <span style={{ width: 46, height: 26, flexShrink: 0, display: "flex", alignItems: "center", borderRadius: 999, border: `2px solid ${form.deliveryIncluded ? C.green : C.ink}`, background: form.deliveryIncluded ? C.green : C.card, padding: 2, justifyContent: form.deliveryIncluded ? "flex-end" : "flex-start", transition: "all 0.15s ease" }}>
                <span style={{ width: 18, height: 18, borderRadius: 999, background: form.deliveryIncluded ? "#fff" : C.ink }} />
              </span>
            </button>
          </Block>

          {/* AÇIKLAMA + AD/FİRMA */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Açıklama">
              <textarea style={{ ...fieldBox, minHeight: 84, resize: "vertical" }} value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder="Ürün kalitesi, analiz, teslim koşulları..." />
            </Field>
            <Field label="Ad / Firma *">
              <input style={fieldBox} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Örn: Aliağa Mıcır Ocağı" />
            </Field>
          </Block>

          {error && (
            <div style={{ background: "#FEF2F2", border: "2px solid #DC2626", borderRadius: 6, padding: "10px 14px", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "#B91C1C" }}>{error}</div>
          )}

          <button type="button" onClick={submit} style={inkBtn}>
            {editing ? "Değişiklikleri Kaydet" : "Ürünü Yayınla"} <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}

      {/* ──────────────── STEP 2: güzergah + detay (iş/araç) ──────────────── */}
      {step === 2 && type !== "urun" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>

          {/* özet chip'leri (kategori + tür) */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "5px 11px" }}>
              {cat === "hafriyat" ? "HAFRİYAT" : "SİLOBAS"}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, textTransform: "uppercase", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "5px 11px" }}>
              {type === "arac" ? "ARAÇ İLANI" : "İŞ İLANI"}
            </span>
            {form.material && (
              <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, background: C.card, color: C.ink, border: `2px solid ${C.ink}`, borderRadius: 5, padding: "5px 11px" }}>
                {form.material}
              </span>
            )}
          </div>

          {/* başlık + konum */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Başlık *">
              <input style={fieldBox} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Örn: Şantiye hafriyat taşıma" />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <SelectField label="İl" value={form.il} onChange={(e) => set("il", e.target.value)}>
                {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
              </SelectField>
              <Field label="İlçe *">
                <input style={fieldBox} value={form.ilce} onChange={(e) => set("ilce", e.target.value)} placeholder="Örn: Ümraniye" />
              </Field>
            </div>
          </Block>

          {/* güzergah (sadece iş) */}
          {type === "is" && (
            <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <span style={{ ...labelStyle, marginBottom: 0, display: "flex", alignItems: "center", gap: 6, fontSize: 11 }}>
                <MapPin size={13} /> GÜZERGAH
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Yükleme noktası">
                  <input style={fieldBox} value={form.yukleme} onChange={(e) => set("yukleme", e.target.value)} placeholder="Örn: Dudullu OSB" />
                </Field>
                <Field label="Boşaltma noktası">
                  <input style={fieldBox} value={form.bosaltma} onChange={(e) => set("bosaltma", e.target.value)} placeholder="Örn: Döküm sahası" />
                </Field>
              </div>
              <SelectField label="Varış ili" hint="dönüş yükü eşleştirmesi için" value={form.varisIl} onChange={(e) => set("varisIl", e.target.value)}>
                {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
              </SelectField>

              {/* harita konum seçici + gerçek km */}
              <div>
                <button type="button" onClick={() => setShowMap((s) => !s)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "12px 14px", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: ARCH, fontSize: 13, fontWeight: 800, textTransform: "uppercase", color: C.ink }}>
                    <MapPin size={16} /> Haritada konum seç
                    {realKm != null && <span style={{ fontFamily: MONO, fontWeight: 700, color: C.yellowDeep, textTransform: "none" }}>· {realKm} km</span>}
                  </span>
                  <ChevronDown size={18} color={C.ink} style={{ transform: showMap ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {showMap && (
                  <div style={{ marginTop: 10 }}>
                    <p style={{ margin: "0 0 8px", fontSize: 11, color: C.sub }}>
                      Önce <b style={{ color: C.green }}>yükleme</b>, sonra <b style={{ color: "#DC2626" }}>boşaltma</b> noktasına tıkla. Gerçek mesafe fiyat tahminine yansır.
                    </p>
                    <Suspense fallback={<div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", background: C.stone, border: `2px solid ${C.ink}`, borderRadius: 6, fontFamily: MONO, fontSize: 12, color: C.muted }}>Harita yükleniyor…</div>}>
                      <LocationPicker pickup={pickup} dropoff={dropoff} onChange={({ pickup: p, dropoff: d }) => { setPickup(p); setDropoff(d); }} />
                    </Suspense>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: C.sub }}>{pickup && dropoff ? `Mesafe ~${realKm} km` : pickup ? "Şimdi boşaltma noktasını işaretle" : "Yükleme noktasını işaretle"}</span>
                      {(pickup || dropoff) && <button type="button" onClick={() => { setPickup(null); setDropoff(null); }} style={{ background: "none", border: "none", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: C.yellowDeep, cursor: "pointer" }}>Temizle</button>}
                    </div>
                  </div>
                )}
              </div>
            </Block>
          )}

          {/* araç tipi + kapasite (sadece araç) */}
          {type === "arac" && (
            <Block>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <SelectField label="Araç tipi" value={form.vehicle} onChange={(e) => set("vehicle", e.target.value)}>
                  <option value="">Seçin</option>
                  {vehicles.map((v) => <option key={v} value={v}>{v}</option>)}
                </SelectField>
                <Field label="Kapasite">
                  <input style={fieldBox} value={form.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Örn: 18 ton" />
                </Field>
              </div>
            </Block>
          )}

          {/* başlangıç + fiyatlandırma */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Field label="Başlangıç / Tarih">
                <input style={fieldBox} value={form.dateText} onChange={(e) => set("dateText", e.target.value)} placeholder="Örn: 8-12 Haziran" />
              </Field>
              <SelectField label="Fiyatlandırma" value={form.priceType} onChange={(e) => set("priceType", e.target.value)}>
                <option value="teklif">Teklife açık</option>
                <option value="sabit">Sabit fiyat</option>
              </SelectField>
            </div>
            {form.priceType === "sabit" && (
              <Field label="Sabit fiyat (₺)">
                <input style={{ ...fieldBox, fontFamily: MONO, fontWeight: 700 }} type="number" min="0" inputMode="numeric" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="₺" />
                {est && (
                  <button type="button" onClick={() => set("price", String(est.mid))}
                    style={{ marginTop: 8, width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, background: C.ink, color: C.yellow, fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase", border: `2px solid ${C.ink}`, borderRadius: 6, padding: "10px 0", cursor: "pointer" }}>
                    <Check size={15} strokeWidth={3} /> Önerilen fiyatı uygula · {fmtTL(est.mid)}
                  </button>
                )}
              </Field>
            )}

            {/* fiyat tahmini rozeti */}
            {est && (
              <div style={{ background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.ink, letterSpacing: "0.04em" }}>YÜKLET AKILLI FİYAT · GÜVEN: {String(est.confidence).toUpperCase()}</span>
                  <span style={{ fontFamily: MONO, fontSize: 15, fontWeight: 700 }}>{fmtTL(est.min)} – {fmtTL(est.max)}</span>
                </div>
                <div style={{ marginTop: 5, fontFamily: MONO, fontSize: 10.5, color: "#3a3a2a" }}>
                  Önerilen ~{fmtTL(est.mid)} · {est.distLabel} · ~{est.km} km · {est.trips > 1 ? `~${est.trips} sefer` : "tek sefer"}
                  {est.dataDriven ? ` · ${est.sampleSize} benzer işten` : " · sezgisel tahmin"}
                </div>
              </div>
            )}
          </Block>

          {/* düzenli iş */}
          <Block style={{ background: form.recurring ? "#F0FBF3" : C.card }}>
            <button type="button" onClick={() => set("recurring", !form.recurring)}
              style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
              <span style={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, border: `2px solid ${C.ink}`, background: form.recurring ? C.green : C.card }}>
                {form.recurring && <Check size={15} color="#fff" strokeWidth={3.5} />}
              </span>
              <span>
                <span style={{ display: "block", fontFamily: ARCH, fontSize: 15, fontWeight: 900, textTransform: "uppercase", color: form.recurring ? C.green : C.ink }}>Düzenli iş</span>
                <span style={{ display: "block", fontFamily: MONO, fontSize: 11, color: C.sub, marginTop: 1 }}>Bu iş birden fazla gün / sürekli tekrarlanıyor</span>
              </span>
            </button>
            {form.recurring && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
                <SelectField label="Sıklık" value={form.recurringFreq} onChange={(e) => set("recurringFreq", e.target.value)}>
                  <option value="gunluk">Günlük</option>
                  <option value="haftalik">Haftalık</option>
                  <option value="aylik">Aylık</option>
                </SelectField>
                <Field label="Süre">
                  <input style={fieldBox} value={form.recurringDuration} onChange={(e) => set("recurringDuration", e.target.value)} placeholder="3 hafta" />
                </Field>
                <Field label="Günde sefer">
                  <input style={{ ...fieldBox, fontFamily: MONO, fontWeight: 700 }} type="number" min="1" value={form.dailyTrips} onChange={(e) => set("dailyTrips", e.target.value)} placeholder="5" />
                </Field>
              </div>
            )}
          </Block>

          {/* açıklama + foto + ad/firma */}
          <Block style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Field label="Açıklama">
              <textarea style={{ ...fieldBox, minHeight: 92, resize: "vertical" }} value={form.desc} onChange={(e) => set("desc", e.target.value)} placeholder="İş/araç detayları, mesafe, özel koşullar..." />
            </Field>
            {/* foto ekle (görsel placeholder) */}
            <Field label="Fotoğraf">
              <button type="button"
                style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, background: C.stone, border: `2px dashed ${C.ink}`, borderRadius: 6, padding: "20px 0", cursor: "pointer", color: C.sub }}>
                <Plus size={22} color={C.ink} />
                <span style={{ fontFamily: ARCH, fontSize: 12, fontWeight: 800, textTransform: "uppercase", color: C.ink }}>Fotoğraf ekle</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: C.muted }}>Yakında</span>
              </button>
            </Field>
            <Field label="Ad / Firma *">
              <input style={fieldBox} value={form.owner} onChange={(e) => set("owner", e.target.value)} placeholder="Örn: Yıldızlar İnşaat" />
            </Field>
          </Block>

          {/* %0 komisyon bilgi kutusu — dark block + hazard */}
          <div style={{ position: "relative", overflow: "hidden", display: "flex", alignItems: "center", gap: 12, background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "14px 16px", boxShadow: "4px 4px 0 rgba(10,10,10,.18)" }}>
            <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 700, color: C.yellow }}>%0</span>
            <div>
              <div style={{ fontFamily: ARCH, fontSize: 14, fontWeight: 800, textTransform: "uppercase", color: "#fff" }}>Komisyon yok</div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#9A988E", marginTop: 1 }}>İlan vermek ve teklif almak ücretsizdir.</div>
            </div>
            <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 8, backgroundImage: HAZARD }} />
          </div>

          {error && (
            <div style={{ background: "#FEF2F2", border: "2px solid #DC2626", borderRadius: 6, padding: "10px 14px", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: "#B91C1C" }}>{error}</div>
          )}

          <button type="button" onClick={submit} style={inkBtn}>
            {editing ? "Değişiklikleri Kaydet" : "İlanı Oluştur"} <ArrowRight size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  );
}
