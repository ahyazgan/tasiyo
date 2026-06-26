import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, BadgeCheck, Phone, Plus, Send, CheckCircle2, Check, CheckCheck } from "lucide-react";
import { newId, nowIso } from "../utils/id";
import { setTyping, isTyping } from "../utils/typing";
import { pickPhotoDataUrl, cameraNative } from "../native/camera";
import SEO from "../components/SEO";
import Logo from "../components/Logo";

// ── SAHA messages view — sharp industrial language: 2px ink borders, Archivo
//    uppercase headings, Space Mono codes/times, hard (no-blur) shadows.

const C = {
  ink: "#0A0A0A",
  header: "#EAE3D6",
  yellow: "#FACC15",
  green: "#16803C",
  greenBg: "#E6F4EA",
  red: "#DC2626",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  stone: "#F4F1EA",
  border: "#E3DDD0",
  sub: "#5A5852",
  muted: "#9A968D",
  faint: "#A8A39A",
};
const MONO = "'Space Mono','SFMono-Regular',Menlo,Consolas,monospace";
const ARCHIVO = "'Archivo',system-ui,sans-serif";
const SANS = "'Plus Jakarta Sans',system-ui,sans-serif";

const shell = {
  margin: "0 auto",
  width: "100%",
  maxWidth: 460,
  minHeight: "100vh",
  background: C.bg,
  color: C.ink,
  fontFamily: SANS,
  display: "flex",
  flexDirection: "column",
};

function fmtTime(iso) {
  try { return new Date(iso).toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
}

// Day separator label ("BUGÜN" / "DÜN" / date).
function fmtDay(iso) {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date(); yest.setDate(today.getDate() - 1);
    const sameDay = (a, b) => a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
    if (sameDay(d, today)) return "BUGÜN";
    if (sameDay(d, yest)) return "DÜN";
    return d.toLocaleDateString("tr-TR", { day: "numeric", month: "long" }).toUpperCase();
  } catch { return ""; }
}

