import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ArrowUp, ArrowDown, Check, Building2, ChevronRight, ShieldCheck, X, Lock } from "lucide-react";
import SEO from "../components/SEO";
import Logo from "../components/Logo";
import { splitAmount, DEFAULT_FEE_RATE } from "../utils/payments";

// ── Cüzdan / hakediş — kabul edilen tekliflerden kazanç & harcama özeti + escrow durumu.
// Visual: SAHA design language (2px ink border, hazard stripe, Archivo uppercase,
// Space Mono amounts, hard offset shadow). Logic preserved 1:1 from previous version.

// SAHA palette (exact values)
const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16A34A",
  greenDeep: "#16803C",
  red: "#DC2626",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  line: "#0A0A0A",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
};
const ARCHIVO = "'Archivo', system-ui, sans-serif";
const MONO = "'Space Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
const BODY = "'Plus Jakarta Sans', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

// Hazard stripe (vertical, on dark cards / icons)
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

// ── Money helpers (UNCHANGED behaviour) ──────────────────────────────
const fmt = (n) => "₺" + Math.round(n || 0).toLocaleString("tr-TR");
const listingOf = (listings, id) => listings.find((l) => String(l.id) === String(id));
const titleOf = (listings, id) => listingOf(listings, id)?.title || "ilan";
const isDone = (listings, id) => {
  const l = listingOf(listings, id);
  return l?.phase === "teslim" || l?.status === "kapali";
};
// Escrow durumu etiketi (ilana göre)
const payInfo = (listings, id) => {
  const s = listingOf(listings, id)?.paymentStatus || "yok";
  if (s === "serbest") return { label: "ÖDENDİ", color: C.greenDeep };
  if (s === "bloke") return { label: "EMANETTE", color: "#92600A" };
  if (s === "iade") return { label: "İADE", color: "#9F1239" };
  return null;
};

// ── shell (SAHA mobile column) ───────────────────────────────────────
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

