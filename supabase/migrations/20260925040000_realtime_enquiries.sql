-- Live enquiries in the admin dashboard (Realtime respects row-level security: admins only)
alter publication supabase_realtime add table public.enquiries;