function dayKey(iso) {
  try { const d = new Date(iso); return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`; }
  catch { return ""; }
}

// Build initials from a name (max 2 chars).
function initials(name) {
  if (!name) return "?";
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Short HMT-style listing code derived from id.
function listingCode(id) {
  const n = String(id).replace(/\D/g, "").slice(-4).padStart(4, "0");
  return `HMT-${n}`;
}

export default function MesajlarPage({ user, listings = [], offers = [], messages = [], onSendMessage, onRequireAuth, onSeen, getContact, msgSeen = {}, blockedIds = [] }) {
  const navigate = useNavigate();
  const [selectedKey, setSelectedKey] = useState(null);
  const [text, setText] = useState("");
  const [othersTyping, setOthersTyping] = useState(false);
  const scrollRef = useRef(null);
  const endRef = useRef(null);
  const lastTypingRef = useRef(0);

  useEffect(() => { onSeen?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derive conversations from accepted offers ──
  // (Computed before any early return so the scroll effect below stays
  //  unconditional — React Hooks must run in the same order every render.)
  const conversations = !user ? [] : offers
    .filter((o) => o.status === "kabul")
    .map((o) => {
      const l = listings.find((x) => String(x.id) === String(o.listingId));
      if (!l) return null;
      const ownerSide = { id: l.ownerId, name: l.owner };
      const offerSide = { id: o.fromUserId, name: o.fromUser };
      if (user.id !== ownerSide.id && user.id !== offerSide.id) return null;
      const other = user.id === ownerSide.id ? offerSide : ownerSide;
      return { key: `${o.listingId}:${o.id}`, listingId: l.id, offerId: o.id, listingTitle: l.title, other };
    })
    .filter(Boolean)
    .filter((c) => !(blockedIds || []).map(String).includes(String(c.other.id))); // engellenenleri gizle

  const active = conversations.find((c) => c.key === selectedKey) || null;
  const otherPhone = active && getContact ? getContact(active.other.id)?.phone : null;
  // Karşı tarafın son "gördüm" zamanı — bizim mesajlarımız için okundu (çift tik) hesabı.
  const otherSeenIso = active ? (msgSeen[active.other.id] || null) : null;
  const activeListing = active ? listings.find((l) => String(l.id) === String(active.listingId)) : null;

  // "Yazıyor…" — karşı tarafın sinyalini izle (sekmeler arası localStorage simülasyonu).
  useEffect(() => {
    if (!active) return undefined;
    const check = () => setOthersTyping(isTyping(active.key, active.other.id));
    const iv = setInterval(check, 1200);
    window.addEventListener("storage", check);
    return () => { clearInterval(iv); window.removeEventListener("storage", check); setOthersTyping(false); };
  }, [active?.key, active?.other?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ben yazarken karşı tarafa sinyal gönder (boğmamak için ~900ms throttle).
  const signalTyping = () => {
    if (!active) return;
    const now = Date.now();
    if (now - lastTypingRef.current > 900) {
      lastTypingRef.current = now;
      setTyping(active.key, user.id);
    }
  };

  const threadMessages = active
    ? messages
        .filter((m) => String(m.listingId) === String(active.listingId) && String(m.offerId) === String(active.offerId))
        .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  // Scroll thread to bottom when the active conversation or its messages change.
  useEffect(() => {
    if (!active) return;
    requestAnimationFrame(() => {
      endRef.current?.scrollIntoView({ block: "end" });
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, [active?.key, threadMessages.length]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Not authenticated ── (after all hooks)
  if (!user) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="Mesajlar" />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px", gap: 16 }}>
          <Logo size="lg" />
          <h1 style={{ fontFamily: ARCHIVO, fontSize: 22, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", margin: 0 }}>Mesajlar için giriş yapın</h1>
          <p style={{ fontSize: 13.5, color: C.sub, margin: 0, lineHeight: 1.5 }}>Kabul edilen tekliflerde karşı tarafla buradan mesajlaşırsınız.</p>
          <button
            onClick={() => onRequireAuth?.()}
            style={{ marginTop: 6, cursor: "pointer", background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, fontFamily: ARCHIVO, fontSize: 14, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", padding: "13px 22px", borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" }}
          >
            Giriş yap / Kayıt ol
          </button>
        </div>
      </div>
    );
  }

  // Last message preview + unread count for a conversation row.
  const lastMessageOf = (c) => {
    const ms = messages
      .filter((m) => String(m.listingId) === String(c.listingId) && String(m.offerId) === String(c.offerId))
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (ms.length === 0) return { preview: "—", time: "" };
    const last = ms[ms.length - 1];
    const preview = last.image ? "Görsel" : (last.text || "—");
    return { preview, time: fmtTime(last.createdAt) };
  };

  const sendText = (value) => {
    const t = (value ?? text).trim();
    if (!t || !active) return;
    onSendMessage?.({
      id: newId(), listingId: active.listingId, offerId: active.offerId,
      fromId: user.id, fromName: user.name, toId: active.other.id, toName: active.other.name,
      text: t, createdAt: nowIso(),
    });
    setText("");
  };
  const send = () => sendText();

  // Görseli (dataURL) mesaj olarak gönder — hem dosya seçici hem native kamera kullanır.
  const sendImageDataUrl = (dataUrl) => {
    if (!dataUrl || !active) return;
    onSendMessage?.({
      id: newId(), listingId: active.listingId, offerId: active.offerId,
      fromId: user.id, fromName: user.name, toId: active.other.id, toName: active.other.name,
      text: "", image: dataUrl, createdAt: nowIso(),
    });
  };

  const sendImage = (e) => {
    const f = e.target.files?.[0];
    if (!f || !active) return;
    if (f.size > 1_800_000) { e.target.value = ""; return; } // ~1.8MB limit
    const reader = new FileReader();
    reader.onload = () => sendImageDataUrl(reader.result);
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  // Native'de kamera/galeri aç; web'de bu çağrı no-op döner (label dosya seçiciyi açar).
  const onPhotoButton = async (e) => {
    if (!cameraNative()) return; // web → <input type=file> devreye girer
    e.preventDefault();
    const dataUrl = await pickPhotoDataUrl();
    if (dataUrl) sendImageDataUrl(dataUrl);
  };

  // ── Thread view (active conversation) ──
  if (active) {
    return (
      <div style={{ ...shell, paddingBottom: 96 }}>
        <SEO title="Mesajlar" />

        {/* Header */}
        <div style={{ background: C.header, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, borderBottom: `2px solid ${C.ink}` }}>
          <button
            onClick={() => setSelectedKey(null)}
            aria-label="Geri"
            style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.card, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <ChevronLeft size={20} color={C.ink} strokeWidth={2.6} />
          </button>

          <div style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 6, background: C.ink, color: C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, fontFamily: ARCHIVO }}>
            {initials(active.other.name)}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{active.other.name}</span>
              <BadgeCheck size={15} color={C.green} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            </div>
            <div style={{ fontFamily: MONO, fontSize: 9.5, color: othersTyping ? C.green : C.sub, textTransform: "uppercase", letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {othersTyping
                ? "yazıyor…"
                : otherSeenIso
                  ? `son görülme ${fmtTime(otherSeenIso)}`
                  : "çevrimiçi olduğunda yanıtlar"}
            </div>
          </div>

          {otherPhone && (
            <a
              href={`tel:${otherPhone}`}
              aria-label="Ara"
              style={{ flexShrink: 0, width: 38, height: 38, borderRadius: 6, border: `2px solid ${C.ink}`, background: C.yellow, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none" }}
            >
              <Phone size={17} color={C.ink} strokeWidth={2.4} />
            </a>
          )}
        </div>

        {/* Listing context bar — hangi iş konuşuluyor (üstte sabit önizleme) */}
        <button
          onClick={() => navigate(`/ilan/${active.listingId}`)}
          style={{ display: "flex", flexDirection: "column", gap: 3, width: "100%", border: "none", borderBottom: `2px solid ${C.ink}`, cursor: "pointer", textAlign: "left", background: C.ink, color: "#fff", padding: "9px 16px" }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 8, width: "100%" }}>
            <span style={{ flex: 1, minWidth: 0, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.yellow, textTransform: "uppercase", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {listingCode(active.listingId)} · {active.listingTitle}
            </span>
            <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.yellow }}>İLANI GÖR ›</span>
          </span>
          {activeListing && (
            <span style={{ fontFamily: MONO, fontSize: 9.5, color: "rgba(255,255,255,0.7)", textTransform: "uppercase", letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {(activeListing.il || "—")} → {(activeListing.bosaltma || activeListing.varisIl || activeListing.ilce || "—")}
              {" · "}
              {activeListing.priceType === "sabit" && activeListing.price ? `₺${Number(activeListing.price).toLocaleString("tr-TR")}` : "Teklife açık"}
            </span>
          )}
        </button>

        {/* Messages */}
        <div ref={scrollRef} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, padding: "16px 14px 20px", overflowY: "auto" }}>
          {/* System message: offer accepted */}
          <div style={{ alignSelf: "center", maxWidth: "85%", background: C.greenBg, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "7px 12px", fontFamily: MONO, fontSize: 10.5, fontWeight: 700, color: C.green, textTransform: "uppercase", letterSpacing: "0.02em", textAlign: "center", display: "flex", alignItems: "center", gap: 6 }}>
            <CheckCircle2 size={13} color={C.green} strokeWidth={2.6} style={{ flexShrink: 0 }} />
            Teklif kabul edildi · İş başladı
          </div>

          {threadMessages.length === 0 ? (
            <div style={{ margin: "auto", fontFamily: MONO, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>İlk mesajı yazın</div>
          ) : (
            threadMessages.map((m, i) => {
              const mine = m.fromId === user.id;
              const prev = threadMessages[i - 1];
              const showDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
              return (
                <div key={m.id} style={{ display: "contents" }}>
                  {showDay && (
                    <div style={{ alignSelf: "center", margin: "6px 0 4px", background: C.card, border: `1.5px solid ${C.ink}`, borderRadius: 6, padding: "4px 11px", fontFamily: MONO, fontSize: 9.5, fontWeight: 700, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      {fmtDay(m.createdAt)}
                    </div>
                  )}
                  <div style={{ maxWidth: "80%", alignSelf: mine ? "flex-end" : "flex-start", display: "flex", flexDirection: "column", alignItems: mine ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        padding: m.image && !m.text ? 4 : "9px 12px",
                        fontSize: 14,
                        lineHeight: 1.4,
                        borderRadius: 6,
                        background: mine ? C.yellow : C.card,
                        color: C.ink,
                        border: `2px solid ${C.ink}`,
                        fontWeight: 500,
                      }}
                    >
                      {m.image && (
                        <img src={m.image} alt="Görsel" style={{ display: "block", maxHeight: 220, maxWidth: "100%", borderRadius: 3, objectFit: "cover", marginBottom: m.text ? 6 : 0 }} />
                      )}
                      {m.text}
                    </div>
                    <div style={{ marginTop: 3, display: "flex", alignItems: "center", gap: 4, fontFamily: MONO, fontSize: 9.5, color: C.faint, letterSpacing: "0.02em" }}>
                      {fmtTime(m.createdAt)}
                      {mine && (
                        otherSeenIso && m.createdAt <= otherSeenIso
                          ? <CheckCheck size={13} color={C.green} strokeWidth={2.6} aria-label="Okundu" />
                          : <Check size={13} color={C.faint} strokeWidth={2.6} aria-label="İletildi" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <div style={{ position: "sticky", bottom: 0, background: C.card, padding: "10px 14px 14px", borderTop: `2px solid ${C.ink}` }}>
          {/* Hızlı yanıtlar — dokununca anında gönderir */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 8 }}>
            {["Merhaba", "Fiyat nedir?", "Ne zaman uygun?", "Konum atar mısın?", "Anlaştık 👍"].map((qr) => (
              <button
                key={qr}
                onClick={() => sendText(qr)}
                style={{ flexShrink: 0, background: C.stone, border: `1.5px solid ${C.ink}`, borderRadius: 999, padding: "5px 12px", fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, cursor: "pointer", whiteSpace: "nowrap" }}
              >
                {qr}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <label
              aria-label="Fotoğraf ekle"
              onClick={onPhotoButton}
              style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 6, background: C.card, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <Plus size={20} color={C.ink} strokeWidth={2.6} />
              <input type="file" accept="image/*" onChange={sendImage} style={{ display: "none" }} />
            </label>
            <input
              value={text}
              onChange={(e) => { setText(e.target.value); signalTyping(); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder="Mesaj yaz…"
              aria-label="Mesaj"
              style={{ flex: 1, minWidth: 0, border: `2px solid ${C.ink}`, borderRadius: 6, outline: "none", background: C.card, fontFamily: MONO, fontSize: 13, color: C.ink, padding: "12px 13px", height: 44 }}
            />
            <button
              onClick={send}
              aria-label="Gönder"
              style={{ flexShrink: 0, width: 44, height: 44, borderRadius: 6, border: `2px solid ${C.ink}`, cursor: "pointer", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <Send size={18} color={C.yellow} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List view (conversations) ──
  const newCount = conversations.length;

  return (
    <div style={{ ...shell, paddingBottom: 96 }}>
      <SEO title="Mesajlar" description="Eşleşen ilanlar üzerinden karşı tarafla mesajlaşın." />

      {/* Header */}
      <div style={{ background: C.header, padding: "18px 16px 14px", borderBottom: `2px solid ${C.ink}`, display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <h1 style={{ fontFamily: ARCHIVO, fontSize: 27, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.03em", margin: 0 }}>Mesajlar</h1>
        <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.sub, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          {newCount} SOHBET
        </span>
      </div>

      {/* Body */}
      {conversations.length === 0 ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 28px", gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: 6, background: C.card, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "3px 3px 0 #0A0A0A" }}>
            <Send size={26} color={C.ink} strokeWidth={2.2} />
          </div>
          <div style={{ fontFamily: ARCHIVO, fontSize: 18, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em" }}>Henüz mesajlaşma yok</div>
          <div style={{ fontSize: 13.5, color: C.sub, lineHeight: 1.5 }}>Bir teklif kabul edildiğinde konuşma burada açılır.</div>
          <button
            onClick={() => navigate("/ilanlar")}
            style={{ marginTop: 6, cursor: "pointer", background: C.yellow, color: C.ink, border: `2px solid ${C.ink}`, fontFamily: ARCHIVO, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.02em", padding: "11px 20px", borderRadius: 6, boxShadow: "3px 3px 0 #0A0A0A" }}
          >
            İlanlara göz at
          </button>
        </div>
      ) : (
        <div style={{ padding: "12px 12px 4px", display: "flex", flexDirection: "column", gap: 9 }}>
          {conversations.map((c, i) => {
            const { preview, time } = lastMessageOf(c);
            // Alternate avatar fill: ink (yellow letters) vs stone (ink letters).
            const stoneTile = i % 3 === 2;
            return (
              <button
                key={c.key}
                onClick={() => setSelectedKey(c.key)}
                style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", textAlign: "left", border: `2px solid ${C.ink}`, cursor: "pointer", background: C.card, borderRadius: 6, padding: 11 }}
              >
                <div style={{ flexShrink: 0, width: 46, height: 46, borderRadius: 6, background: stoneTile ? C.stone : C.ink, color: stoneTile ? C.ink : C.yellow, border: `2px solid ${C.ink}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, fontFamily: ARCHIVO }}>
                  {initials(c.other.name)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, minWidth: 0 }}>
                      <span style={{ fontFamily: ARCHIVO, fontSize: 15, fontWeight: 800, letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.other.name}</span>
                      <BadgeCheck size={14} color={C.green} strokeWidth={2.6} style={{ flexShrink: 0 }} />
                    </div>
                    {time && <span style={{ flexShrink: 0, fontFamily: MONO, fontSize: 10, color: C.faint, fontWeight: 700, letterSpacing: "0.02em" }}>{time}</span>}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 8.5, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                    {listingCode(c.listingId)} · {c.listingTitle}
                  </div>
                  <div style={{ fontSize: 13, color: C.sub, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 3 }}>{preview}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
