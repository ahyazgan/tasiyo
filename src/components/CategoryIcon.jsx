import DumpTruckIcon from "./icons/DumpTruckIcon";
import SilobasIcon from "./icons/SilobasIcon";

export default function CategoryIcon({ catId, size = 24, className = "", fallback = null }) {
  const normalizedId = String(catId || "").trim().toLowerCase();

  if (normalizedId === "hafriyat") {
    return <DumpTruckIcon size={size} className={className} />;
  }
  if (normalizedId === "silobas") {
    return <SilobasIcon size={size} className={className} />;
  }

  return <span className={className}>{fallback}</span>;
}
