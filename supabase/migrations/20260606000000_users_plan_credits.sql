-- LoexAI · Phase 1 fix · Add plan + credit-split columns to public.users
--
-- get-user.ts references plan, subscription_credits, topup_credits but these
-- were never added via migration. First login fails with a Supabase column-not-
-- found error, blocking the dashboard redirect.
--
-- All three columns are Phase 5 (Stripe) features but the application layer
-- already reads/writes them, so we provision them now with safe defaults.

alter table public.users
  add column if not exists plan text not null default 'free'
    check (plan in ('free', 'pro', 'agency'));

alter table public.users
  add column if not exists subscription_credits integer not null default 0
    check (subscription_credits >= 0);

alter table public.users
  add column if not exists topup_credits integer not null default 20
    check (topup_credits >= 0);

comment on column public.users.plan is
  'Subscription plan tier. Wired to Stripe in Phase 5. Default: free.';
comment on column public.users.subscription_credits is
  'Credits granted by the active subscription plan. Replenished on renewal.';
comment on column public.users.topup_credits is
  'One-off purchased credits. Do not expire unless explicitly refunded.';
