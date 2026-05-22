-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 1 · PLAN-1B · `businesses` table + RLS
-- ───────────────────────────────────────────────────────────────────────────
--
-- Scope:
--   * Discovered local business rows scoped to a single user.
--   * Partial UNIQUE on (user_id, place_id) when place_id IS NOT NULL — so
--     manual/import entries (no place_id) are NOT subject to the dedup rule
--     but Google-Places-discovered rows cannot be inserted twice for the same
--     user (CLAUDE.md §7.1 dedup invariant).
--   * RLS ON with 4 policies. Every policy checks `auth.uid() = user_id`.
--   * Helper trigger keeps `updated_at` in sync — required by idempotent
--     UPSERT pattern in the pipeline (ARCH §Idempotent).
--
-- Why everything in one file:
--   PITFALL §RLS-1 — table + RLS enable + policies must land in the same
--   migration so the table never has a window of "RLS off / partial policies".

create table if not exists public.businesses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  place_id         text,
  source           text not null
                   check (source in ('google_maps', 'manual', 'import')),
  name             text not null,
  category         text,
  address          text,
  city             text,
  country          text,
  phone            text,
  website          text,
  google_maps_url  text,
  rating           numeric(3, 2),
  review_count     integer,
  opening_hours    jsonb,
  photos           jsonb,
  social_links     jsonb,
  raw_data         jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.businesses is
  'Raw discovered local business rows. One row per (user_id, place_id) when place_id is set. Pipeline tables (enrichments / gaps / opportunities) hang off this row.';
comment on column public.businesses.place_id is
  'Provider-native identifier (e.g. Google Place ID). NULL for manual/import sources. Dedup is partial-unique only when present.';
comment on column public.businesses.raw_data is
  'Full provider payload kept verbatim so we can re-derive fields without re-fetching.';

-- Partial UNIQUE — only enforce dedup when place_id is meaningful.
create unique index if not exists businesses_user_place_unique
  on public.businesses (user_id, place_id)
  where place_id is not null;

-- Hot-path indexes for the dashboard list views.
create index if not exists idx_businesses_user_id
  on public.businesses (user_id);
create index if not exists idx_businesses_user_category
  on public.businesses (user_id, category);

-- ─── updated_at trigger ────────────────────────────────────────────────────
-- A single project-wide trigger function keeps `updated_at = now()` on UPDATE.
-- Defined here in the first migration that needs it; subsequent migrations
-- reuse `public.tg_set_updated_at()` via CREATE TRIGGER only.

create or replace function public.tg_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.tg_set_updated_at() is
  'Generic BEFORE UPDATE trigger that stamps updated_at = now(). Reused across pipeline tables.';

drop trigger if exists set_updated_at on public.businesses;
create trigger set_updated_at
  before update on public.businesses
  for each row execute function public.tg_set_updated_at();

-- ─── RLS ───────────────────────────────────────────────────────────────────

alter table public.businesses enable row level security;

-- WHY: user can only see their own businesses (PITFALL §RLS-1).
drop policy if exists "businesses_select_own" on public.businesses;
create policy "businesses_select_own"
  on public.businesses
  for select
  using (auth.uid() = user_id);

-- WHY: writes must bind to the inserting user's id (PITFALL §RLS-4: WITH CHECK
-- is required on INSERT — USING alone does NOT cover INSERT).
drop policy if exists "businesses_insert_own" on public.businesses;
create policy "businesses_insert_own"
  on public.businesses
  for insert
  with check (auth.uid() = user_id);

-- WHY: a user can update their own businesses; the WITH CHECK clause prevents
-- re-assigning a row to a different user_id via UPDATE.
drop policy if exists "businesses_update_own" on public.businesses;
create policy "businesses_update_own"
  on public.businesses
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- WHY: a user can delete their own businesses; cascade removes pipeline rows.
drop policy if exists "businesses_delete_own" on public.businesses;
create policy "businesses_delete_own"
  on public.businesses
  for delete
  using (auth.uid() = user_id);
