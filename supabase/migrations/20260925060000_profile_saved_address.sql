-- Saved delivery details so returning customers don't have to re-enter them
alter table public.profiles
  add column address text check (char_length(address) <= 500),
  add column address_lat double precision check (address_lat between -90 and 90),
  add column address_lng double precision check (address_lng between -180 and 180),
  add column address_source text check (address_source in ('gps','address'));

grant update (full_name, phone, address, address_lat, address_lng, address_source) on public.profiles to authenticated;
