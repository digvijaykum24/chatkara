-- Order requests from the website
create table public.orders (
  id bigint generated always as identity primary key,
  order_code text not null unique check (order_code ~ '^CK-[0-9]{4}-[A-Z0-9]{4}$'),
  created_at timestamptz not null default now(),
  order_type text not null check (order_type in ('delivery','pickup')),
  items jsonb not null check (jsonb_typeof(items) = 'array' and jsonb_array_length(items) between 1 and 100),
  subtotal integer not null check (subtotal > 0 and subtotal < 100000),
  customer_name text not null check (char_length(customer_name) between 1 and 100),
  customer_phone text not null check (char_length(customer_phone) between 5 and 20),
  address text check (char_length(address) <= 500),
  distance_km numeric(6,2),
  location_lat double precision,
  location_lng double precision,
  location_source text check (location_source in ('gps','address')),
  note text check (char_length(note) <= 500),
  status text not null default 'new' check (status in ('new','confirmed','rejected','completed')),
  -- Delivery rule: subtotal MORE THAN Rs 300, verified location within 3 km
  constraint delivery_rules check (
    order_type = 'pickup'
    or (subtotal > 300 and address is not null and distance_km is not null and distance_km <= 3
        and location_lat is not null and location_lng is not null)
  )
);
comment on table public.orders is 'Order requests placed on the Chatkara website. Status is updated by the restaurant.';

-- Enquiries / reservations from the website
create table public.enquiries (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  enquiry_type text not null check (enquiry_type in ('Table Reservation','Birthday / Party Booking','General Enquiry')),
  name text not null check (char_length(name) between 1 and 100),
  phone text not null check (char_length(phone) between 5 and 20),
  guests integer check (guests between 1 and 500),
  visit_date date,
  visit_time time,
  message text check (char_length(message) <= 1000),
  status text not null default 'new' check (status in ('new','confirmed','rejected','completed'))
);
comment on table public.enquiries is 'Enquiry / reservation requests from the Chatkara website.';

create index orders_created_at_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);
create index enquiries_created_at_idx on public.enquiries (created_at desc);

-- Security: the public website may only INSERT new rows; it can never read, change or delete them.
alter table public.orders enable row level security;
alter table public.enquiries enable row level security;

revoke all on public.orders from anon, authenticated;
revoke all on public.enquiries from anon, authenticated;
grant insert (order_code, order_type, items, subtotal, customer_name, customer_phone, address,
              distance_km, location_lat, location_lng, location_source, note)
  on public.orders to anon;
grant insert (enquiry_type, name, phone, guests, visit_date, visit_time, message)
  on public.enquiries to anon;

create policy "Website can submit orders" on public.orders
  for insert to anon with check (status = 'new');
create policy "Website can submit enquiries" on public.enquiries
  for insert to anon with check (status = 'new');