// ── Movement row (earned + / spent −) ────────────────────────────────
function MovementRow({ listings, o, sign, first }) {
  const done = isDone(listings, o.listingId);
  const pay = payInfo(listings, o.listingId);
  // Nakliyeci satırında komisyon sonrası net göster
  const net = sign === "+" ? splitAmount(o.price).payout : o.price;
  const positive = sign === "+";
  // Status caption (MONO, small)
  const statusText = positive
    ? (pay ? pay.label : done ? "TAMAMLANDI" : "DEVAM EDİYOR")
    : done ? "TAMAMLANDI" : "DEVAM EDİYOR";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 14px",
        borderTop: first ? "none" : `1.5px solid ${C.border}`,
      }}
    >
      {/* 34px 2px-bordered icon box */}
      <div
        style={{
          flexShrink: 0,
          width: 34,
          height: 34,
          border: `2px solid ${C.ink}`,
          borderRadius: 6,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: positive ? "#E6F4EA" : C.stone,
          color: positive ? C.green : C.ink,
        }}
      >
        {positive ? <ArrowDown size={17} strokeWidth={2.4} /> : <ArrowUp size={17} strokeWidth={2.4} />}
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        <div
          style={{
            fontFamily: ARCHIVO,
            fontSize: 13.5,
            fontWeight: 700,
            color: C.ink,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {titleOf(listings, o.listingId)}
        </div>
        <div
          style={{
            marginTop: 3,
            fontFamily: MONO,
            fontSize: 10.5,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: pay ? pay.color : C.muted,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {statusText}
          {positive && o.fromUser ? ` · ${o.fromUser}` : ""}
        </div>
      </div>

      <div style={{ textAlign: "right", whiteSpace: "nowrap" }}>
        <div
          style={{
            fontFamily: MONO,
            fontSize: 14,
            fontWeight: 700,
            color: positive ? C.green : C.ink,
          }}
        >
          {sign}{fmt(net)}
        </div>
        {positive && (
          <div style={{ fontFamily: MONO, fontSize: 9.5, color: C.faint, marginTop: 1 }}>
            BRÜT {fmt(o.price)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Withdraw bottom sheet ────────────────────────────────────────────
function WithdrawSheet({ balance, onClose, onConfirm }) {
  const [amount, setAmount] = useState(String(Math.round(balance || 0)));
  const quick = [
    Math.round((balance || 0) * 0.25),
    Math.round((balance || 0) * 0.5),
    Math.round(balance || 0),
  ].filter((v, i, a) => v > 0 && a.indexOf(v) === i);

  const numeric = Math.max(0, Math.min(Math.round(Number(amount) || 0), Math.round(balance || 0)));

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
      }}
    >
      {/* backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(10,10,10,0.5)" }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 460,
          background: C.bg,
          borderTop: `2px solid ${C.ink}`,
          padding: "10px 16px 26px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* grabber */}
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 14 }}>
          <div style={{ width: 44, height: 4, borderRadius: 999, background: C.ink }} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Para Çek</h2>
          <button
            onClick={onClose}
            aria-label="Kapat"
            style={{
              border: `2px solid ${C.ink}`,
              background: C.card,
              borderRadius: 6,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.ink,
            }}
          >
            <X size={17} strokeWidth={2.4} />
          </button>
        </div>

        {/* amount input card — dark */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: C.ink,
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            padding: "20px 18px",
            textAlign: "center",
          }}
        >
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 14, background: HAZARD }} />
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)", marginBottom: 8 }}>
            Çekilecek Tutar
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
            <span style={{ fontFamily: MONO, fontSize: 30, fontWeight: 700, color: C.yellow }}>₺</span>
            <input
              type="text"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              style={{
                width: "58%",
                border: "none",
                outline: "none",
                background: "transparent",
                textAlign: "center",
                fontFamily: MONO,
                fontSize: 32,
                fontWeight: 700,
                color: C.yellow,
                padding: 0,
              }}
            />
          </div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
            KULLANILABİLİR {fmt(balance)}
          </div>
        </div>

        {/* quick amounts */}
        {quick.length > 0 && (
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {quick.map((q, i) => (
              <button
                key={i}
                onClick={() => setAmount(String(q))}
                style={{
                  flex: 1,
                  border: `2px solid ${C.ink}`,
                  background: C.card,
                  borderRadius: 6,
                  padding: "10px 0",
                  fontFamily: MONO,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: C.ink,
                  cursor: "pointer",
                }}
              >
                {fmt(q)}
              </button>
            ))}
          </div>
        )}

        {/* bank account */}
        <div
          style={{
            marginTop: 16,
            background: C.card,
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            padding: "13px 14px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              border: `2px solid ${C.ink}`,
              borderRadius: 6,
              background: C.stone,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.ink,
            }}
          >
            <Building2 size={19} strokeWidth={2.2} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: ARCHIVO, fontSize: 13.5, fontWeight: 700, color: C.ink }}>Banka Hesabı</div>
            <div style={{ fontFamily: MONO, fontSize: 11.5, color: C.muted, marginTop: 2 }}>
              IBAN •••• 4821
            </div>
          </div>
          <ChevronRight size={18} color={C.faint} strokeWidth={2.2} />
        </div>

        {/* fee note */}
        <div
          style={{
            marginTop: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: C.green,
            fontFamily: MONO,
            fontSize: 11.5,
            letterSpacing: "0.01em",
          }}
        >
          <Check size={15} strokeWidth={2.8} />
          ÜCRETSİZ · 1 İŞ GÜNÜ İÇİNDE HESABINIZDA
        </div>

        {/* confirm */}
        <button
          onClick={() => onConfirm(numeric)}
          disabled={numeric <= 0}
          style={{
            marginTop: 18,
            width: "100%",
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            padding: "15px 0",
            background: numeric > 0 ? C.ink : C.border,
            color: numeric > 0 ? C.yellow : C.muted,
            fontFamily: ARCHIVO,
            fontSize: 14.5,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: "-0.01em",
            cursor: numeric > 0 ? "pointer" : "default",
            boxShadow: numeric > 0 ? `3px 3px 0 ${C.ink}` : "none",
          }}
        >
          {fmt(numeric)} Çek
        </button>
      </div>
    </div>
  );
}

// ── Section header (yellow bar) ──────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "0 0 10px" }}>
      <span style={{ width: 4, height: 16, background: C.yellow, border: `2px solid ${C.ink}`, borderRadius: 1 }} />
      <h2 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 14, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>
        {children}
      </h2>
    </div>
  );
}

