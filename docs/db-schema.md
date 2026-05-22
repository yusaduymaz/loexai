# DB Schema — Reader's Reference

> **Source of truth:** `supabase/migrations/`. This document is a *map* of intent,
> not a replacement for reading the SQL. When schema and this doc disagree, the
> SQL wins. Update this doc in the same commit as any migration that changes
> shape.

## Tables (10)

| Table                       | Owner         | Cardinality                  | RLS pattern                          |
| --------------------------- | ------------- | ---------------------------- | ------------------------------------ |
| `users`                     | `auth.users`  | 1 per auth row               | `auth.uid() = id` (no DELETE)        |
| `businesses`                | `users`       | many per user                | `auth.uid() = user_id`               |
| `business_enrichments`      | `businesses`  | 1 per business               | join → `businesses.user_id`          |
| `gap_analyses`              | `businesses`  | 1 per business               | join → `businesses.user_id`          |
| `opportunities`             | `businesses`  | 1 per business (MVP)         | join → `businesses.user_id`          |
| `solution_recommendations`  | `opportunities` | 1 per opportunity          | join → `businesses.user_id`          |
| `sales_strategies`          | `opportunities` | 1 per opportunity          | join → `businesses.user_id`          |
| `build_prompts`             | `opportunities` | 1 per opportunity          | join → `businesses.user_id`          |
| `scan_jobs`                 | `users`       | many per user                | `auth.uid() = user_id`               |
| `ai_usage`                  | `users`       | many per user                | own + admin SELECT; append-only      |

## Relationship map

```text
auth.users
   └── public.users (id, email, role, credits)
          │
          ├── businesses (user_id FK)
          │      │
          │      ├── business_enrichments (UNIQUE business_id)
          │      ├── gap_analyses          (UNIQUE business_id)
          │      └── opportunities         (UNIQUE business_id)
          │              │
          │              ├── solution_recommendations (UNIQUE opportunity_id)
          │              ├── sales_strategies         (UNIQUE opportunity_id)
          │              └── build_prompts            (UNIQUE opportunity_id)
          │
          ├── scan_jobs (user_id FK)
          │
          └── ai_usage  (user_id FK; nullable business_id, scan_job_id)
```

All child FKs are `ON DELETE CASCADE` except `ai_usage.business_id` and
`ai_usage.scan_job_id` which are `ON DELETE SET NULL` (we keep the cost log
even after the work-product is deleted).

## Idempotent UPSERT keys

| Table                      | Conflict target                            |
| -------------------------- | ------------------------------------------ |
| `businesses`               | `(user_id, place_id)` (partial, place_id IS NOT NULL) |
| `business_enrichments`     | `(business_id)`                            |
| `gap_analyses`             | `(business_id)`                            |
| `opportunities`            | `(business_id)`                            |
| `solution_recommendations` | `(opportunity_id)`                         |
| `sales_strategies`         | `(opportunity_id)`                         |
| `build_prompts`            | `(opportunity_id)`                         |

Re-running the pipeline for the same business/opportunity will UPDATE, not
INSERT, by design (ARCH §Idempotent).

## Functions

| Function                                         | Purpose                                                       |
| ------------------------------------------------ | ------------------------------------------------------------- |
| `public.handle_new_user()`                       | AFTER INSERT trigger on `auth.users`; seeds `public.users` with `credits=20, role='user'`. SECURITY DEFINER. |
| `public.tg_set_updated_at()`                     | BEFORE UPDATE trigger that stamps `updated_at = now()`. Reused across pipeline tables. |
| `public.decrement_user_credits(uuid, integer)`   | Atomic credit check + decrement. Returns new balance or `-1` (insufficient). SECURITY DEFINER with internal owner/admin check. |

## How to add a new table

1. Create a migration under `supabase/migrations/<ts>_<name>.sql` containing:
   - `CREATE TABLE` with PK, FKs (cascade), `created_at`, `updated_at` if mutable.
   - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` immediately.
   - **All four policies** (SELECT/INSERT/UPDATE/DELETE) in the same file.
   - INSERT/UPDATE policies always use `WITH CHECK` (PITFALL §RLS-4).
   - Pipeline-style tables (no `user_id` column) use the
     `EXISTS (SELECT 1 FROM businesses ...)` ownership join.
2. Push: `npx supabase db push` (or `db reset` locally with Docker).
3. Regenerate types:
   ```bash
   npx supabase gen types typescript --local > src/types/database.ts
   ```
   In Phase 1 we maintain `src/types/database.ts` by hand because Docker is
   not part of the dev loop yet — match the new shape manually. From Phase 2
   onward this step becomes scripted (`npm run db:types`).
4. Update this doc — add the table to the table list and relationship map.

## Cross-user isolation (manual test recipe)

In Supabase SQL Editor authed as User A:

```sql
insert into public.businesses (user_id, source, name)
values (auth.uid(), 'manual', 'Test A');
```

Switch to User B and run:

```sql
select * from public.businesses;                -- should return 0 rows
update public.businesses set name='x'           -- should affect 0 rows
where id = '<row id from A>';
delete from public.businesses                   -- should affect 0 rows
where id = '<row id from A>';
```

All three must report zero affected rows. If any of them returns A's data, the
RLS policy is broken — fix before merging.

## Credit RPC test recipe

Authed as the target user:

```sql
select public.decrement_user_credits(auth.uid(), 5);   -- → 15  (was 20)
select public.decrement_user_credits(auth.uid(), 20);  -- → -1  (insufficient)
select public.decrement_user_credits(auth.uid(), 5);   -- → 10
```

Authed as a different non-admin user, calling for someone else:

```sql
select public.decrement_user_credits('<other-uuid>', 1);  -- ERROR: forbidden
```

Race-condition check (two parallel `psql` sessions, balance starts at 1):

```sql
-- session 1                            -- session 2 (issued simultaneously)
select decrement_user_credits(...,1);   select decrement_user_credits(...,1);
-- one returns 0, the other returns -1. Never both 0.
```
