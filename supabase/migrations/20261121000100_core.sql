-- KudiCubs core schema (spec 006). RLS on every table. Wallet = append-only events.
create extension if not exists pgcrypto;

create type age_band as enum ('b4_6','b7_9','b10_12','b13_15');
create type region_code as enum ('gh','ng','uk');
create type device_mode as enum ('my-phone','family');
create type wallet_kind as enum ('earn','spend','save','bonus','daily','xp');
create type staff_role as enum ('support','content','admin');

create table parents (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  region region_code not null default 'gh',
  pin_hash text,
  pin_attempts int not null default 0,
  pin_locked_until timestamptz,
  consented_at timestamptz,
  created_at timestamptz not null default now()
);

create table child_profiles (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  age_band age_band not null,
  region region_code not null,
  avatar text not null default 'cub-friend-1',
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on child_profiles(parent_id);

create table devices (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references parents(id) on delete cascade,
  label text not null,
  mode device_mode not null default 'my-phone',
  last_seen timestamptz not null default now()
);

create table missions (
  id text primary key,
  age_band age_band not null,
  world text not null,
  title text not null,
  position int not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table badges (
  id text primary key,
  title text not null,
  pillar text
);

create table mission_attempts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references child_profiles(id) on delete cascade,
  mission_id text not null references missions(id),
  outcome text not null check (outcome in ('success','retry','gentle','left')),
  started_at timestamptz not null default now(),
  finished_at timestamptz
);
create index on mission_attempts(child_id);

-- append-only: balances are derived, never edited.
create table wallet_events (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references child_profiles(id) on delete cascade,
  kind wallet_kind not null,
  amount int not null check (amount >= 0),
  label text not null default '',
  attempt_id uuid references mission_attempts(id) on delete set null,
  created_at timestamptz not null default now()
);
create index on wallet_events(child_id, created_at);

create table child_badges (
  child_id uuid not null references child_profiles(id) on delete cascade,
  badge_id text not null references badges(id),
  earned_at timestamptz not null default now(),
  primary key (child_id, badge_id)
);

create table contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  topic text not null default 'general',
  message text not null check (char_length(message) between 5 and 2000),
  reference text not null default ('KC-' || lpad((floor(random()*9000)+1000)::int::text,4,'0')),
  created_at timestamptz not null default now()
);

create table staff_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role staff_role not null default 'support',
  created_at timestamptz not null default now()
);

-- derived balances
create view child_balances with (security_invoker = true) as
select c.id as child_id,
  coalesce(sum(case when w.kind in ('earn','bonus','daily') then w.amount end),0)
  - coalesce(sum(case when w.kind in ('spend','save') then w.amount end),0) as coins,
  coalesce(sum(case when w.kind='save' then w.amount end),0) as saved,
  coalesce(sum(case when w.kind='xp' then w.amount end),0) as xp
from child_profiles c left join wallet_events w on w.child_id = c.id
group by c.id;

create or replace function is_staff() returns boolean language sql stable security definer set search_path = public as
$$ select exists(select 1 from staff_users where user_id = auth.uid()) $$;

create or replace function owns_child(cid uuid) returns boolean language sql stable security definer set search_path = public as
$$ select exists(select 1 from child_profiles where id = cid and parent_id = auth.uid()) $$;

-- new auth user -> parent row
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from staff_users where email = new.email) then
    insert into parents(id,email) values (new.id,new.email) on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

-- PIN: hash in the database, attempts counted, lock-out after 5 wrong tries.
create or replace function set_pin(pin text) returns void language plpgsql security definer set search_path = public, extensions as $$
begin
  if pin !~ '^[0-9]{4}$' then raise exception 'pin_format'; end if;
  if pin in ('0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','4321','0123') then raise exception 'pin_weak'; end if;
  update parents set pin_hash = crypt(pin, gen_salt('bf')), pin_attempts = 0, pin_locked_until = null where id = auth.uid();
end $$;

create or replace function verify_pin(pin text) returns text language plpgsql security definer set search_path = public, extensions as $$
declare p parents%rowtype;
begin
  select * into p from parents where id = auth.uid();
  if p.pin_locked_until is not null and p.pin_locked_until > now() then return 'locked'; end if;
  if p.pin_hash is not null and p.pin_hash = crypt(pin, p.pin_hash) then
    update parents set pin_attempts = 0, pin_locked_until = null where id = p.id; return 'ok';
  end if;
  update parents set pin_attempts = pin_attempts + 1,
    pin_locked_until = case when pin_attempts + 1 >= 5 then now() + interval '5 minutes' end
    where id = p.id;
  return case when p.pin_attempts + 1 >= 5 then 'locked' else 'wrong' end;
