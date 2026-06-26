// ── SAHA loading skeletons. Sharp 2px ink frame + #E3DDD0 fill + shimmer.

const C = {
  ink: "#0A0A0A",
  yellow: "#FACC15",
  bg: "#F1EDE5",
  card: "#FFFFFF",
  fill: "#E3DDD0",
  header: "#EAE3D6",
  sub: "#5A5852",
};

// Hazard stripe (yellow/ink diagonal).
const HAZARD = "repeating-linear-gradient(45deg,#0A0A0A 0 9px,#FACC15 9px 18px)";

// Single shimmering bar with a 2px ink frame and manila fill.
function Bar({ width = "100%", height = 12, frame = false, radius = 5 }) {
  return (
    <div
      className="saha-shimmer"
      style={{
        width,
        height,
        borderRadius: radius,
        background: C.fill,
        border: frame ? `2px solid ${C.ink}` : "none",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <div
      style={{
        position: "relative",
        background: C.card,
        border: `2px solid ${C.ink}`,
        borderRadius: 6,
        padding: 14,
        boxShadow: "3px 3px 0 rgba(10,10,10,.12)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* right vertical hazard strip */}
      <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: 6, background: HAZARD, opacity: 0.5 }} />
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, paddingRight: 12 }}>
        <Bar width="38%" height={14} />
        <Bar width={64} height={18} radius={4} />
      </div>
      <Bar width="78%" height={18} />
      <Bar width="52%" height={12} />
      <Bar width="100%" height={44} radius={6} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, paddingRight: 12 }}>
        <Bar width="40%" height={12} />
        <Bar width={84} height={34} frame radius={6} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div style={{ background: C.bg, minHeight: "100%", paddingBottom: 16 }}>
      {/* top hazard strip */}
      <div style={{ height: 8, background: HAZARD }} />

      {/* header skeleton: 44px black logo + grey bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 14px",
          background: C.header,
          borderBottom: `2px solid ${C.ink}`,
        }}
      >
        <div style={{ width: 44, height: 44, borderRadius: 6, background: C.ink, border: `2px solid ${C.ink}` }} />
        <Bar width={120} height={14} />
      </div>

      {/* stat 3-grid skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: "14px 14px 6px" }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              height: 58,
              borderRadius: 6,
              border: `2px solid ${C.ink}`,
              background: C.card,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 6,
              padding: "0 10px",
            }}
          >
            <Bar width="60%" height={16} />
            <Bar width="80%" height={9} />
          </div>
        ))}
      </div>

      {/* card skeletons */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: 14 }}>
        {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
      </div>

      {/* footer label */}
      <div
        style={{
          textAlign: "center",
          fontFamily: "'Space Mono',monospace",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: C.sub,
          paddingTop: 4,
        }}
      >
        Yükleniyor…
      </div>
    </div>
  );
}
