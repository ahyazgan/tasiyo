import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Filo haritası — birden çok aracı canlı gösterir (dispatch/kontrol kulesi).
// items: [{ id, label, vehicle:{lat,lng,heading}, dropoff:[lat,lng], live }]

const C = { ink: "#0A0A0A", yellow: "#FACC15", muted: "#9A968D", card: "#FFFFFF" };

function truckIcon(label, live) {
  const bg = live ? C.yellow : C.muted;
  const html = `<div style="display:flex;flex-direction:column;align-items:center;">
    <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;background:${bg};
      border:2px solid ${C.ink};border-radius:50%;box-shadow:2px 2px 0 rgba(10,10,10,.3);">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="${C.ink}" stroke-width="2.3"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/>
        <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>
    <div style="margin-top:2px;font-family:'Space Mono',monospace;font-size:8px;font-weight:700;white-space:nowrap;
      background:${C.card};color:${C.ink};border:1.5px solid ${C.ink};border-radius:3px;padding:1px 4px;">${label}</div>
  </div>`;
  return L.divIcon({ html, className: "fleet-truck", iconSize: [0, 0], iconAnchor: [0, 14] });
}

function FitAll({ points }) {
  const map = useMap();
  useEffect(() => {
    const pts = points.filter(Boolean);
    if (pts.length === 1) map.setView(pts[0], 11);
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.3), { animate: true });
  }, [map, points]);
  return null;
}

export default function FleetMap({ items = [] }) {
  const vehiclePts = items.filter((i) => i.vehicle).map((i) => [i.vehicle.lat, i.vehicle.lng]);
  const center = vehiclePts[0] || [39.3, 35.2];
  return (
    <div style={{ height: 300, borderRadius: 6, overflow: "hidden", border: `2px solid ${C.ink}` }}>
      <MapContainer center={center} zoom={6} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {items.map((i) => i.vehicle && (
          <Marker key={i.id} position={[i.vehicle.lat, i.vehicle.lng]} icon={truckIcon(i.label, i.live)} />
        ))}
        <FitAll points={vehiclePts} />
      </MapContainer>
    </div>
  );
}