export default function CuzdanPage({ user, listings = [], offers = [], onRequireAuth }) {
  const navigate = useNavigate();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [note, setNote] = useState("");

  // Hook'lar her render'da aynı sırada çağrılmalı → erken return'den ÖNCE, null-safe.
  const earned = useMemo(() => (!user ? [] : offers.filter((o) => o.status === "kabul" && String(o.fromUserId) === String(user.id) && o.price)), [offers, user]);
  const spent = useMemo(() => (!user ? [] : offers.filter((o) => o.status === "kabul" && o.price && listings.some((l) => String(l.id) === String(o.listingId) && String(l.ownerId) === String(user.id)))), [offers, listings, user]);

  if (!user) {
    return (
      <div style={shell}>
        <SEO title="Cüzdan" />
        {/* App bar */}
        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 20,
            background: C.header,
            borderBottom: `2px solid ${C.ink}`,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "11px 12px",
          }}
        >
          <button
            onClick={() => navigate(-1)}
            aria-label="Geri"
            style={{
              border: `2px solid ${C.ink}`,
              background: C.card,
              borderRadius: 6,
              width: 38,
              height: 38,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: C.ink,
            }}
          >
            <ChevronLeft size={22} strokeWidth={2.4} />
          </button>
          <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Cüzdan</h1>
        </div>

        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <Logo size="lg" />
          <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 19, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Cüzdan İçin Giriş Yapın</h1>
          <button
            onClick={() => onRequireAuth?.()}
            style={{
              border: `2px solid ${C.ink}`,
              borderRadius: 6,
              padding: "14px 22px",
              background: C.ink,
              color: C.yellow,
              fontFamily: ARCHIVO,
              fontSize: 14,
              fontWeight: 900,
              textTransform: "uppercase",
              letterSpacing: "-0.01em",
              cursor: "pointer",
              boxShadow: `3px 3px 0 ${C.ink}`,
            }}
          >
            Giriş Yap / Kayıt Ol
          </button>
        </div>
      </div>
    );
  }

  // ── Calculations (UNCHANGED) ───────────────────────────────────────
  const sum = (arr) => arr.reduce((s, o) => s + (o.price || 0), 0);
  // Nakliyeci kazancı komisyon SONRASI net
  const sumNet = (arr) => arr.reduce((s, o) => s + splitAmount(o.price).payout, 0);
  const earnTotal = sumNet(earned);
  // Emanette bekleyen (bloke) vs serbest bırakılmış (ödendi)
  const stOf = (o) => listings.find((l) => String(l.id) === String(o.listingId))?.paymentStatus || "yok";
  const earnReleased = sumNet(earned.filter((o) => stOf(o) === "serbest"));
  const earnInEscrow = sumNet(earned.filter((o) => stOf(o) === "bloke"));
  const earnPending = earnTotal - earnReleased - earnInEscrow; // henüz ödeme başlamamış
  const spendTotal = sum(spent);
  const feeTotal = earned.reduce((s, o) => s + splitAmount(o.price).fee, 0);

  // Çekilebilir bakiye = ödendi (serbest) + henüz ödeme başlamamış (bekleyen). Emanetteki bloke hariç.
  const withdrawable = earnReleased + earnPending;

  // Birleşik hareket listesi (kazanç + harcama)
  const hasMovements = earned.length > 0 || spent.length > 0;

  // Demo bankaya çekme — backend yok, sadece bilgilendirme.
  const handleWithdraw = (amount) => {
    setSheetOpen(false);
    setNote(`Para çekme yakında: ${fmt(amount)} talebi alındı (demo).`);
    window.setTimeout(() => setNote(""), 3200);
  };

  return (
    <div style={shell}>
      <SEO title="Cüzdan" description="Kazanç ve harcama özeti, hakediş durumu." />

      {/* App bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: C.header,
          borderBottom: `2px solid ${C.ink}`,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "11px 12px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          aria-label="Geri"
          style={{
            border: `2px solid ${C.ink}`,
            background: C.card,
            borderRadius: 6,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: C.ink,
          }}
        >
          <ChevronLeft size={22} strokeWidth={2.4} />
        </button>
        <h1 style={{ margin: 0, fontFamily: ARCHIVO, fontSize: 17, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", color: C.ink }}>Cüzdan</h1>
      </div>

      {/* Scroll body (bottom padding for global tab bar) */}
      <div style={{ flex: 1, padding: "16px 16px 96px" }}>
        {/* Balance card — dark + vertical hazard stripe */}
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: C.ink,
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            padding: "20px 20px",
            color: "#fff",
            boxShadow: `6px 6px 0 rgba(10,10,10,0.12)`,
          }}
        >
          {/* right vertical hazard stripe */}
          <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 22, background: HAZARD }} />

          <div style={{ paddingRight: 26 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              Toplam Hakediş
            </div>
            <div
              style={{
                fontFamily: MONO,
                fontSize: 39,
                fontWeight: 700,
                color: C.yellow,
                letterSpacing: "-0.02em",
                marginTop: 4,
              }}
            >
              {fmt(earnTotal)}
            </div>

            {/* 2-column breakdown: Bloke (Emanet) / Çekilebilir */}
            <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  Bloke (Emanet)
                </div>
                <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#fff", marginTop: 4 }}>
                  {fmt(earnInEscrow)}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: MONO, fontSize: 8, letterSpacing: "0.08em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)" }}>
                  Çekilebilir
                </div>
                <div style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.green, marginTop: 4 }}>
                  {fmt(withdrawable)}
                </div>
              </div>
            </div>

            {/* actions: Para Çek (yellow) + Geçmiş/Dekont (white) */}
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button
                onClick={() => setSheetOpen(true)}
                disabled={withdrawable <= 0}
                style={{
                  flex: 1,
                  border: `2px solid ${C.ink}`,
                  borderRadius: 6,
                  padding: "12px 0",
                  background: withdrawable > 0 ? C.yellow : "rgba(255,255,255,0.18)",
                  color: withdrawable > 0 ? C.ink : "rgba(255,255,255,0.5)",
                  fontFamily: ARCHIVO,
                  fontSize: 13.5,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  cursor: withdrawable > 0 ? "pointer" : "default",
                }}
              >
                Para Çek
              </button>
              <button
                onClick={() => navigate("/ilanlarim")}
                style={{
                  flex: 1,
                  border: `2px solid ${C.ink}`,
                  borderRadius: 6,
                  padding: "12px 0",
                  background: C.card,
                  color: C.ink,
                  fontFamily: ARCHIVO,
                  fontSize: 13.5,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                }}
              >
                Geçmiş
              </button>
            </div>
          </div>
        </div>

        {/* escrow info card */}
        <div
          style={{
            marginTop: 14,
            background: C.card,
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            padding: "13px 14px",
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              width: 40,
              height: 40,
              border: `2px solid ${C.ink}`,
              borderRadius: 6,
              background: C.yellow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: C.ink,
            }}
          >
            <ShieldCheck size={20} strokeWidth={2.2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: ARCHIVO, fontSize: 12.5, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>
              Emanet (Escrow) Koruması
            </div>
            <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.55, color: C.sub, marginTop: 4 }}>
              Para emanette bloke kalır, <b style={{ color: C.ink }}>teslimde</b> serbest bırakılır.
              Komisyon %{Math.round(DEFAULT_FEE_RATE * 100)} · toplam <b style={{ color: C.ink }}>{fmt(feeTotal)}</b>.
            </div>
          </div>
        </div>

        {/* hakediş aşamaları — para nasıl çekilebilir hale gelir */}
        <div style={{ marginTop: 12, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "13px 14px" }}>
          <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted, marginBottom: 8 }}>
            Hakediş Nasıl İşler?
          </div>
          {[
            { t: "Teklif kabul edilir", d: "İş başlar, ödeme alınır." },
            { t: "Emanette bloke kalır", d: "Para güvende tutulur (escrow)." },
            { t: "Teslimde serbest kalır", d: "Onaylanınca çekilebilir olur." },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", borderTop: i === 0 ? "none" : `1px solid ${C.border}` }}>
              <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: C.ink, color: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: MONO, fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "block", fontFamily: ARCHIVO, fontSize: 12.5, fontWeight: 800, color: C.ink, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{s.t}</span>
                <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: C.sub, marginTop: 1 }}>{s.d}</span>
              </span>
            </div>
          ))}
        </div>

        {/* two mini cards */}
        <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
          <div
            style={{
              flex: 1,
              background: C.card,
              border: `2px solid ${C.ink}`,
              borderRadius: 6,
              padding: "13px 14px",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>Emanette</div>
            <div style={{ fontFamily: MONO, fontSize: 21, fontWeight: 700, color: C.ink, marginTop: 5 }}>{fmt(earnInEscrow)}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", color: C.faint, marginTop: 3 }}>Teslimde Serbest</div>
          </div>
          <div
            style={{
              flex: 1,
              background: C.card,
              border: `2px solid ${C.ink}`,
              borderRadius: 6,
              padding: "13px 14px",
            }}
          >
            <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>Ödendi</div>
            <div style={{ fontFamily: MONO, fontSize: 21, fontWeight: 700, color: C.green, marginTop: 5 }}>{fmt(earnReleased)}</div>
            <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", color: C.faint, marginTop: 3 }}>{earned.length} Kabul Edilen İş</div>
          </div>
        </div>

        {/* spend card */}
        {spent.length > 0 && (
          <div
            style={{
              marginTop: 12,
              background: C.stone,
              border: `2px solid ${C.ink}`,
              borderRadius: 6,
              padding: "13px 14px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontFamily: MONO, fontSize: 9, letterSpacing: "0.06em", textTransform: "uppercase", color: C.muted }}>Harcama (İş Sahibi)</div>
              <div style={{ fontFamily: MONO, fontSize: 9, textTransform: "uppercase", color: C.faint, marginTop: 3 }}>{spent.length} Kabul Edilen Teklif</div>
            </div>
            <div style={{ fontFamily: MONO, fontSize: 19, fontWeight: 700, color: C.ink }}>{fmt(spendTotal)}</div>
          </div>
        )}

        {/* Movements */}
        <div style={{ marginTop: 24 }}>
          <SectionTitle>Son Hareketler</SectionTitle>

          {hasMovements ? (
            <div
              style={{
                background: C.card,
                border: `2px solid ${C.ink}`,
                borderRadius: 6,
                overflow: "hidden",
              }}
            >
              {[...earned.map((o) => ({ o, sign: "+", k: `e-${o.id}` })), ...spent.map((o) => ({ o, sign: "−", k: `s-${o.id}` }))].map((row, i) => (
                <MovementRow key={row.k} listings={listings} o={row.o} sign={row.sign} first={i === 0} />
              ))}
            </div>
          ) : (
            <div
              style={{
                background: C.card,
                border: `2px solid ${C.ink}`,
                borderRadius: 6,
                padding: "40px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  border: `2px solid ${C.ink}`,
                  borderRadius: 6,
                  background: C.stone,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: C.ink,
                }}
              >
                <ArrowDown size={22} strokeWidth={2.2} />
              </div>
              <div style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>Henüz Hareket Yok</div>
              <div style={{ fontFamily: MONO, fontSize: 11, lineHeight: 1.5, color: C.muted }}>Teklif kabul edildikçe hakediş burada görünür.</div>
              <button
                onClick={() => navigate("/ilanlar")}
                style={{
                  marginTop: 4,
                  border: `2px solid ${C.ink}`,
                  borderRadius: 6,
                  padding: "11px 20px",
                  background: C.yellow,
                  color: C.ink,
                  fontFamily: ARCHIVO,
                  fontSize: 12.5,
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em",
                  cursor: "pointer",
                  boxShadow: `3px 3px 0 ${C.ink}`,
                }}
              >
                İlanlara Göz At
              </button>
            </div>
          )}
        </div>
      </div>

      {/* toast / inline note */}
      {note && (
        <div
          style={{
            position: "fixed",
            bottom: 88,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 70,
            maxWidth: 420,
            width: "calc(100% - 32px)",
            background: C.ink,
            color: "#fff",
            border: `2px solid ${C.ink}`,
            borderRadius: 6,
            padding: "12px 16px",
            fontFamily: MONO,
            fontSize: 12,
            textAlign: "center",
            boxShadow: `4px 4px 0 rgba(10,10,10,0.25)`,
          }}
        >
          {note}
        </div>
      )}

      {/* Withdraw bottom sheet */}
      {sheetOpen && (
        <WithdrawSheet
          balance={withdrawable}
          onClose={() => setSheetOpen(false)}
          onConfirm={handleWithdraw}
        />
      )}
    </div>
  );
}
