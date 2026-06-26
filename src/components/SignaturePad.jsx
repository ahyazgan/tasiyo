import { useRef, useEffect, useState } from "react";

// ── Parmakla imza alanı (canvas) — teslim kanıtı için.
// Çizim bitince onChange(dataUrl) çağrılır; "Temizle" sıfırlar.

const INK = "#0A0A0A";

export default function SignaturePad({ onChange, height = 150 }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  // Canvas'ı kapsayıcı genişliğine göre ölçekle (retina net).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    canvas.width = w * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
  }, [height]);

  const pos = (e) => {
    const r = canvasRef.current.getBoundingClientRect();
    const t = e.touches ? e.touches[0] : e;
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
    if (!hasInk) setHasInk(true);
  };
  const end = () => {
    if (!drawing.current) return;
    drawing.current = false;
    if (hasInk) onChange?.(canvasRef.current.toDataURL("image/png"));
  };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div>
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height, background: "#fff", border: `2px solid ${INK}`, borderRadius: 6, touchAction: "none", display: "block" }}
        onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
        onTouchStart={start} onTouchMove={move} onTouchEnd={end}
      />
      <button type="button" onClick={clear} style={{ marginTop: 6, background: "transparent", border: "none", color: "#9A968D", fontFamily: "'Space Mono', monospace", fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer", padding: 0 }}>
        Temizle
      </button>
    </div>
  );
}