end $$;

-- hard delete of the whole family (cascades)
create or replace function delete_my_family() returns void language plpgsql security definer set search_path = public as $$
begin delete from auth.users where id = auth.uid(); end $$;

-- one-call export of everything a parent owns
create or replace function export_my_family() returns jsonb language sql stable security definer set search_path = public as $$
select jsonb_build_object(
  'parent', (select to_jsonb(p) - 'pin_hash' from parents p where p.id = auth.uid()),
  'children', coalesce((select jsonb_agg(jsonb_build_object('profile', to_jsonb(c),
     'wallet', (select coalesce(jsonb_agg(to_jsonb(w)),'[]') from wallet_events w where w.child_id=c.id),
     'attempts', (select coalesce(jsonb_agg(to_jsonb(a)),'[]') from mission_attempts a where a.child_id=c.id),
     'badges', (select coalesce(jsonb_agg(to_jsonb(b)),'[]') from child_badges b where b.child_id=c.id)))
   from child_profiles c where c.parent_id = auth.uid()),'[]'),
  'devices', (select coalesce(jsonb_agg(to_jsonb(d)),'[]') from devices d where d.parent_id = auth.uid()));
$$;

-- RLS
alter table parents enable row level security;
alter table child_profiles enable row level security;
alter table devices enable row level security;
alter table missions enable row level security;
alter table badges enable row level security;
alter table mission_attempts enable row level security;
alter table wallet_events enable row level security;
alter table child_badges enable row level security;
alter table contact_messages enable row level security;
alter table staff_users enable row level security;

create policy parents_self on parents for select using (id = auth.uid());
create policy parents_self_upd on parents for update using (id = auth.uid()) with check (id = auth.uid());
create policy parents_staff on parents for select using (is_staff());

create policy children_own on child_profiles for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());
create policy children_staff on child_profiles for select using (is_staff());

create policy devices_own on devices for all using (parent_id = auth.uid()) with check (parent_id = auth.uid());

create policy missions_read on missions for select to authenticated, anon using (published or is_staff());
create policy missions_staff_write on missions for update using (is_staff()) with check (is_staff());
create policy badges_read on badges for select to authenticated, anon using (true);

create policy attempts_own on mission_attempts for all using (owns_child(child_id)) with check (owns_child(child_id));
create policy attempts_staff on mission_attempts for select using (is_staff());
create policy wallet_read on wallet_events for select using (owns_child(child_id));
create policy wallet_insert on wallet_events for insert with check (owns_child(child_id));  -- append only: no update/delete policy
create policy wallet_staff on wallet_events for select using (is_staff());
create policy cbadges_own on child_badges for all using (owns_child(child_id)) with check (owns_child(child_id));
create policy cbadges_staff on child_badges for select using (is_staff());

create policy contact_insert on contact_messages for insert to anon, authenticated with check (true);
create policy contact_staff on contact_messages for select using (is_staff());
create policy staff_self on staff_users for select using (user_id = auth.uid());

grant usage on schema public to anon, authenticated;
grant select on missions, badges to anon, authenticated;
grant insert on contact_messages to anon, authenticated;
grant select, insert, update, delete on child_profiles, devices, mission_attempts, child_badges to authenticated;
grant select, update on parents to authenticated;
grant select, insert on wallet_events to authenticated;
grant select on child_balances, staff_users, contact_messages to authenticated;
grant update on missions to authenticated;
revoke execute on function delete_my_family, export_my_family, set_pin, verify_pin from public, anon;
grant execute on function delete_my_family, export_my_family, set_pin, verify_pin, is_staff, owns_child to authenticated;
-- the pin columns must not be readable by clients
revoke select on parents from authenticated;
grant select (id,email,region,consented_at,created_at,pin_locked_until) on parents to authenticated;
revoke update on parents from authenticated;
grant update (region, consented_at) on parents to authenticated;

-- contact form: validated insert that hands back the reference shown on the thank-you screen
create or replace function submit_contact(p_name text, p_email text, p_topic text, p_message text) returns text
language plpgsql security definer set search_path = public as $$
declare r text;
begin
  insert into contact_messages(name,email,topic,message) values (p_name,p_email,coalesce(nullif(p_topic,''),'general'),p_message) returning reference into r;
  return r;
end $$;
grant execute on function submit_contact to anon, authenticated;
revoke insert on contact_messages from anon, authenticated;
