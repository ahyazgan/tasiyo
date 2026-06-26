import { supabase } from "./supabase";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  YÜKLET — Supabase veri katmani (asenkron).                        ║
// ║  DB snake_case <-> app camelCase donusumu burada yapilir; boylece  ║
// ║  sayfalarin kullandigi veri sekli (l.dateText, o.fromUser...) ayni ║
// ║  kalir. App.jsx bu fonksiyonlari kullanacak (cutover sonraki adim).║
// ╚══════════════════════════════════════════════════════════════════╝

// ── Mapper'lar ──────────────────────────────────────────────
const rowToListing = (r) => ({
  id: r.id, type: r.type, cat: r.cat, title: r.title,
  il: r.il, ilce: r.ilce, varisIl: r.varis_il, yukleme: r.yukleme, bosaltma: r.bosaltma,
  material: r.material, amount: r.amount, unit: r.unit,
  dateText: r.date_text, recurring: r.recurring, recurringText: r.recurring_text,
  vehicle: r.vehicle, capacity: r.capacity,
  priceType: r.price_type, price: r.price, desc: r.description,
  owner: r.owner_name, ownerId: r.owner_id, ownerVerified: r.owner_verified, ownerRating: r.owner_rating,
  status: r.status, offers: r.offers_count, createdText: r.created_text, createdAt: r.created_at,
  km: r.km, pickup: r.pickup, dropoff: r.dropoff, phase: r.phase, tripsDone: r.trips_done,
  paymentStatus: r.payment_status, paymentAmount: r.payment_amount, paymentFee: r.payment_fee, paymentRef: r.payment_ref,
  deliveryProof: r.delivery_proof, cycleStage: r.cycle_stage, arrivedAt: r.arrived_at,
  earlyPaid: r.early_paid, earlyPayFee: r.early_pay_fee, acceptedById: r.accepted_by_id,
  // urun (tedarikci) ilan alanlari
  stock: r.stock, stockText: r.stock_text, deliveryIncluded: r.delivery_included,
  priceUnit: r.price_unit, delivered: r.delivered,
});

const listingToRow = (l) => ({
  type: l.type, cat: l.cat, title: l.title, il: l.il, ilce: l.ilce, varis_il: l.varisIl ?? null,
  yukleme: l.yukleme, bosaltma: l.bosaltma, material: l.material,
  amount: l.amount ?? 0, unit: l.unit, date_text: l.dateText,
  recurring: l.recurring ?? false, recurring_text: l.recurringText ?? "",
  vehicle: l.vehicle ?? null, capacity: l.capacity ?? null,
  price_type: l.priceType, price: l.price ?? null, description: l.desc ?? "",
  km: l.km ?? null, pickup: l.pickup ?? null, dropoff: l.dropoff ?? null,
  stock: l.stock ?? null, stock_text: l.stockText ?? null,
  delivery_included: l.deliveryIncluded ?? false, price_unit: l.priceUnit ?? null,
});

// camelCase patch -> snake_case (listing guncelleme)
const LISTING_KEYMAP = {
  title: "title", il: "il", ilce: "ilce", varisIl: "varis_il", yukleme: "yukleme", bosaltma: "bosaltma",
  material: "material", amount: "amount", unit: "unit", dateText: "date_text",
  recurring: "recurring", recurringText: "recurring_text", vehicle: "vehicle",
  capacity: "capacity", priceType: "price_type", price: "price", desc: "description",
  status: "status", createdText: "created_text", type: "type", cat: "cat",
  km: "km", pickup: "pickup", dropoff: "dropoff", phase: "phase", tripsDone: "trips_done",
  paymentStatus: "payment_status", paymentAmount: "payment_amount", paymentFee: "payment_fee", paymentRef: "payment_ref",
  deliveryProof: "delivery_proof", cycleStage: "cycle_stage", arrivedAt: "arrived_at",
  earlyPaid: "early_paid", earlyPayFee: "early_pay_fee", acceptedById: "accepted_by_id",
  stock: "stock", stockText: "stock_text", deliveryIncluded: "delivery_included",
  priceUnit: "price_unit", delivered: "delivered",
};
const mapPatch = (patch, keymap) => {
  const out = {};
  for (const k of Object.keys(patch)) if (keymap[k]) out[keymap[k]] = patch[k];
  return out;
};

