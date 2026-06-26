// ╔══════════════════════════════════════════════════════════════════╗
// ║  Sefer kâr hesabı — nakliyeci için: fiyat - yakıt = net kâr.        ║
// ║  Yakıt: gidiş-dönüş mesafe × tüketim × ₺/L. Tamamen yerel.         ║
// ╚══════════════════════════════════════════════════════════════════╝

export const DEFAULT_FUEL_PRICE = 43;    // ₺/L motorin (güncellenebilir)
export const DEFAULT_CONSUMPTION = 32;   // L/100km (gidiş-dönüş ortalaması)

// Araç tipine göre yaklaşık tüketim (L/100km, dolu/boş ortalaması).
export function vehicleConsumption(vehicle = "") {
  const v = String(vehicle).toLocaleLowerCase("tr");
  if (v.includes("tır") || v.includes("tir")) return 34;
  if (v.includes("damper")) return 33;
  if (v.includes("silobas")) return 30;
  if (v.includes("kamyonet")) return 16;
  if (v.includes("kamyon")) return 28;
  return DEFAULT_CONSUMPTION;
}

// { distance, liters, fuelCost, net, margin }
export function tripProfit({ price = 0, km = 0, consumption = DEFAULT_CONSUMPTION, fuelPrice = DEFAULT_FUEL_PRICE, roundTrip = true, otherCost = 0 }) {
  const distance = roundTrip ? km * 2 : km;       // dolu gidiş + boş dönüş
  const liters = (distance * consumption) / 100;
  const fuelCost = liters * fuelPrice;
  const net = (Number(price) || 0) - fuelCost - (Number(otherCost) || 0);
  const margin = price > 0 ? net / price : 0;
  return { distance, liters, fuelCost, net, margin };
}
