-- Run once in the Soulanova Supabase SQL editor.
-- Freestyle sessions are separate from guided soulwalk_sessions.
create table if not exists public.freestyle_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 activity_type text not null check (activity_type in ('walk','run')),
 duration_seconds integer not null check (duration_seconds > 0),
 steps integer check (steps >= 0),
 distance_miles numeric(10,3) check (distance_miles >= 0),
 distance_source text check (distance_source in ('gps','health','none')),
 created_at timestamptz not null default now()
);
create index if not exists freestyle_sessions_user_date_idx on public.freestyle_sessions(user_id,created_at desc);
alter table public.freestyle_sessions enable row level security;
drop policy if exists "freestyle_select_own" on public.freestyle_sessions;
create policy "freestyle_select_own" on public.freestyle_sessions for select to authenticated using (auth.uid()=user_id);
drop policy if exists "freestyle_insert_own" on public.freestyle_sessions;
create policy "freestyle_insert_own" on public.freestyle_sessions for insert to authenticated with check (auth.uid()=user_id);
drop policy if exists "freestyle_delete_own" on public.freestyle_sessions;
create policy "freestyle_delete_own" on public.freestyle_sessions for delete to authenticated using (auth.uid()=user_id);
