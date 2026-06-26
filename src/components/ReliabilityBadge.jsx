import { ShieldCheck } from "lucide-react";
import { reliabilityTier } from "../utils/reliability";

// ── Güvenilirlik rozeti (kompakt) — skor + etiket. data: computeReliability çıktısı.
const MONO = "'Space Mono', ui-monospace, monospace";

export default function ReliabilityBadge({ data, size = "sm" }) {
  if (!data || data.score == null) return null;
  const tier = reliabilityTier(data.score);
  const fs = size === "lg" ? 12 : 9.5;
  const icon = size === "lg" ? 14 : 12;
  return (
    <span
      title={`Güvenilirlik %${data.score} · ${data.jobsDone} iş`}
      style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: MONO, fontSize: fs, fontWeight: 700, color: "#0A0A0A", background: "#fff", border: `2px solid #0A0A0A`, borderRadius: 5, padding: size === "lg" ? "4px 9px" : "2px 7px", whiteSpace: "nowrap" }}
    >
      <ShieldCheck size={icon} strokeWidth={2.5} color={tier.color} />
      %{data.score}
      <span style={{ color: tier.color, textTransform: "uppercase", letterSpacing: "0.02em" }}>{tier.label}</span>
    </span>
  );
}
