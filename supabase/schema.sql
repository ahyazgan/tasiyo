-- ╔══════════════════════════════════════════════════════════════════╗
-- ║  HamTed — Supabase şeması (tablolar + RLS + trigger + demo seed)   ║
-- ║  Supabase → SQL Editor → bu dosyayı yapıştır → Run                 ║
-- ╚══════════════════════════════════════════════════════════════════╝

-- ──────────────────────────────────────────────
-- 1) PROFILES  (auth.users ile 1:1)
-- ──────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null default '',
  email       text,
  role        text not null default 'isveren',  -- isveren | tedarikci | nakliyeci
  phone       text default '',
  phone_verified boolean not null default false,
  verified    boolean not null default false,
  rating      numeric(2,1) not null default 5.0,
  created_at  timestamptz not null default now()
);
alter table public.profiles add column if not exists phone_verified boolean not null default false;

-- ──────────────────────────────────────────────
-- 2) LISTINGS  (is / arac ilanlari)
-- ──────────────────────────────────────────────
create table if not exists public.listings (
  id              bigint generated always as identity primary key,
  owner_id        uuid references public.profiles(id) on delete cascade,  -- null = demo/sistem ilani
  owner_name      text not null default '',
  owner_verified  boolean not null default false,
  owner_rating    numeric(2,1) default 5.0,
  type            text not null,                  -- is | arac
  cat             text not null,                  -- hafriyat | silobas
  title           text not null,
  il              text,
  ilce            text,
  varis_il        text,                           -- donus yuku eslestirmesi icin varis ili
  yukleme         text default '',
  bosaltma        text default '',
  material        text default '',
  amount          numeric default 0,
  unit            text default 'ton',
  date_text       text default '',
  recurring       boolean not null default false,
  recurring_text  text default '',
  vehicle         text,
  capacity        text,
  price_type      text not null default 'teklif', -- teklif | sabit
  price           numeric,
  description     text default '',
  status          text not null default 'aktif',  -- aktif | kapali | eslesti
  offers_count    integer not null default 0,
  km              numeric,                         -- harita ile secilen gercek mesafe
  pickup          jsonb,                           -- [lat,lng] yukleme noktasi
  dropoff         jsonb,                           -- [lat,lng] bosaltma noktasi
  phase           text,                            -- eslesti | yuklendi | yolda | teslim (sefer akisi)
  trips_done      integer not null default 0,      -- tamamlanan sefer sayisi
  payment_status  text not null default 'yok',     -- yok | bloke | serbest | iade (escrow)
  payment_amount  numeric,                          -- emanete alinan toplam bedel
  payment_fee     numeric,                          -- platform komisyonu (kesilen)
  payment_ref     text,                             -- saglayici referansi (mock veya gercek)
  delivery_proof  jsonb,                            -- teslim kaniti: tonnage, ticketNo, photo, signature, location, status…
  cycle_stage     text,                             -- mekik dongusu: await_load | loaded (geofence sefer sayimi)
  arrived_at      timestamptz,                      -- bosaltma alanina varis (geofence)
  early_paid      boolean not null default false,   -- hizli odeme (erken hakedis) yapildi mi
  early_pay_fee   numeric,                          -- erken odeme ucreti
  accepted_by_id  uuid,                             -- kabul edilen nakliyeci (hizli odeme hedefi)
  stock           text,                             -- urun ilani stok seviyesi: bol | orta | az
  stock_text      text,                             -- stok etiketi (gosterim)
  delivery_included boolean not null default false, -- urun ilani: nakliye dahil mi
  price_unit      text,                             -- birim fiyat etiketi ( or. /ton)
  delivered       boolean not null default false,   -- urun siparisi teslim edildi mi
  created_text    text default 'az once',
  created_at      timestamptz not null default now()
);
create index if not exists listings_owner_idx  on public.listings(owner_id);
create index if not exists listings_status_idx on public.listings(status);
create index if not exists listings_cat_idx    on public.listings(cat);

-- Mevcut projeler icin: yeni sutunlari idempotent ekle (sema once kurulmussa).
alter table public.listings add column if not exists delivery_proof jsonb;
alter table public.listings add column if not exists cycle_stage    text;
alter table public.listings add column if not exists arrived_at     timestamptz;
alter table public.listings add column if not exists early_paid     boolean not null default false;
alter table public.listings add column if not exists early_pay_fee  numeric;
alter table public.listings add column if not exists accepted_by_id uuid;

