// ╔══════════════════════════════════════════════════════════════════╗
// ║  SMS doğrulama sağlayıcı — MOCK-first.                              ║
// ║  Anahtar yoksa 6 haneli kodu üretir ve ekranda gösterir (gerçek SMS ║
// ║  yerine). Netgsm/Twilio anahtarı gelince burada gerçek gönderim     ║
// ║  yapılır; üst katman (ProfilPage) değişmez. Supabase deseni.        ║
// ╚══════════════════════════════════════════════════════════════════╝

const smsKey = import.meta.env.VITE_NETGSM_KEY || import.meta.env.VITE_TWILIO_SID;
export const isSmsConfigured = Boolean(smsKey);

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Telefon numarasını sadeleştir: rakamlar, başında 0 ise at, 90 ekle.
export function normalizePhone(raw) {
  let d = String(raw || "").replace(/\D/g, "");
  if (d.startsWith("90")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  return d; // 5XXXXXXXXX (10 hane)
}
export const isValidPhone = (raw) => /^5\d{9}$/.test(normalizePhone(raw));

// Telefon + seed'den deterministik 6 haneli kod (Math.random kullanmadan).
// Mock'ta kullanıcıya gösterilir; gerçekte sunucu üretip SMS atar, dönmez.
function codeFor(phone) {
  const d = normalizePhone(phone);
  let h = 0;
  for (let i = 0; i < d.length; i++) h = (h * 33 + d.charCodeAt(i)) >>> 0;
  return String((h % 900000) + 100000); // 100000–999999
}

// Kodu "gönderir". Mock'ta kodu döndürür (UI gösterir); gerçekte döndürmez.
export async function sendSmsCode(phone) {
  if (!isValidPhone(phone)) return { ok: false, error: "Geçerli bir cep numarası gir (5XX XXX XX XX)." };
  if (isSmsConfigured) {
    // TODO: Netgsm/Twilio "SMS gönder" çağrısı. Kod sunucuda saklanır, döndürülmez.
    throw new Error("Gerçek SMS sağlayıcı henüz bağlanmadı (anahtar var ama entegrasyon TODO).");
  }
  await wait(500);
  return { ok: true, mock: true, code: codeFor(phone) };
}

// Girilen kodu doğrular. Mock'ta deterministik kodla karşılaştırır.
export async function verifySmsCode(phone, entered) {
  if (isSmsConfigured) {
    throw new Error("Gerçek SMS doğrulama henüz bağlanmadı.");
  }
  await wait(300);
  const ok = String(entered).trim() === codeFor(phone);
  return ok ? { ok: true, mock: true } : { ok: false, error: "Kod hatalı. Tekrar dene." };
}
