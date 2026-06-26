import { createClient } from "@supabase/supabase-js";

// Vite ortam degiskenleri (.env -> .env.local). Anahtarlar yoksa app localStorage'da calismaya devam eder.
const url = import.meta.env.VITE_SUPABASE_URL;
// Yeni anahtar sistemi (sb_publishable_...) veya eski (anon eyJ...) — ikisini de kabul et.
const anon =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && anon);

// Anahtar yoksa null doner; cagiran taraf isSupabaseConfigured ile kontrol eder.
export const supabase = isSupabaseConfigured
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
