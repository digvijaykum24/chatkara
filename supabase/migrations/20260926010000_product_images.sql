-- Dish photos: public to view, only the admin can upload / replace / delete
alter table public.products add column image_url text check (char_length(image_url) <= 500);
grant insert (image_url), update (image_url) on public.products to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/webp','image/jpeg','image/png'])
on conflict (id) do nothing;

create policy "Admins read product images" on storage.objects
  for select to authenticated using (bucket_id = 'product-images' and (select private.is_admin()));
create policy "Admins upload product images" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy "Admins replace product images" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select private.is_admin()))
  with check (bucket_id = 'product-images' and (select private.is_admin()));
create policy "Admins delete product images" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select private.is_admin()));
