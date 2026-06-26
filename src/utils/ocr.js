// ╔══════════════════════════════════════════════════════════════════╗
// ║  Kantar fişi OCR — fotoğraftan tonaj/sayı okuma (tesseract.js).     ║
// ║  Ağır; yalnızca kullanıcı tetikleyince lazy yüklenir. Çevrimdışı/   ║
// ║  hata durumunda { ok:false } döner. Sonuç DAİMA kullanıcı onaylı.   ║
// ╚══════════════════════════════════════════════════════════════════╝

// dataUrl: kantar fişi fotoğrafı · unit: "ton" | "m³" | …
// Dönüş: { ok, text, numbers:[], best: number|null }
export async function readWeighTicket(dataUrl, unit = "ton") {
  if (!dataUrl) return { ok: false };
  try {
    const Tesseract = (await import("tesseract.js")).default;
    const { data } = await Tesseract.recognize(dataUrl, "eng");
    const text = data?.text || "";

    // Metindeki sayıları topla (1.234,56 / 1,234.56 / 24500 biçimlerini normalize et).
    const raw = text.match(/\d[\d.,]*\d|\d/g) || [];
    const numbers = raw
      .map((s) => {
        let t = s.replace(/\.(?=\d{3}\b)/g, "").replace(/,(?=\d{3}\b)/g, ""); // binlik ayraçları sil
        t = t.replace(",", ".");
        const n = parseFloat(t);
        return Number.isFinite(n) ? n : null;
      })
      .filter((n) => n != null && n > 0);

    // En olası net yük tahmini:
    // - kg ölçeğindeki (1.000–60.000) en büyük sayı → ton için /1000
    // - yoksa makul ton aralığındaki (3–60) en büyük sayı
    let best = null;
    const kgLike = numbers.filter((n) => n >= 1000 && n <= 60000);
    const tonLike = numbers.filter((n) => n >= 3 && n <= 60);
    if (unit === "ton") {
      if (kgLike.length) best = Math.round((Math.max(...kgLike) / 1000) * 10) / 10;
      else if (tonLike.length) best = Math.max(...tonLike);
    } else {
      if (tonLike.length) best = Math.max(...tonLike);
      else if (kgLike.length) best = Math.round((Math.max(...kgLike) / 1000) * 10) / 10;
    }

    return { ok: true, text, numbers, best };
  } catch {
    return { ok: false };
  }
}
