-- ===== Helper schema (not exposed through the API) =====
create schema if not exists private;
grant usage on schema private to anon, authenticated;

-- ===== Profiles: one per auth user, with role =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text check (char_length(full_name) <= 100),
  phone text check (char_length(phone) <= 20),
  role text not null default 'customer' check (role in ('customer','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          left(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 100),
          left(nullif(trim(new.raw_user_meta_data->>'phone'), ''), 20));
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;   -- never role/email
create policy "Users read own profile, admins read all" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));
create policy "Users update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- ===== Products (menu) =====
create table public.products (
  id bigint generated always as identity primary key,
  category text not null check (char_length(category) between 1 and 60),
  name text not null unique check (char_length(name) between 1 and 100),
  price_full integer not null check (price_full > 0 and price_full < 100000),
  price_half integer check (price_half > 0 and price_half < 100000),
  is_veg boolean not null default true,
  is_special boolean not null default false,
  special_tag text check (char_length(special_tag) <= 30),
  description text check (char_length(description) <= 300),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.products enable row level security;
create index products_sort_idx on public.products (sort_order);

revoke all on public.products from anon, authenticated;
grant select on public.products to anon, authenticated;
grant insert (category, name, price_full, price_half, is_veg, is_special, special_tag, description, is_available, sort_order),
      update (category, name, price_full, price_half, is_veg, is_special, special_tag, description, is_available, sort_order, updated_at),
      delete on public.products to authenticated;
create policy "Anyone reads available products, admins read all" on public.products
  for select to anon, authenticated using (is_available or (select private.is_admin()));
create policy "Admins add products" on public.products
  for insert to authenticated with check ((select private.is_admin()));
create policy "Admins edit products" on public.products
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "Admins delete products" on public.products
  for delete to authenticated using ((select private.is_admin()));

-- ===== Orders: link to logged-in customer, admin management =====
alter table public.orders add column user_id uuid references auth.users(id) on delete set null default auth.uid();
alter table public.orders add column updated_at timestamptz not null default now();
create index orders_user_id_idx on public.orders (user_id);

grant insert (order_code, order_type, items, subtotal, customer_name, customer_phone, address,
              distance_km, location_lat, location_lng, location_source, note)
  on public.orders to authenticated;
grant select on public.orders to authenticated;
grant update (status, updated_at) on public.orders to authenticated;

create policy "Customers submit own orders" on public.orders
  for insert to authenticated with check (status = 'new' and user_id = (select auth.uid()));
create policy "Customers read own orders, admins read all" on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Admins update order status" on public.orders
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ===== Enquiries: same pattern =====
alter table public.enquiries add column user_id uuid references auth.users(id) on delete set null default auth.uid();
create index enquiries_user_id_idx on public.enquiries (user_id);

grant insert (enquiry_type, name, phone, guests, visit_date, visit_time, message) on public.enquiries to authenticated;
grant select on public.enquiries to authenticated;
grant update (status) on public.enquiries to authenticated;

create policy "Customers submit own enquiries" on public.enquiries
  for insert to authenticated with check (status = 'new' and user_id = (select auth.uid()));
create policy "Customers read own enquiries, admins read all" on public.enquiries
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "Admins update enquiry status" on public.enquiries
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- Live updates for the admin dashboard (Realtime respects the policies above)
alter publication supabase_realtime add table public.orders;

-- The menu itself was seeded separately from the website's built-in menu (73 dishes).
-- Make the owner an admin after they sign up:
--   update public.profiles set role = 'admin' where email = 'owner@example.com';
