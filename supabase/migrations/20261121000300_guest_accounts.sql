-- Guest (anonymous) sign-in: a family can start playing without an email.
-- Anonymous users have no email, so the parent row gets an empty one until they add it.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email is null or not exists (select 1 from staff_users where email = new.email) then
    insert into parents(id,email) values (new.id, coalesce(new.email,'')) on conflict do nothing;
  end if;
  return new;
end $$;
