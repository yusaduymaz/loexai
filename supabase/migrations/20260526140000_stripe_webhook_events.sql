-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 5 · Stripe Webhook Events & Credit Synchronization
-- ───────────────────────────────────────────────────────────────────────────

-- 1. Create stripe_webhook_events table for idempotency check
create table if not exists public.stripe_webhook_events (
  id          text primary key, -- Stripe event ID (evt_xxx)
  type        text not null,
  processed   boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.stripe_webhook_events is
  'Tracks received Stripe webhook events to guarantee processing idempotency.';

-- Enable RLS on stripe_webhook_events (no policies means denied by default to all non-admin roles)
alter table public.stripe_webhook_events enable row level security;

-- 2. Add Stripe and billing columns to public.users table
alter table public.users add column if not exists stripe_customer_id text;
alter table public.users add column if not exists stripe_subscription_id text;
alter table public.users add column if not exists stripe_price_id text;
alter table public.users add column if not exists plan text not null default 'free' check (plan in ('free', 'pro', 'agency'));
alter table public.users add column if not exists subscription_credits integer not null default 0 check (subscription_credits >= 0);
alter table public.users add column if not exists topup_credits integer not null default 20 check (topup_credits >= 0);

-- Create unique index on stripe_customer_id
create unique index if not exists users_stripe_customer_id_unique
  on public.users (stripe_customer_id)
  where stripe_customer_id is not null;

-- Create unique index on stripe_subscription_id
create unique index if not exists users_stripe_subscription_id_unique
  on public.users (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Migrate existing credits to topup_credits to prevent data loss
update public.users set topup_credits = credits where topup_credits = 20;

-- 3. Redefine decrement_user_credits to consume subscription credits first
create or replace function public.decrement_user_credits(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sub_credits integer;
  v_topup_credits integer;
  v_needed integer := p_amount;
  v_deduct_sub integer;
  v_deduct_topup integer;
  v_new_total integer;
begin
  -- Ownership check. auth.uid() returns the JWT claim 'sub' under PostgREST.
  if auth.uid() is null then
    raise exception 'forbidden: unauthenticated';
  end if;

  if auth.uid() <> p_user_id
     and not exists (
       select 1 from public.users
       where id = auth.uid() and role = 'admin'
     ) then
    raise exception 'forbidden: not owner';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid amount: %', p_amount;
  end if;

  -- Select current balances with row lock
  select subscription_credits, topup_credits
    into v_sub_credits, v_topup_credits
    from public.users
   where id = p_user_id
     for update;

  if v_sub_credits is null or v_topup_credits is null then
    raise exception 'user not found';
  end if;

  if v_sub_credits + v_topup_credits < v_needed then
    return -1; -- insufficient credits sentinel
  end if;

  -- Determine how much to deduct from subscription credits vs top-up credits
  if v_sub_credits >= v_needed then
    v_deduct_sub := v_needed;
    v_deduct_topup := 0;
  else
    v_deduct_sub := v_sub_credits;
    v_deduct_topup := v_needed - v_sub_credits;
  end if;

  v_new_total := (v_sub_credits - v_deduct_sub) + (v_topup_credits - v_deduct_topup);

  -- Atomic update
  update public.users
     set subscription_credits = subscription_credits - v_deduct_sub,
         topup_credits = topup_credits - v_deduct_topup,
         credits = v_new_total
   where id = p_user_id;

  return v_new_total;
end;
$$;

-- 4. Create handle_stripe_event function to process incoming verified events
create or replace function public.handle_stripe_event(p_event_id text, p_event_type text, p_data jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clerk_user_id text;
  v_customer_id text;
  v_subscription_id text;
  v_price_id text;
  v_plan text;
  v_credits_to_add integer;
  v_quota integer;
  v_user_id uuid;
  v_current_topup integer;
  v_status text;
  v_response jsonb;
begin
  -- 1. Identify webhook event
  v_customer_id := p_data->>'customer';

  -- 2. Process by event type
  if p_event_type = 'checkout.session.completed' then
    v_clerk_user_id := p_data->'metadata'->>'clerk_user_id';
    v_subscription_id := p_data->>'subscription';

    if p_data->>'mode' = 'subscription' then
      v_plan := coalesce(p_data->'metadata'->>'plan', 'pro');
      v_price_id := p_data->'metadata'->>'price_id';

      update public.users
         set stripe_customer_id = v_customer_id,
             stripe_subscription_id = v_subscription_id,
             stripe_price_id = v_price_id,
             plan = v_plan
       where clerk_user_id = v_clerk_user_id
       returning id into v_user_id;

      v_response := jsonb_build_object('status', 'subscription_initiated', 'user_id', v_user_id);
    else
      -- One-time payment (credit top-up pack)
      v_credits_to_add := coalesce((p_data->'metadata'->>'credits_to_add')::integer, 50);

      update public.users
         set stripe_customer_id = coalesce(stripe_customer_id, v_customer_id),
             topup_credits = topup_credits + v_credits_to_add,
             credits = subscription_credits + topup_credits + v_credits_to_add
       where clerk_user_id = v_clerk_user_id
       returning id into v_user_id;

      v_response := jsonb_build_object('status', 'topup_completed', 'user_id', v_user_id, 'credits_added', v_credits_to_add);
    end if;

  elsif p_event_type = 'invoice.payment_succeeded' then
    v_subscription_id := p_data->>'subscription';

    -- Subscriptions reset/update monthly quota on invoice payment
    if v_subscription_id is not null then
      -- Find user associated with subscription
      select id, plan, topup_credits into v_user_id, v_plan, v_current_topup
        from public.users
       where stripe_subscription_id = v_subscription_id;

      if v_user_id is not null then
        -- Determine quota based on plan
        if v_plan = 'agency' then
          v_quota := 2000;
        else
          v_quota := 500;
        end if;

        update public.users
           set subscription_credits = v_quota,
               credits = v_quota + topup_credits
         where id = v_user_id;

        v_response := jsonb_build_object('status', 'subscription_credits_reset', 'user_id', v_user_id, 'quota', v_quota);
      else
        v_response := jsonb_build_object('status', 'user_not_found', 'subscription_id', v_subscription_id);
      end if;
    else
      v_response := jsonb_build_object('status', 'ignored_non_subscription_invoice');
    end if;

  elsif p_event_type in ('customer.subscription.deleted', 'customer.subscription.updated') then
    v_subscription_id := p_data->>'id';
    v_status := p_data->>'status';

    -- If subscription is canceled, unpaid, or incomplete_expired, degrade to free
    if p_event_type = 'customer.subscription.deleted' or v_status in ('canceled', 'unpaid', 'incomplete_expired') then
      update public.users
         set plan = 'free',
             subscription_credits = 0,
             credits = topup_credits,
             stripe_subscription_id = null,
             stripe_price_id = null
       where stripe_subscription_id = v_subscription_id
       returning id into v_user_id;

      v_response := jsonb_build_object('status', 'subscription_degraded', 'user_id', v_user_id);
    else
      v_response := jsonb_build_object('status', 'subscription_status_updated', 'stripe_status', v_status);
    end if;

  else
    v_response := jsonb_build_object('status', 'unhandled_event_type', 'type', p_event_type);
  end if;

  -- Mark the event as processed
  update public.stripe_webhook_events
     set processed = true
   where id = p_event_id;

  return v_response;
end;
$$;

comment on function public.handle_stripe_event(text, text, jsonb) is
  'Atomic webhook event processing handler. Deduplicates events and adjusts credits/plans accordingly.';
