-- ───────────────────────────────────────────────────────────────────────────
-- LoexAI · Phase 1 · PLAN-1B · Atomic credit decrement RPC
-- ───────────────────────────────────────────────────────────────────────────
--
-- Why an RPC (not a Server Action with two queries):
--   PITFALL §Credit-1 — checking credits and decrementing must be ONE SQL
--   statement, otherwise two concurrent scans both pass the check and the
--   user goes negative. `UPDATE ... WHERE credits >= amount RETURNING credits`
--   is atomic at the row level (Postgres takes a row lock); if no row matches
--   we return -1 to signal "insufficient credits".
--
-- SECURITY DEFINER reasoning:
--   * The function must run with elevated rights to (a) read auth.uid() and
--     (b) write the users row in a single statement without an RLS round-trip.
--   * We pin search_path = public to defeat search-path hijacking (PITFALL).
--   * The function performs its own ownership check: the caller must be the
--     target user OR an admin. Anything else raises 'forbidden'.

create or replace function public.decrement_user_credits(p_user_id uuid, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_balance integer;
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

  -- Atomic check + decrement. If credits < amount, no row matches → no update.
  update public.users
     set credits = credits - p_amount
   where id = p_user_id
     and credits >= p_amount
  returning credits into new_balance;

  if new_balance is null then
    return -1;  -- insufficient credits sentinel
  end if;

  return new_balance;
end;
$$;

comment on function public.decrement_user_credits(uuid, integer) is
  'Atomic credit check + decrement. Returns new balance, or -1 if the user does not have enough credits. SECURITY DEFINER; performs its own owner/admin check. Phase 2 wires this from the scan-enqueue Server Action (PITFALL §Credit-1).';

-- Lock down execution: authenticated users only. anon must NOT be able to
-- invoke this function — service-role implicitly bypasses GRANT.
revoke all on function public.decrement_user_credits(uuid, integer) from public;
grant execute on function public.decrement_user_credits(uuid, integer) to authenticated;