-- urun (tedarikci) ilan alanlari — idempotent
alter table public.listings add column if not exists stock             text;
alter table public.listings add column if not exists stock_text        text;
alter table public.listings add column if not exists delivery_included boolean not null default false;
alter table public.listings add column if not exists price_unit        text;
alter table public.listings add column if not exists delivered         boolean not null default false;

-- Mevcut tabloya (onceden kurulmussa) odeme kolonlarini ekle — tekrar calistirilabilir.
alter table public.listings add column if not exists payment_status text not null default 'yok';
alter table public.listings add column if not exists payment_amount numeric;
alter table public.listings add column if not exists payment_fee    numeric;
alter table public.listings add column if not exists payment_ref    text;

-- ──────────────────────────────────────────────
-- 3) OFFERS  (teklifler)
-- ──────────────────────────────────────────────
create table if not exists public.offers (
  id             bigint generated always as identity primary key,
  listing_id     bigint not null references public.listings(id) on delete cascade,
  from_user_id   uuid not null references public.profiles(id) on delete cascade,
  from_user_name text not null default '',
  price          numeric,
  message        text default '',
  status         text not null default 'beklemede', -- beklemede | kabul | ret
  qty            numeric,                             -- urun siparisi: istenen miktar
  unit           text,                                -- siparis birimi (ton, m3...)
  kind           text,                                -- teklif turu: null=teklif | siparis=urun siparisi
  created_at     timestamptz not null default now(),
  updated_at     timestamptz                          -- son durum degisikligi (kabul/ret zamani)
);
create index if not exists offers_listing_idx on public.offers(listing_id);
create index if not exists offers_user_idx    on public.offers(from_user_id);
alter table public.offers add column if not exists updated_at timestamptz;
-- urun siparisi alanlari — idempotent
alter table public.offers add column if not exists qty  numeric;
alter table public.offers add column if not exists unit text;
alter table public.offers add column if not exists kind text;

-- ──────────────────────────────────────────────
-- 4) MESSAGES  (eslesen taraflar arasi)
-- ──────────────────────────────────────────────
create table if not exists public.messages (
  id          bigint generated always as identity primary key,
  listing_id  bigint not null references public.listings(id) on delete cascade,
  offer_id    bigint references public.offers(id) on delete cascade,
  from_id     uuid not null references public.profiles(id) on delete cascade,
  from_name   text default '',
  to_id       uuid not null references public.profiles(id) on delete cascade,
  to_name     text default '',
  text        text default '',
  image       text,                                -- base64/URL (ileride Supabase Storage)
  created_at  timestamptz not null default now()
);
create index if not exists messages_thread_idx on public.messages(listing_id, offer_id);
create index if not exists messages_to_idx     on public.messages(to_id);

-- ──────────────────────────────────────────────
-- 5) TRIGGER: yeni auth kullanicisi -> profiles satiri
-- ──────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, role, phone)
  values (
    new.id,
    new.email,
    -- OAuth (Google/Apple) ad alani: full_name > name > e-posta yerel kismi
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(coalesce(new.email, ''), '@', 1)
    ),
    -- Rol OAuth'tan gelmez: bos birak -> uygulama RoleSelectModal ile sordurur.
    coalesce(new.raw_user_meta_data->>'role', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ──────────────────────────────────────────────
-- 6) TRIGGER: teklif eklenince ilanin offers_count'u artsin
-- ──────────────────────────────────────────────
create or replace function public.bump_offers_count()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.listings set offers_count = offers_count + 1 where id = new.listing_id;
  return new;
end; $$;

drop trigger if exists on_offer_created on public.offers;
create trigger on_offer_created
  after insert on public.offers
  for each row execute function public.bump_offers_count();

-- ──────────────────────────────────────────────
-- 7) RLS — Row Level Security
-- ──────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.offers   enable row level security;
alter table public.messages enable row level security;

-- profiles: herkes okur (isim/puan gosterimi), sadece sahibi yazar/gunceller
drop policy if exists profiles_read   on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
create policy profiles_read   on public.profiles for select using (true);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);

-- listings: herkes bakar; sadece sahibi ekler/gunceller/siler
drop policy if exists listings_read   on public.listings;
drop policy if exists listings_insert on public.listings;
drop policy if exists listings_update on public.listings;
drop policy if exists listings_delete on public.listings;
create policy listings_read   on public.listings for select using (true);
create policy listings_insert on public.listings for insert with check (auth.uid() = owner_id);
create policy listings_update on public.listings for update using (auth.uid() = owner_id);
create policy listings_delete on public.listings for delete using (auth.uid() = owner_id);

