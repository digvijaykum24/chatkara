-- Home page shows only selected dishes: Popular, Best Sellers (+ Special Offers = is_special)
alter table public.products
  add column is_popular boolean not null default false,
  add column is_bestseller boolean not null default false;

grant insert (is_popular, is_bestseller), update (is_popular, is_bestseller) on public.products to authenticated;

-- Starting selection (change any time in Admin > Products)
update public.products set is_popular = true where name in
  ('Paneer Chilli Dry','Chicken Chilli Gravy','Chicken Lollipop','Veg Noodles','Paneer Butter Masala','Chicken Kadai','Paneer Roll','Chicken 65');
update public.products set is_bestseller = true where name in
  ('Chicken Butter Masala','Chicken Roll','Paneer Kadai','Chicken Noodles','Egg D. Roll');
