import { useState } from "react";
import { Fuel, ChevronDown } from "lucide-react";
import { tripProfit, vehicleConsumption, DEFAULT_FUEL_PRICE } from "../utils/profit";

// ── Sefer Kâr Hesabı (nakliyeci) — fiyat − yakıt = net kâr. Açılır kart.
// basePrice: işin fiyatı/tahmini · km: tek yön mesafe · vehicle: tüketim için.

const C = {
  ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", red: "#DC2626",
  card: "#FFFFFF", stone: "#F4F1EA", border: "#E3DDD0", sub: "#5A5852", muted: "#9A968D",
};
const MONO = "'Space Mono', ui-monospace, monospace";
const HEAD = "'Archivo', system-ui, sans-serif";
const fmt = (n) => "₺" + Math.round(n || 0).toLocaleString("tr-TR");

const inp = { width: "100%", boxSizing: "border-box", background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, padding: "9px 10px", fontFamily: MONO, fontSize: 14, fontWeight: 700, color: C.ink, outline: "none" };
const lbl = { display: "block", fontFamily: MONO, fontSize: 8.5, fontWeight: 700, color: C.sub, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 };

export default function ProfitCalc({ basePrice = 0, km = 0, vehicle = "" }) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(basePrice ? String(Math.round(basePrice)) : "");
  const [fuelPrice, setFuelPrice] = useState(String(DEFAULT_FUEL_PRICE));
  const [consumption, setConsumption] = useState(String(vehicleConsumption(vehicle)));

  const r = tripProfit({
    price: Number(price) || 0, km: Number(km) || 0,
    consumption: Number(consumption) || 32, fuelPrice: Number(fuelPrice) || 0,
  });
  const netColor = r.net > 0 ? C.green : C.red;

  return (
    <div style={{ background: C.card, border: `2px solid ${C.ink}`, borderRadius: 6, overflow: "hidden" }}>
      <button onClick={() => setOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 9, width: "100%", background: C.stone, border: "none", borderBottom: open ? `2px solid ${C.ink}` : "none", padding: "11px 13px", cursor: "pointer", textAlign: "left" }}>
        <Fuel size={16} strokeWidth={2.4} color={C.ink} />
        <span style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "-0.01em", color: C.ink }}>Sefer Kâr Hesabı</span>
        {!open && Number(price) > 0 && (
          <span style={{ marginLeft: "auto", fontFamily: MONO, fontSize: 12, fontWeight: 700, color: netColor }}>{r.net >= 0 ? "" : "−"}{fmt(Math.abs(r.net))} net</span>
        )}
        <ChevronDown size={17} color={C.ink} style={{ marginLeft: open ? "auto" : 8, transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>

      {open && (
        <div style={{ padding: 13 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 12 }}>
            <div>
              <label style={lbl}>Sefer ücreti ₺</label>
              <input value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" placeholder="0" style={inp} />
            </div>
            <div>
              <label style={lbl}>Yakıt ₺/L</label>
              <input value={fuelPrice} onChange={(e) => setFuelPrice(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" style={inp} />
            </div>
            <div>
              <label style={lbl}>Tüketim L/100</label>
              <input value={consumption} onChange={(e) => setConsumption(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" style={inp} />
            </div>
          </div>

          {[
            ["Mesafe (gidiş-dönüş)", `${Math.round(r.distance)} km`],
            ["Yakıt", `${Math.round(r.liters)} L · ${fmt(r.fuelCost)}`],
          ].map(([k, v]) => (
            <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderTop: `1px solid ${C.border}`, fontFamily: MONO, fontSize: 12 }}>
              <span style={{ color: C.sub }}>{k}</span>
              <span style={{ fontWeight: 700, color: C.ink }}>{v}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0 2px", borderTop: `2px solid ${C.ink}`, marginTop: 4 }}>
            <span style={{ fontFamily: HEAD, fontSize: 13, fontWeight: 900, textTransform: "uppercase", color: C.ink }}>Net Kâr</span>
            <span style={{ textAlign: "right" }}>
              <span style={{ display: "block", fontFamily: MONO, fontSize: 20, fontWeight: 700, color: netColor, lineHeight: 1 }}>{r.net >= 0 ? "" : "−"}{fmt(Math.abs(r.net))}</span>
              {Number(price) > 0 && <span style={{ fontFamily: MONO, fontSize: 9.5, color: C.muted }}>marj %{Math.round(r.margin * 100)}</span>}
            </span>
          </div>
          <p style={{ margin: "10px 0 0", fontFamily: MONO, fontSize: 9, color: C.muted, lineHeight: 1.5 }}>
            Yalnızca yakıt baz alınır (gidiş-dönüş). Lastik, bakım, yemek, köprü/otoyol hariç.
          </p>
        </div>
      )}
    </div>
  );
}
