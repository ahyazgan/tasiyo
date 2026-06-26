// Çağrı kutusu — sürücüye düşen "iş çağrısı"nı tam ekran çalan modal olarak
// gösterir (Uber'in gelen istek ekranı). Global mount: App.jsx içinde durur,
// kullanıcı nerede olursa olsun çağrı düşünce belirir. Kabul/Ret + geri sayım.

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { subscribeDispatch, getActivePingForDriver, respondPing, RING_MS } from "../utils/dispatch";
import { hapticSuccess } from "../native/haptics";
import { useToast } from "../components/Toast";

const C = { ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626", card: "#FFFFFF", sub: "#5A5852", muted: "#9A968D" };
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'Archivo', system-ui, sans-serif";

export default function DispatchInbox({ user, onAccept, onReject }) {
  const navigate = useNavigate();
  const toast = useToast();
  const [ping, setPing] = useState(null);
  const [left, setLeft] = useState(0);
  const seenRef = useRef(null);

  // Bana düşen aktif çağrıya canlı abone ol.
  useEffect(() => subscribeDispatch(() => setPing(user ? getActivePingForDriver(user.id) : null)), [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Yeni çağrı gelince titreşim + bir kez bildir.
  useEffect(() => {
    if (ping && seenRef.current !== ping.id) {
      seenRef.current = ping.id;
      hapticSuccess();
    }
    if (!ping) seenRef.current = null;
  }, [ping]);

  // Geri sayım (saniye).
  useEffect(() => {
    if (!ping) return;
    const tick = () => setLeft(Math.max(0, Math.ceil((ping.createdAt + RING_MS - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [ping]);

  if (!user || !ping) return null;

  const accept = async () => {
    await onAccept?.(ping);
    toast("Çağrıyı kabul ettin — iş sevkiyatta!", "success");
    setPing(null);
    navigate("/sevkiyat");
  };
  const reject = () => {
    respondPing(ping.id, "rejected");
    onReject?.(ping);
    setPing(null);
  };

  const fixed = ping.priceType === "sabit";
  return (
    <div role="dialog" aria-label="Gelen iş çağrısı" style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(10,10,10,.72)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 14 }}>
      <div style={{ width: "100%", maxWidth: 440, background: C.card, border: `2px solid ${C.ink}`, borderRadius: 12, overflow: "hidden", boxShadow: "0 -6px 0 rgba(10,10,10,.25)", fontFamily: HEAD }}>
        {/* Üst şerit — çalıyor + geri sayım */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "11px 14px", background: C.ink }}>
          <span style={{ width: 10, height: 10, borderRadius: "50%", background: C.yellow, boxShadow: `0 0 0 4px ${C.yellow}44`, animation: "none" }} />
          <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.yellow, letterSpacing: ".05em" }}>GELEN İŞ ÇAĞRISI</span>
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: left <= 10 ? "#FCA5A5" : "#fff" }}>{left} sn</span>
        </div>

        <div style={{ padding: "14px 16px 16px" }}>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, color: C.sub }}>
            {ping.fromName || "Yük veren"} seni işe çağırıyor
          </div>
          <div style={{ fontFamily: HEAD, fontSize: 20, fontWeight: 900, textTransform: "uppercase", letterSpacing: "-.02em", lineHeight: 1.1, marginTop: 4 }}>
            {ping.jobTitle || "İş ilanı"}
          </div>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <div style={{ flex: 1, border: `2px solid ${C.muted}`, borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.muted, letterSpacing: ".06em" }}>KONUM</div>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: C.ink, marginTop: 2 }}>{ping.originIl || "—"}{Number.isFinite(ping.dist) ? ` · ${Math.round(ping.dist)} km` : ""}</div>
            </div>
            <div style={{ flex: 1, border: `2px solid ${C.muted}`, borderRadius: 6, padding: "8px 10px" }}>
              <div style={{ fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.muted, letterSpacing: ".06em" }}>{fixed ? "SABİT FİYAT" : "FİYAT"}</div>
              <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: fixed ? C.green : C.ink, marginTop: 2 }}>{fixed && ping.price ? `₺${Number(ping.price).toLocaleString("tr-TR")}` : "Teklife açık"}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button type="button" onClick={reject} style={{ flex: 1, fontFamily: HEAD, fontSize: 14, fontWeight: 800, textTransform: "uppercase", padding: "13px", borderRadius: 8, cursor: "pointer", background: C.card, color: C.red, border: `2px solid ${C.red}` }}>
              Reddet
            </button>
            <button type="button" onClick={accept} style={{ flex: 2, fontFamily: HEAD, fontSize: 15, fontWeight: 900, textTransform: "uppercase", letterSpacing: ".02em", padding: "13px", borderRadius: 8, cursor: "pointer", background: C.green, color: "#fff", border: `2px solid ${C.ink}`, boxShadow: "3px 3px 0 rgba(10,10,10,.25)" }}>
              Kabul Et →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
