-- Only one admin account may exist
create unique index profiles_single_admin on public.profiles (role) where role = 'admin';
