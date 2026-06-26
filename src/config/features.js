// Özellik bayrakları — yayın öncesi geçici kapatmalar tek yerden yönetilir.
//
// PAYMENTS_ENABLED: Ödeme / emanet (escrow) / cüzdan / komisyon yüzeyi.
// App Store & Google Play ilk sürümü "ilan + teklif + iletişim + anlaşma" modeli
// ile çıkıyor; para taraflar arasında (havale/elden). Ödeme altyapısı kodda DURUYOR
// (payments.js, paymentProvider.js, CuzdanPage.jsx silinmedi) — lisans/şirket hazır
// olunca bu bayrağı true yapmak yeterli, hiçbir şey yeniden yazılmaz.
export const PAYMENTS_ENABLED = false;
