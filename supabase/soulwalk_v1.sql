-- SoulWalk V1: shared workout statistics for browser and mobile app.
create table if not exists public.soulwalk_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 week_number integer not null check (week_number between 1 and 12),
 duration_minutes integer not null check (duration_minutes between 15 and 40),
 distance_miles numeric(10,3) check (distance_miles >= 0 and distance_miles <= 100),
 steps integer check (steps >= 0 and steps <= 150000),
 completed_at timestamptz not null default now(),
 source text not null default 'web' check (source in ('web','ios','android')),
 workout_session_id uuid,
 created_at timestamptz not null default now()
);
create index if not exists soulwalk_sessions_member_date on public.soulwalk_sessions(user_id,completed_at desc);
alter table public.soulwalk_sessions enable row level security;
create policy "soulwalk own select" on public.soulwalk_sessions for select to authenticated using ((select auth.uid())=user_id);
create policy "soulwalk own insert" on public.soulwalk_sessions for insert to authenticated with check ((select auth.uid())=user_id);
create policy "soulwalk own update" on public.soulwalk_sessions for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "soulwalk own delete" on public.soulwalk_sessions for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.soulwalk_sessions to authenticated;
