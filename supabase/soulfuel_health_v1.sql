-- SoulFuel health tracking, shared by web and future mobile clients.
create table if not exists public.member_health_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 birth_date date,
 height_cm numeric(6,2) check (height_cm > 0 and height_cm < 300),
 updated_at timestamptz not null default now()
);
create table if not exists public.member_health_measurements (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 measured_at timestamptz not null default now(),
 metric_key text not null check (metric_key in ('weight_kg','body_fat_percent','resting_heart_rate_bpm','systolic_mmhg','diastolic_mmhg','waist_cm','sleep_hours','steps')),
 value numeric(12,3) not null check (value >= 0),
 created_at timestamptz not null default now()
);
create index if not exists member_health_measurements_user_time on public.member_health_measurements(user_id,metric_key,measured_at desc);
alter table public.member_health_profiles enable row level security;
alter table public.member_health_measurements enable row level security;
create policy "health profile self select" on public.member_health_profiles for select to authenticated using ((select auth.uid())=user_id);
create policy "health profile self insert" on public.member_health_profiles for insert to authenticated with check ((select auth.uid())=user_id);
create policy "health profile self update" on public.member_health_profiles for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "health profile self delete" on public.member_health_profiles for delete to authenticated using ((select auth.uid())=user_id);
create policy "health measurement self select" on public.member_health_measurements for select to authenticated using ((select auth.uid())=user_id);
create policy "health measurement self insert" on public.member_health_measurements for insert to authenticated with check ((select auth.uid())=user_id);
create policy "health measurement self update" on public.member_health_measurements for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "health measurement self delete" on public.member_health_measurements for delete to authenticated using ((select auth.uid())=user_id);
grant select,insert,update,delete on public.member_health_profiles, public.member_health_measurements to authenticated;
