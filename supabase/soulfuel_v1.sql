-- SoulFuel V1: one account, shared web/mobile data.
-- Run in Supabase SQL Editor after review.
create table if not exists public.nutrition_goals (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 nutrient_key text not null check (nutrient_key ~ '^[a-z][a-z0-9_]{0,63}$'),
 display_name text not null check (length(trim(display_name)) between 1 and 80),
 unit text not null check (unit in ('kcal','g','mg','mcg','ml')),
 goal_type text not null check (goal_type in ('target','minimum','maximum')),
 target_value numeric(12,3) not null check (target_value >= 0),
 enabled boolean not null default true,
 updated_at timestamptz not null default now(),
 unique(user_id,nutrient_key)
);
create table if not exists public.nutrition_entries (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 consumed_at timestamptz not null default now(),
 meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
 food_name text not null check (length(trim(food_name)) between 1 and 150),
 quantity numeric(12,3) not null default 1 check(quantity > 0),
 serving_description text not null default 'serving' check (length(serving_description) <= 80),
 nutrients jsonb not null default '{}'::jsonb check (jsonb_typeof(nutrients) = 'object'),
 source text not null default 'manual' check (source in ('manual','barcode','custom')),
 barcode text,
 created_at timestamptz not null default now()
);
create index if not exists nutrition_entries_user_date_idx on public.nutrition_entries(user_id,consumed_at desc);
alter table public.nutrition_goals enable row level security;
alter table public.nutrition_entries enable row level security;
create policy "goals own select" on public.nutrition_goals for select to authenticated using ((select auth.uid())=user_id);
create policy "goals own insert" on public.nutrition_goals for insert to authenticated with check ((select auth.uid())=user_id);
create policy "goals own update" on public.nutrition_goals for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "goals own delete" on public.nutrition_goals for delete to authenticated using ((select auth.uid())=user_id);
create policy "entries own select" on public.nutrition_entries for select to authenticated using ((select auth.uid())=user_id);
create policy "entries own insert" on public.nutrition_entries for insert to authenticated with check ((select auth.uid())=user_id);
create policy "entries own update" on public.nutrition_entries for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "entries own delete" on public.nutrition_entries for delete to authenticated using ((select auth.uid())=user_id);
-- Nutrient JSONB stores per-consumed-portion numeric values using keys like calories, protein,
-- carbs, fat, total_sugar, added_sugar, fiber, sodium. Validate API writes client-side and
-- server-side before public launch. Health data must never go into analytics/marketing logs.
