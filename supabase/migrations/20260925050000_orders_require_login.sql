-- Placing an order now requires a logged-in customer account (guests can still send enquiries).
drop policy "Website can submit orders" on public.orders;
revoke insert on public.orders from anon;