-- offers: teklifi veren VEYA ilan sahibi gorur; teklifi veren ekler; ilan sahibi durum gunceller
drop policy if exists offers_read   on public.offers;
drop policy if exists offers_insert on public.offers;
drop policy if exists offers_update on public.offers;
create policy offers_read on public.offers for select using (
  auth.uid() = from_user_id
  or auth.uid() = (select owner_id from public.listings l where l.id = listing_id)
);
create policy offers_insert on public.offers for insert with check (auth.uid() = from_user_id);
create policy offers_update on public.offers for update using (
  auth.uid() = (select owner_id from public.listings l where l.id = listing_id)
);

-- messages: sadece sohbetin taraflari okur/yazar
drop policy if exists messages_read   on public.messages;
drop policy if exists messages_insert on public.messages;
create policy messages_read on public.messages for select using (
  auth.uid() = from_id or auth.uid() = to_id
);
create policy messages_insert on public.messages for insert with check (auth.uid() = from_id);

-- ──────────────────────────────────────────────
-- 7b) PUANLAMA / YORUM  (reviews)
-- ──────────────────────────────────────────────
create table if not exists public.reviews (
  id           bigint generated always as identity primary key,
  listing_id   bigint references public.listings(id) on delete cascade,
  from_id      uuid not null references public.profiles(id) on delete cascade,
  from_name    text default '',
  to_id        uuid not null references public.profiles(id) on delete cascade,
  rating       integer not null check (rating between 1 and 5),
  comment      text default '',
  created_at   timestamptz not null default now()
);
create index if not exists reviews_to_idx on public.reviews(to_id);
alter table public.reviews enable row level security;
drop policy if exists reviews_read on public.reviews;
drop policy if exists reviews_insert on public.reviews;
create policy reviews_read   on public.reviews for select using (true);          -- puanlar herkese acik
create policy reviews_insert on public.reviews for insert with check (auth.uid() = from_id);

-- ──────────────────────────────────────────────
-- 7c) SIKAYET / UYUSMAZLIK  (reports)
-- ──────────────────────────────────────────────
create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  type        text not null,                       -- listing | user
  target_id   text,                                -- ilan id veya kullanici id
  listing_id  bigint references public.listings(id) on delete set null,
  from_id     uuid references public.profiles(id) on delete set null,
  from_name   text default '',
  reason      text not null,
  description text default '',
  status      text not null default 'acik',        -- acik | inceleniyor | kapali
  created_at  timestamptz not null default now()
);
alter table public.reports enable row level security;
drop policy if exists reports_insert on public.reports;
drop policy if exists reports_read on public.reports;
create policy reports_insert on public.reports for insert with check (true);     -- giris yapmamis da bildirebilir
create policy reports_read   on public.reports for select using (auth.uid() = from_id);  -- sadece kendi bildirimini gorur (admin servis rolu ayri)

-- ──────────────────────────────────────────────
-- 7d) BELGELER  (docs) — ileride dosyalar Supabase Storage'a tasinir
-- ──────────────────────────────────────────────
create table if not exists public.docs (
  id          bigint generated always as identity primary key,
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  type        text not null,                       -- K Belgesi | Arac Ruhsati | ...
  name        text default '',
  url         text,                                -- Storage URL (base64 yerine)
  status      text not null default 'beklemede',   -- beklemede | dogrulandi | red
  created_at  timestamptz not null default now()
);
create index if not exists docs_owner_idx on public.docs(owner_id);
alter table public.docs enable row level security;
drop policy if exists docs_read on public.docs;
drop policy if exists docs_write on public.docs;
drop policy if exists docs_delete on public.docs;
create policy docs_read   on public.docs for select using (auth.uid() = owner_id);
create policy docs_write  on public.docs for insert with check (auth.uid() = owner_id);
create policy docs_delete on public.docs for delete using (auth.uid() = owner_id);

-- ──────────────────────────────────────────────
-- 8) DEMO SEED  (owner_id null = sistem ilani; herkes gorur, kimse duzenleyemez)
-- ──────────────────────────────────────────────
insert into public.listings
  (owner_name, owner_verified, owner_rating, type, cat, title, il, ilce, yukleme, bosaltma,
   material, amount, unit, date_text, recurring, recurring_text, vehicle, capacity,
   price_type, price, description, status, offers_count, created_text)
