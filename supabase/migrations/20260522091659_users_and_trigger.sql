-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 1 · PLAN-1A · public.users table + handle_new_user trigger
-- ───────────────────────────────────────────────────────────────────────────
--
-- Scope of this migration (PLAN-1A only):
--   * Creates `public.users` so the auth flow has a profile row to read from.
--   * Enables RLS and writes the four policies (SELECT/INSERT/UPDATE/DELETE).
--   * Creates `handle_new_user()` SECURITY DEFINER function + AFTER INSERT
--     trigger on `auth.users` that atomically inserts a profile row with
--     `credits=20, role='user'`.
--
-- The remaining 9 tables of the Phase 1 schema (businesses, enrichments,
-- gaps, opportunities, solutions, sales_strategies, build_prompts, scan_jobs,
-- ai_usage) are introduced in PLAN-1B. We split here so the auth flow can be
-- verified end-to-end before the rest of the schema lands.
--
-- Decisions:
--   * `id uuid` mirrors `auth.users.id`. ON DELETE CASCADE so deleting the
--     auth row cleans up the profile (SKELETON.md §5).
--   * `credits int DEFAULT 20` — D-08..10 (kredi UI'sının davranışı buna bağlı).
--   * `role text DEFAULT 'user'` with CHECK constraint — D-01 (no Supabase
--     custom claims, no hardcoded email list).
--   * Trigger uses ON CONFLICT (id) DO NOTHING — re-running the trigger for
--     the same auth user must be idempotent (e.g. dev resets, repeat signups).

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null unique,
  role        text not null default 'user'
              check (role in ('user', 'admin')),
  credits     integer not null default 20
              check (credits >= 0),
  created_at  timestamptz not null default now()
);

comment on table public.users is
  'Application profile row for every Supabase auth user. Populated by the handle_new_user() trigger; never inserted manually from the client.';
comment on column public.users.role is
  'Authorization role. D-01: text column (default user). First admin promoted via Supabase Dashboard SQL — see docs/admin-setup.md.';
comment on column public.users.credits is
  'Remaining pipeline credits. New users start at 20 (CLAUDE.md §11). Decremented atomically by RPC in Phase 2+.';

-- ─── RLS ───────────────────────────────────────────────────────────────────
-- PITFALL §RLS-1: every table that lives in `public` MUST have RLS turned on
-- in the same migration that creates it. Policies follow immediately so the
-- table never has a window of "RLS on, zero policies = denied to everyone
-- including the owner".

alter table public.users enable row level security;

-- Own-row read. Backs `getCurrentUser()` and middleware role lookup.
drop policy if exists "users_select_own" on public.users;
create policy "users_select_own"
  on public.users
  for select
  using (auth.uid() = id);

-- Defensive INSERT policy. The trigger runs as SECURITY DEFINER and doesn't
-- need this policy — but if a client ever attempts a direct INSERT (e.g. a
-- future "complete your profile" flow), we want it bound to their own id.
drop policy if exists "users_insert_own" on public.users;
create policy "users_insert_own"
  on public.users
  for insert
  with check (auth.uid() = id);

-- Own-row update (e.g. future "edit profile"). Note: this currently allows a
-- user to UPDATE every column including `role`. We accept this in Phase 1
-- because there is no UI surface that would let a normal user attempt it; in
-- Phase 5 we will tighten with column-level grants or a dedicated RPC.
drop policy if exists "users_update_own" on public.users;
create policy "users_update_own"
  on public.users
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Hard "no" on DELETE — users cannot remove their profile from the client.
-- Account deletion goes through Supabase Auth admin API (cascades down here).
drop policy if exists "users_delete_forbidden" on public.users;
create policy "users_delete_forbidden"
  on public.users
  for delete
  using (false);

-- ─── handle_new_user trigger ───────────────────────────────────────────────
-- Fires AFTER INSERT on auth.users in the SAME transaction. If the INSERT
-- into public.users fails, the auth signup is rolled back too — preventing
-- the "auth user exists but has no profile row" footgun.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, role, credits)
  values (new.id, new.email, 'user', 20)
  on conflict (id) do nothing;
  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Bridges auth.users → public.users. SECURITY DEFINER so it bypasses RLS but is bound to specific NEW row from the trigger context.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
