-- The owner's email becomes the (single) admin automatically when that account is created.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (new.id, new.email,
          left(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 100),
          left(nullif(trim(new.raw_user_meta_data->>'phone'), ''), 20),
          case when lower(new.email) = 'digvijaykum24@gmail.com'
                and not exists (select 1 from public.profiles where role = 'admin')
               then 'admin' else 'customer' end);
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

-- In case the account already exists
update public.profiles set role = 'admin'
where lower(email) = 'digvijaykum24@gmail.com'
  and not exists (select 1 from public.profiles where role = 'admin');
