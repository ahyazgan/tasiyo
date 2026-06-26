// ╔══════════════════════════════════════════════════════════════════╗
// ║  Ödeme sağlayıcı arayüzü — MOCK-first.                              ║
// ║  Anahtar yoksa ödemeyi simüle eder (gerçek POS açılmadan tüm akış   ║
// ║  çalışır). iyzico/PayTR anahtarı gelince burada gerçek çağrı yapılır║
// ║  ve üst katman (App/UI) HİÇ değişmez — Supabase desenindeki gibi.   ║
// ╚══════════════════════════════════════════════════════════════════╝

const merchantKey = import.meta.env.VITE_IYZICO_KEY || import.meta.env.VITE_PAYTR_MERCHANT_ID;
export const isPaymentConfigured = Boolean(merchantKey);

// küçük gecikme — gerçek ödeme hissi (mock)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Müteahhit ödemeyi emanete yatırır. Döner: { ok, providerRef, error }
// amount: gerçek entegrasyonda iyzico'ya gönderilecek (mock'ta kullanılmaz).
export async function chargeToEscrow({ amount, listingId, payerId }) {
  if (isPaymentConfigured) {
    // TODO: iyzico Pazaryeri "ödeme oluştur + bloke" çağrısı buraya (amount kullanılır).
    void amount;
    throw new Error("Gerçek ödeme sağlayıcı henüz bağlanmadı (anahtar var ama entegrasyon TODO).");
  }
  // MOCK: her zaman başarılı, sahte referans üret.
  await wait(700);
  const ref = "MOCK-" + listingId + "-" + String(payerId || "x").slice(0, 4);
  return { ok: true, providerRef: ref, mock: true };
}

// Teslim onayında emanetteki parayı nakliyeciye serbest bırakır.
export async function releaseFromEscrow({ providerRef, payoutTo }) {
  if (isPaymentConfigured) {
    // TODO: iyzico "onayla / alt üye işyerine aktar" çağrısı (providerRef kullanılır).
    void providerRef;
    throw new Error("Gerçek serbest bırakma henüz bağlanmadı.");
  }
  await wait(500);
  return { ok: true, mock: true, payoutTo };
}

// Anlaşmazlıkta müteahhite iade.
export async function refundEscrow({ providerRef }) {
  if (isPaymentConfigured) {
    throw new Error("Gerçek iade henüz bağlanmadı.");
  }
  await wait(500);
  return { ok: true, mock: true, providerRef };
}
