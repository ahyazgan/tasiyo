// YÜKLET — Fiyat Simülatörü — SAHA marka dili.
// Tüm Akıllı Fiyat motorunu canlı sergiler: kategori/malzeme/güzergah/miktar/
// aciliyet değiştir → anlık önerilen fiyat + "Fiyat neden bu?" dökümü + güven.

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, SlidersHorizontal, TrendingUp, TrendingDown, Check, Zap, Repeat } from "lucide-react";
import { CATS, MATERIALS, UNITS, IL_LIST } from "../data/categories";
import { LISTINGS } from "../data/listings";
import { estimatePrice, fmtTL } from "../utils/priceEstimate";
import { loadListings, loadOffers, loadPricingConfig } from "../utils/storage";
import SEO from "../components/SEO";

const C = {
  ink: "#0A0A0A", header: "#EAE3D6", yellow: "#FACC15", yellowDeep: "#8A6D00",
  green: "#16803C", red: "#DC2626", bg: "#F1EDE5", card: "#FFFFFF", stone: "#F4F1EA",
  border: "#E3DDD0", line: "#F0ECE3", sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif";
const ARCH = "'Archivo', sans-serif";
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

const shell = { margin: "0 auto", width: "100%", maxWidth: 460, minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: SANS, paddingBottom: 96 };
const microLabel = { display: "block", fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.sub, marginBottom: 6 };
const fieldBox = { width: "100%", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "11px 12px", fontSize: 14, fontWeight: 600, color: C.ink, outline: "none", fontFamily: SANS, boxSizing: "border-box" };
const selectBox = { ...fieldBox, appearance: "none", WebkitAppearance: "none", paddingRight: 34 };

function Select({ value, onChange, children }) {
  return (
    <div style={{ position: "relative" }}>
      <select style={selectBox} value={value} onChange={onChange}>{children}</select>
      <ChevronDown size={16} color={C.ink} style={{ position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
    </div>
  );
}

export default function FiyatSimulasyonuPage() {
  const navigate = useNavigate();
  const history = useMemo(() => ({ listings: [...loadListings(), ...LISTINGS], offers: loadOffers() }), []);
  const config = useMemo(() => loadPricingConfig(), []);

  const [cat, setCat] = useState("hafriyat");
  const [material, setMaterial] = useState("");
  const [fromIl, setFromIl] = useState("İstanbul");
  const [toIl, setToIl] = useState("Kocaeli");
  const [amount, setAmount] = useState(200);
  const [unit, setUnit] = useState("ton");
  const [urgent, setUrgent] = useState(false);
  const [recurring, setRecurring] = useState(false);

  const materials = MATERIALS[cat] || [];
  const est = useMemo(
    () => estimatePrice({ cat, material, amount: Number(amount), unit, fromIl, toIl, dateText: urgent ? "Acil" : "", recurring, history, config }),
    [cat, material, amount, unit, fromIl, toIl, urgent, recurring, history, config]
  );

  const setCatReset = (c) => { setCat(c); setMaterial(""); };

  return (
    <div style={shell}>
      <SEO title="Fiyat Simülatörü" description="Taşıma fiyatını canlı hesapla — YÜKLET Akıllı Fiyat motoru." />

      {/* AppBar */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: C.header, borderBottom: `2px solid ${C.ink}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
          <button onClick={() => navigate(-1)} aria-label="Geri"
            style={{ width: 38, height: 38, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, color: C.ink, cursor: "pointer" }}>
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
          <h1 style={{ flex: 1, margin: 0, fontFamily: ARCH, fontSize: 17, fontWeight: 900, letterSpacing: "-0.01em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 8 }}>
            <SlidersHorizontal size={17} strokeWidth={2.6} /> Fiyat Simülatörü
          </h1>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: 16 }}>

        {/* ── CANLI SONUÇ — koyu blok + hazard ── */}
        <div style={{ position: "relative", overflow: "hidden", background: C.ink, border: `2px solid ${C.ink}`, borderRadius: 6, padding: 16, boxShadow: "4px 4px 0 rgba(10,10,10,.18)" }}>
          <span style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 8, backgroundImage: HAZARD }} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <span style={{ ...microLabel, color: "#9A988E", margin: 0 }}>ÖNERİLEN FİYAT</span>
            {est && <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: C.ink, background: C.yellow, borderRadius: 4, padding: "2px 7px" }}>GÜVEN: {est.confidence}</span>}
          </div>
          <div style={{ fontFamily: MONO, fontSize: 34, fontWeight: 700, color: "#fff", marginTop: 4, lineHeight: 1 }}>{est ? fmtTL(est.mid) : "—"}</div>
          {est && (
            <div style={{ fontFamily: MONO, fontSize: 10.5, color: "#9A988E", marginTop: 7 }}>
              Aralık {fmtTL(est.min)} – {fmtTL(est.max)} · ~{est.km} km · {est.trips > 1 ? `${est.trips} sefer` : "tek sefer"}
              {est.dataDriven ? ` · ${est.sampleSize} benzer işten` : " · sezgisel tahmin"}
            </div>
          )}
          {est && (est.laneCalibrated || est.laneSettled > 0 || (est.supplyDemand && est.supplyDemand.tone !== "ok")) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
              {est.laneSettled > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(74,222,128,0.18)", border: "1.5px solid #4ADE80", borderRadius: 5, padding: "3px 8px", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  <Check size={11} color="#4ADE80" strokeWidth={3} /> {est.laneSettled} GERÇEKLEŞEN SEFER
                </span>
              )}
              {est.laneCalibrated && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "rgba(74,222,128,0.12)", border: "1.5px solid #4ADE80", borderRadius: 5, padding: "3px 8px", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  <Check size={11} color="#4ADE80" strokeWidth={3} /> GÜZERGAH KALİBRELİ ({est.laneSamples})
                </span>
              )}
              {est.supplyDemand && est.supplyDemand.tone !== "ok" && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, border: `1.5px solid ${est.supplyDemand.tone === "up" ? "#F59E0B" : "#4ADE80"}`, borderRadius: 5, padding: "3px 8px", fontFamily: MONO, fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  {est.supplyDemand.tone === "up" ? <TrendingUp size={11} color="#F59E0B" /> : <TrendingDown size={11} color="#4ADE80" />}
                  {est.supplyDemand.label.toUpperCase()}
                </span>
              )}
            </div>
          )}

          {/* döküm — her zaman açık */}
          {est?.breakdown?.length > 0 && (
            <div style={{ marginTop: 13, borderTop: "1.5px solid #2A2A2A", paddingTop: 11, display: "flex", flexDirection: "column", gap: 6 }}>
              {est.breakdown.map((b) => (
                <div key={b.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <span style={{ fontFamily: MONO, fontSize: 10.5, color: "#C9C6BD" }}>{b.label}</span>
                  <span style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, color: b.value < 0 ? "#4ADE80" : "#fff", whiteSpace: "nowrap" }}>
                    {b.value < 0 ? "−" : "+"}{fmtTL(Math.abs(b.value))}
                  </span>
                </div>
              ))}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderTop: "1.5px solid #2A2A2A", paddingTop: 7, marginTop: 1 }}>
                <span style={{ fontFamily: ARCH, fontSize: 11.5, fontWeight: 800, textTransform: "uppercase", color: C.yellow }}>Önerilen</span>
                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700, color: "#fff" }}>{fmtTL(est.mid)}</span>
              </div>
            </div>
          )}
        </div>

        {/* ── KONTROLLER ── */}
        {/* kategori */}
        <div style={{ display: "flex", gap: 10 }}>
          {CATS.map((c) => {
            const active = cat === c.id;
            return (
              <button key={c.id} onClick={() => setCatReset(c.id)}
                style={{ flex: 1, cursor: "pointer", padding: "12px 8px", borderRadius: 6, border: `2px solid ${C.ink}`,
                  background: active ? C.ink : C.card, color: active ? C.yellow : C.ink,
                  fontFamily: ARCH, fontSize: 13, fontWeight: 900, textTransform: "uppercase",
                  boxShadow: active ? "3px 3px 0 #0A0A0A" : "none" }}>
                {c.name}
              </button>
            );
          })}
        </div>

        {/* malzeme chips */}
        <div>
          <label style={microLabel}>Malzeme</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {materials.map((m) => {
              const active = material === m;
              return (
                <button key={m} onClick={() => setMaterial(active ? "" : m)}
                  style={{ fontFamily: MONO, fontSize: 11, fontWeight: 700, padding: "6px 11px", borderRadius: 5, cursor: "pointer",
                    background: active ? C.yellow : C.card, border: `2px solid ${C.ink}`, color: C.ink, boxShadow: active ? "2px 2px 0 #0A0A0A" : "none" }}>
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {/* güzergah */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={microLabel}>Yükleme ili</label>
            <Select value={fromIl} onChange={(e) => setFromIl(e.target.value)}>
              {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
          </div>
          <div>
            <label style={microLabel}>Varış ili</label>
            <Select value={toIl} onChange={(e) => setToIl(e.target.value)}>
              {IL_LIST.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
          </div>
        </div>

        {/* miktar slider + birim */}
        <div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <label style={microLabel}>Miktar</label>
            <span style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700 }}>{amount} {unit}</span>
          </div>
          <input type="range" min="10" max="2000" step="10" value={amount} onChange={(e) => setAmount(Number(e.target.value))}
            style={{ width: "100%", accentColor: C.ink, margin: "4px 0 8px" }} />
          <div style={{ display: "flex", gap: 7 }}>
            {UNITS.slice(0, 4).map((u) => (
              <button key={u} onClick={() => setUnit(u)}
                style={{ flex: 1, cursor: "pointer", padding: "7px 0", borderRadius: 5, border: `2px solid ${unit === u ? C.ink : C.border}`,
                  background: unit === u ? C.yellow : C.card, fontFamily: MONO, fontSize: 11, fontWeight: 700, color: C.ink, textTransform: "uppercase" }}>
                {u}
              </button>
            ))}
          </div>
        </div>

        {/* aciliyet + düzenli */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => { setUrgent((v) => !v); if (!urgent) setRecurring(false); }}
            style={{ flex: 1, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 8px", borderRadius: 6, border: `2px solid ${C.ink}`,
              background: urgent ? C.red : C.card, color: urgent ? "#fff" : C.ink, fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase" }}>
            <Zap size={15} /> Acil
          </button>
          <button onClick={() => { setRecurring((v) => !v); if (!recurring) setUrgent(false); }}
            style={{ flex: 1, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, padding: "12px 8px", borderRadius: 6, border: `2px solid ${C.ink}`,
              background: recurring ? C.green : C.card, color: recurring ? "#fff" : C.ink, fontFamily: ARCH, fontSize: 12.5, fontWeight: 800, textTransform: "uppercase" }}>
            <Repeat size={15} /> Düzenli
          </button>
        </div>

        <p style={{ fontFamily: MONO, fontSize: 10, color: C.muted, lineHeight: 1.5, textAlign: "center", margin: "2px 0 0" }}>
          Değerleri değiştirdikçe fiyat ve döküm anında güncellenir. Tahmin bağlayıcı değildir.
        </p>
      </div>
    </div>
  );
}
