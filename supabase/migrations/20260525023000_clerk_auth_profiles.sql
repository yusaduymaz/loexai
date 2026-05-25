-- LoexAI · Clerk auth migration
--
-- Clerk becomes the source of authentication. public.users remains the
-- application profile table and keeps UUID primary keys so existing business /
-- scan / opportunity foreign keys remain stable.

alter table public.users
  drop constraint if exists users_id_fkey;

alter table public.users
  alter column id set default gen_random_uuid();

alter table public.users
  add column if not exists clerk_user_id text;

create unique index if not exists users_clerk_user_id_unique
  on public.users (clerk_user_id)
  where clerk_user_id is not null;

comment on column public.users.clerk_user_id is
  'Clerk user id (user_...). Auth source of truth after Clerk migration.';

-- Supabase Auth trigger is no longer used for new signups. Keep the function
-- for old environments, but remove the trigger so Clerk-created users are
-- created explicitly by the app profile sync.
drop trigger if exists on_auth_user_created on auth.users;
