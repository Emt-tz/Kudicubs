-- Seeding helper (spec 006). Sets a parent's PIN hash for demo accounts, for scripts/seed.mjs only.
-- Not reachable by clients: execute is revoked from public/anon/authenticated, and the body
-- refuses any request that carries an anon or authenticated JWT.
create or replace function seed_set_pin(p_user uuid, p_pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if auth.role() in ('anon','authenticated') then raise exception 'forbidden'; end if;
  update parents set pin_hash = crypt(p_pin, gen_salt('bf')), pin_attempts = 0, pin_locked_until = null where id = p_user;
end $$;
revoke execute on function seed_set_pin(uuid, text) from public, anon, authenticated;
grant execute on function seed_set_pin(uuid, text) to service_role;