const rowToOffer = (r) => ({
  id: r.id, listingId: r.listing_id, fromUser: r.from_user_name, fromUserId: r.from_user_id,
  price: r.price, message: r.message, status: r.status, createdAt: r.created_at, updatedAt: r.updated_at,
  // urun siparisi alanlari
  qty: r.qty, unit: r.unit, kind: r.kind,
});

const rowToMessage = (r) => ({
  id: r.id, listingId: r.listing_id, offerId: r.offer_id,
  fromId: r.from_id, fromName: r.from_name, toId: r.to_id, toName: r.to_name,
  text: r.text, image: r.image, createdAt: r.created_at,
});

const rowToProfile = (r) => r && ({
  id: r.id, name: r.name, email: r.email, role: r.role,
  phone: r.phone, phoneVerified: r.phone_verified, verified: r.verified, rating: r.rating,
});

// ── Auth ────────────────────────────────────────────────────
export async function signUp({ name, email, password, role, phone }) {
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { name, role: role || "isveren", phone: phone || "" } },
  });
  if (error) return { ok: false, error: error.message };
  // E-posta onayi aciksa session gelmez -> kullanici onaylamadan giremez.
  if (data?.user && !data.session) {
    return { ok: true, needsConfirm: true, message: "E-postani kontrol et: onay baglantisi gonderdik. Onayladiktan sonra giris yap." };
  }
  return { ok: true };
}

export async function signIn({ email, password }) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() { await supabase.auth.signOut(); }

// ── OAuth giris (Google / Apple) ─────────────────────────────
// Supabase saglayiciya yonlendirir; donuste detectSessionInUrl oturumu kurar.
// Provider'lar Supabase panelinden (Authentication > Providers) acik olmalidir.
// Rol Google/Apple'dan gelmez -> ilk giriste RoleSelectModal ile secilir, profile
// yazilir. Trigger handle_new_user profili olusturur (role bos baslar).
export async function signInWithProvider(provider) {
  const { error } = await supabase.auth.signInWithOAuth({
    provider, // "google" | "apple"
    options: { redirectTo: window.location.origin },
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true }; // tarayici yonlendirilir; sonuc donuste isAuthChange ile gelir
}

export async function getSessionUser() {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
}

export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_e, session) => cb(session?.user || null));
  return () => data.subscription.unsubscribe();
}

export async function getProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
  return rowToProfile(data);
}

export async function updateProfile(userId, patch) {
  const row = {};
  if (patch.name != null) row.name = patch.name;
  if (patch.phone != null) row.phone = patch.phone;
  if (patch.role != null) row.role = patch.role;
  if (patch.phoneVerified != null) row.phone_verified = patch.phoneVerified;
  const { data, error } = await supabase.from("profiles").update(row).eq("id", userId).select("*").single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, profile: rowToProfile(data) };
}

// ── Saglik kontrolu ─────────────────────────────────────────
// Anahtarlar girilince baglantinin gercekten calistigini dogrular.
// Sessiz bos ekran yerine net tani dondurur (yanlis anahtar / sema yok / RLS).
// Donus: { ok, code, message }
export async function checkHealth() {
  if (!supabase) return { ok: false, code: "no_keys", message: "Supabase anahtarlari girilmemis — localStorage modunda calisiyor." };
  try {
    const { error } = await supabase.from("listings").select("id").limit(1);
    if (!error) return { ok: true, code: "ok", message: "Supabase bagli." };
    const msg = String(error.message || "");
    if (/relation .* does not exist|could not find the table|schema cache/i.test(msg))
      return { ok: false, code: "no_schema", message: "Baglanti var ama tablolar yok. supabase/schema.sql dosyasini SQL Editor'de calistir." };
    if (/jwt|api key|invalid|unauthorized|401/i.test(msg))
      return { ok: false, code: "bad_key", message: "Anahtar gecersiz. VITE_SUPABASE_URL ve anon anahtarini kontrol et." };
    return { ok: false, code: "error", message: msg || "Bilinmeyen Supabase hatasi." };
  } catch (e) {
    return { ok: false, code: "network", message: "Supabase'e ulasilamadi (ag/URL). " + (e?.message || "") };
  }
}

