// ── Yıldız: gösterim + giriş (puanlama). SAHA paleti (ham.* token).

export function StarsDisplay({ value = 0, count, className = "text-sm" }) {
  const full = Math.round(value || 0);
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="tracking-tight text-ham-yellow">{"★".repeat(full)}{"☆".repeat(Math.max(0, 5 - full))}</span>
      {value ? <span className="font-bold text-ham-ink">{Number(value).toFixed(1)}</span> : null}
      {count != null && <span className="text-ham-muted">({count})</span>}
    </span>
  );
}

export function StarsInput({ value = 0, onChange }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} yıldız`}
          className={`text-3xl leading-none transition ${n <= value ? "text-ham-yellow" : "text-ham-faint"}`}>★</button>
      ))}
    </div>
  );
}