values
  ('Yildizlar Insaat', true, 4.7, 'is','hafriyat','Dudullu santiye hafriyat tasima','Istanbul','Umraniye','Dudullu OSB, blok C insaati','Samandira dokum sahasi','Hafriyat',1200,'ton','8-12 Haziran',true,'5 gun, gunde ~20 sefer',null,null,'teklif',null,'Bina kazisi cikan hafriyat. Yukleme makinesi sahada mevcut. Tasima mesafesi ~14 km.','aktif',6,'2 saat once'),
  ('Cayirova Yapi', true, 4.5, 'is','silobas','Cimento fabrikasindan santiyeye dokme cimento','Kocaeli','Gebze','Nuh Cimento fabrika','Cayirova konut projesi','Cimento',28,'ton','3 Haziran (acil)',false,'',null,null,'sabit',4500,'Tek sefer dokme cimento tasima. Silobas zorunlu. Bosaltma sahada silo var.','aktif',3,'5 saat once'),
  ('Murat K.', false, 4.9, 'arac','hafriyat','Damperli kamyon bos - Anadolu yakasi','Istanbul','Pendik','','','',18,'ton','Bugun-yarin musait',false,'','Damperli kamyon','18 ton','teklif',null,'Anadolu yakasi hafriyat/moloz isleri icin bos aracim var. Sefer veya gunluk calisirim.','aktif',2,'1 saat once'),
  ('Demir Nakliyat', true, 4.8, 'arac','silobas','Silobas (cimento) - Marmara bolgesi','Bursa','Nilufer','','','',30,'ton','5 Haziran sonrasi',true,'Haftalik duzenli is alabilir','Silobas (cimento)','30 ton','teklif',null,'Marmara geneli dokme cimento tasirim. Belgelerim tam, duzenli is tercihim.','aktif',4,'dun'),
  ('Baskent Altyapi', true, 4.6, 'is','hafriyat','Yol genisletme - kazi fazlasi tasima','Ankara','Etimesgut','Eryaman yol calismasi','Belediye dokum alani','Toprak',800,'m³','10-15 Haziran',true,'Yaklasik 1 hafta',null,null,'teklif',null,'Yol genisletmeden cikan toprak. Birden fazla araca ihtiyac var.','aktif',9,'3 saat once'),
  ('Ege Lojistik', true, 4.4, 'is','silobas','Limandan fabrikaya dokme micir','Izmir','Aliaga','Aliaga limani','Kemalpasa sanayi','Micir',120,'ton','7-9 Haziran',false,'',null,null,'teklif',null,'Limandan bosaltilan micir, fabrikaya tasinacak. Dokme yuk dorse uygun.','aktif',5,'6 saat once')
on conflict do nothing;

-- ──────────────────────────────────────────────
-- 9) TRIP_LOCATIONS  (canli sefer konumu — realtime takip cutover'ina hazir)
--    Su an uygulama localStorage "kanal"i kullanir (src/utils/tripChannel.js);
--    gercek cok-cihaz takip icin bu tabloya + Supabase Realtime'a baglanir.
-- ──────────────────────────────────────────────
create table if not exists public.trip_locations (
  listing_id  bigint primary key references public.listings(id) on delete cascade,
  driver_id   uuid references public.profiles(id) on delete set null,
  lat         double precision,
  lng         double precision,
  speed       double precision,            -- m/s
  heading     double precision,            -- derece
  accuracy    double precision,            -- m
  trail       jsonb default '[]'::jsonb,    -- son N nokta
  active      boolean not null default true,
  updated_at  timestamptz not null default now()
);
create index if not exists trip_loc_driver_idx on public.trip_locations(driver_id);
alter table public.trip_locations enable row level security;
drop policy if exists trip_loc_read   on public.trip_locations;
drop policy if exists trip_loc_write  on public.trip_locations;
drop policy if exists trip_loc_update on public.trip_locations;
-- Okuma: islin taraflari (ilan sahibi veya kabul edilen nakliyeci).
create policy trip_loc_read on public.trip_locations for select using (
  exists (
    select 1 from public.listings l where l.id = listing_id and (
      l.owner_id = auth.uid()
      or exists (select 1 from public.offers o where o.listing_id = l.id and o.status = 'kabul' and o.from_user_id = auth.uid())
    )
  )
);
-- Yazma/guncelleme: yalnizca surucu kendi konumunu.
create policy trip_loc_write  on public.trip_locations for insert with check (auth.uid() = driver_id);
create policy trip_loc_update on public.trip_locations for update using (auth.uid() = driver_id);

-- Realtime yayinina ekle (varsa hata vermez).
do $$ begin
  alter publication supabase_realtime add table public.trip_locations;
exception when others then null; end $$;
