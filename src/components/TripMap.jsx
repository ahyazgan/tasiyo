import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ── Canlı sefer haritası — yükleme/boşaltma + araç (canlı) + iz.
// pickup/dropoff: [lat,lng] · vehicle: {lat,lng,heading} · trail: [{lat,lng}]

const C = { ink: "#0A0A0A", yellow: "#FACC15", green: "#16803C", card: "#FFFFFF" };
const MONO = "'Space Mono', ui-monospace, monospace";

function pinIcon(label, bg, fg) {
  const html = `<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-2px);">
    <div style="font-family:${MONO};font-size:9px;font-weight:700;padding:2px 6px;background:${bg};color:${fg};
      border:2px solid ${C.ink};border-radius:5px;box-shadow:1px 1px 0 rgba(10,10,10,.3);white-space:nowrap;">${label}</div>
    <div style="width:0;height:0;border-left:4px solid transparent;border-right:4px solid transparent;border-top:6px solid ${C.ink};"></div>
  </div>`;
  return L.divIcon({ html, className: "trip-pin", iconSize: [0, 0], iconAnchor: [0, 22] });
}

function truckIcon(heading) {
  const rot = typeof heading === "number" ? heading : 0;
  const html = `<div style="width:30px;height:30px;display:flex;align-items:center;justify-content:center;
      background:${C.yellow};border:2px solid ${C.ink};border-radius:50%;box-shadow:2px 2px 0 rgba(10,10,10,.3);">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="${C.ink}" stroke-width="2.3"
        stroke-linecap="round" stroke-linejoin="round" style="transform:rotate(${rot}deg);">
        <path d="M10 17h4V5H2v12h3M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h1"/>
        <circle cx="7.5" cy="17.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg></div>`;
  return L.divIcon({ html, className: "trip-truck", iconSize: [30, 30], iconAnchor: [15, 15] });
}

function FitBounds({ points }) {
  const map = useMap();
  useEffect(() => {
    const pts = points.filter(Boolean);
    if (pts.length === 1) map.setView(pts[0], 12);
    else if (pts.length > 1) map.fitBounds(L.latLngBounds(pts).pad(0.25), { animate: true });
  }, [map, points]);
  return null;
}

export default function TripMap({ pickup, dropoff, vehicle, trail = [], routeCoords = null }) {
  const v = vehicle ? [vehicle.lat, vehicle.lng] : null;
  const trailPts = trail.map((p) => [p.lat, p.lng]);
  const center = v || pickup || dropoff || [39.3, 35.2];

  return (
    <div style={{ height: 280, borderRadius: 6, overflow: "hidden", border: `2px solid ${C.ink}` }}>
      <MapContainer center={center} zoom={11} scrollWheelZoom={false} zoomControl={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {/* Gerçek yol rotası (varsa) — yoksa düz çizgi yedeği */}
        {routeCoords && routeCoords.length > 1 ? (
          <Polyline positions={routeCoords} pathOptions={{ color: C.ink, weight: 3, opacity: 0.55 }} />
        ) : (
          pickup && dropoff && <Polyline positions={[pickup, dropoff]} pathOptions={{ color: C.ink, weight: 2, dashArray: "6 6", opacity: 0.5 }} />
        )}
        {trailPts.length > 1 && <Polyline positions={trailPts} pathOptions={{ color: C.yellow, weight: 4 }} />}
        {pickup && <Marker position={pickup} icon={pinIcon("YÜKLEME", C.ink, C.yellow)} />}
        {dropoff && <Marker position={dropoff} icon={pinIcon("BOŞALTMA", C.card, C.ink)} />}
        {v && <Marker position={v} icon={truckIcon(vehicle.heading)} />}
        <FitBounds points={[pickup, dropoff, v]} />
      </MapContainer>
    </div>
  );
}