// ── Listings ────────────────────────────────────────────────
export async function fetchListings() {
  const { data, error } = await supabase.from("listings").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToListing);
}

export async function createListing(data, profile) {
  const row = {
    ...listingToRow(data),
    owner_id: profile?.id ?? null,
    owner_name: profile?.name || data.owner || "",
    owner_verified: profile?.verified ?? false,
    owner_rating: profile?.rating ?? 5.0,
    status: "aktif",
    created_text: "az once",
  };
  const { data: out, error } = await supabase.from("listings").insert(row).select("*").single();
  if (error) throw error;
  return rowToListing(out);
}

export async function updateListing(id, patch) {
  const { error } = await supabase.from("listings").update(mapPatch(patch, LISTING_KEYMAP)).eq("id", id);
  if (error) throw error;
}

export async function deleteListing(id) {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw error;
}

// ── Offers ──────────────────────────────────────────────────
export async function fetchOffers() {
  const { data, error } = await supabase.from("offers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToOffer);
}

export async function createOffer({ listingId, price, message, qty, unit, kind }, profile) {
  const row = {
    listing_id: listingId,
    from_user_id: profile.id,
    from_user_name: profile.name,
    price: price ?? null,
    message: message || "",
    status: "beklemede",
    qty: qty ?? null,
    unit: unit ?? null,
    kind: kind ?? null,
  };
  const { data, error } = await supabase.from("offers").insert(row).select("*").single();
  if (error) throw error;
  return rowToOffer(data);
}

export async function updateOffer(id, patch) {
  const { error } = await supabase.from("offers").update({ status: patch.status, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) throw error;
}

// ── Messages ────────────────────────────────────────────────
export async function fetchMessages() {
  const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToMessage);
}

export async function sendMessage({ listingId, offerId, fromId, fromName, toId, toName, text, image }) {
  const row = {
    listing_id: listingId, offer_id: offerId,
    from_id: fromId, from_name: fromName, to_id: toId, to_name: toName, text: text || "", image: image || null,
  };
  const { data, error } = await supabase.from("messages").insert(row).select("*").single();
  if (error) throw error;
  return rowToMessage(data);
}

// ── Reviews (puanlama/yorum) ────────────────────────────────
export async function fetchReviews() {
  const { data, error } = await supabase.from("reviews").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({ id: r.id, listingId: r.listing_id, fromId: r.from_id, fromName: r.from_name, toId: r.to_id, rating: r.rating, comment: r.comment, createdAt: r.created_at }));
}
export async function addReview({ listingId, fromId, fromName, toId, rating, comment }) {
  const { error } = await supabase.from("reviews").insert({ listing_id: listingId, from_id: fromId, from_name: fromName, to_id: toId, rating, comment: comment || "" });
  if (error) throw error;
}

// ── Reports (şikayet) ───────────────────────────────────────
export async function addReport({ type, targetId, listingId, fromId, fromName, reason, description }) {
  const { error } = await supabase.from("reports").insert({
    type, target_id: String(targetId ?? ""),
    listing_id: typeof listingId === "number" ? listingId : null,
    from_id: fromId || null, from_name: fromName || "", reason, description: description || "",
  });
  if (error) throw error;
}

// ── Docs (belgeler) — url Supabase Storage'dan gelir ────────
export async function fetchDocs(ownerId) {
  const { data, error } = await supabase.from("docs").select("*").eq("owner_id", ownerId).order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((d) => ({ id: d.id, ownerId: d.owner_id, type: d.type, name: d.name, url: d.url, status: d.status, createdAt: d.created_at }));
}
export async function addDoc({ ownerId, type, name, url }) {
  const { data, error } = await supabase.from("docs").insert({ owner_id: ownerId, type, name, url }).select("*").single();
  if (error) throw error;
  return data;
}
export async function removeDoc(id) {
  const { error } = await supabase.from("docs").delete().eq("id", id);
  if (error) throw error;
}
