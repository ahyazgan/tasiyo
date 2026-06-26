// ╔══════════════════════════════════════════════════════════════════╗
// ║  e-Belge entegratörü — MOCK-first.                                 ║
// ║  Anahtar yoksa GİB gönderimini simüle eder (resmi entegratör       ║
// ║  açılmadan tüm akış çalışır). Nilvera/Paraşüt/Foriba anahtarı       ║
// ║  gelince burada gerçek API çağrısı yapılır; üst katman değişmez.    ║
// ╚══════════════════════════════════════════════════════════════════╝

const integratorKey =
  import.meta.env.VITE_NILVERA_KEY ||
  import.meta.env.VITE_PARASUT_TOKEN ||
  import.meta.env.VITE_EINVOICE_KEY;

export const isEInvoiceConfigured = Boolean(integratorKey);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Belgeyi GİB'e gönderir (e-İrsaliye veya e-Fatura). Döner: { ok, ettn, status }
export async function sendToGib(doc) {
  if (isEInvoiceConfigured) {
    // TODO: Nilvera/Paraşüt "belge oluştur + GİB'e gönder" çağrısı buraya.
    throw new Error("Gerçek e-belge entegratörü henüz bağlanmadı (anahtar var ama entegrasyon TODO).");
  }
  // MOCK: GİB'e gönderildi say, belgedeki ETTN'i onaylı döndür.
  await wait(600);
  return { ok: true, ettn: doc.ettn, status: "GIB_ONAYLI", mock: true };
}
