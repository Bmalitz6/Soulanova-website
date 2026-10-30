-- SoulSafe Phase 2: private, expiring live location sessions.
-- Run once in Supabase SQL Editor. No location is shared until a signed-in member explicitly starts a session.
create table if not exists public.soulsafe_sessions (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 share_token uuid not null unique default gen_random_uuid(),
 created_at timestamptz not null default now(),
 expires_at timestamptz not null default (now()+interval '2 hours'),
 ended_at timestamptz,
 latitude double precision,
 longitude double precision,
 accuracy_m double precision,
 updated_at timestamptz,
 constraint soulsafe_lat check(latitude between -90 and 90),
 constraint soulsafe_lon check(longitude between -180 and 180),
 constraint soulsafe_expiry check(expires_at<=created_at+interval '4 hours')
);
create index if not exists soulsafe_owner_idx on public.soulsafe_sessions(owner_id,created_at desc);
alter table public.soulsafe_sessions enable row level security;
revoke all on public.soulsafe_sessions from anon;
grant select,insert,update on public.soulsafe_sessions to authenticated;
drop policy if exists "soulsafe owner read" on public.soulsafe_sessions;
create policy "soulsafe owner read" on public.soulsafe_sessions for select to authenticated using(owner_id=auth.uid());
drop policy if exists "soulsafe owner create" on public.soulsafe_sessions;
create policy "soulsafe owner create" on public.soulsafe_sessions for insert to authenticated with check(owner_id=auth.uid() and ended_at is null and latitude is null and longitude is null and expires_at<=now()+interval '4 hours');
drop policy if exists "soulsafe owner update" on public.soulsafe_sessions;
create policy "soulsafe owner update" on public.soulsafe_sessions for update to authenticated using(owner_id=auth.uid() and ended_at is null and expires_at>now()) with check(owner_id=auth.uid());
-- Guard immutable owner/token/expiration, and enforce stop as terminal.
create or replace function public.soulsafe_guard_update() returns trigger language plpgsql as $$
begin
 if new.owner_id is distinct from old.owner_id or new.share_token is distinct from old.share_token or new.created_at is distinct from old.created_at or new.expires_at is distinct from old.expires_at or new.id is distinct from old.id then
  raise exception 'SoulSafe session identity and expiration cannot change';
 end if;
 if old.ended_at is not null then raise exception 'SoulSafe session already ended'; end if;
 if new.ended_at is not null then
  new.latitude:=null;new.longitude:=null;new.accuracy_m:=null;new.updated_at:=null;
 end if;
 return new;
end;$$;
drop trigger if exists soulsafe_guard_update on public.soulsafe_sessions;
create trigger soulsafe_guard_update before update on public.soulsafe_sessions for each row execute function public.soulsafe_guard_update();
-- SECURITY DEFINER allows recipient access only by possession of a hard-to-guess UUID token.
-- Function deliberately does NOT expose owner ID, route history, or ended locations.
create or replace function public.soulsafe_view(token uuid)
returns table(is_active boolean, latitude double precision, longitude double precision, accuracy_m double precision, updated_at timestamptz, expires_at timestamptz)
language sql stable security definer set search_path='' as $$
 select (s.ended_at is null and s.expires_at>now()),
        case when s.ended_at is null and s.expires_at>now() then s.latitude end,
        case when s.ended_at is null and s.expires_at>now() then s.longitude end,
        case when s.ended_at is null and s.expires_at>now() then s.accuracy_m end,
        case when s.ended_at is null and s.expires_at>now() then s.updated_at end,
        s.expires_at
 from public.soulsafe_sessions s where s.share_token=token limit 1;
$$;
revoke all on function public.soulsafe_view(uuid) from public;
grant execute on function public.soulsafe_view(uuid) to anon,authenticated;
