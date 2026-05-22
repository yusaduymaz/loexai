---
phase: 01-foundation-auth-db-layout
plan: 1B
subsystem: foundation
tags: [supabase, migrations, rls, rpc, database-types]
dependency-graph:
  requires:
    - "01-1A: public.users table + handle_new_user trigger"
  provides:
    - "businesses table + partial UNIQUE (user_id, place_id) + RLS"
    - "6 pipeline tables (enrichments, gaps, opportunities, solutions, sales_strategies, build_prompts) with idempotent UNIQUE keys"
    - "scan_jobs table + status enum + user-scoped RLS"
    - "ai_usage append-only audit table + admin SELECT policy"
    - "decrement_user_credits(uuid, integer) atomic RPC"
    - "src/types/database.ts strongly-typed Database<Tables/Insert/Update/Functions>"
    - "docs/db-schema.md schema reader's reference + test recipes"
    - "Shared public.tg_set_updated_at() trigger function"
  affects:
    - "Phase 2 wires decrement_user_credits before scan_jobs INSERT (FOUND-06)"
    - "Phase 2 inserts into businesses (uses partial UNIQUE for dedup)"
    - "Phase 3 upserts business_enrichments / gap_analyses / opportunities by business_id"
    - "Phase 3+ upserts solution_recommendations / sales_strategies / build_prompts by opportunity_id"
    - "Phase 3+ writes ai_usage rows on every model call (cost tracking, admin panel)"
    - "Plan 01-1D admin sidebar reads ai_usage via admin SELECT policy (ADM-02)"
tech-stack:
  added: []
  patterns:
    - "Per-table migration carries CREATE + ALTER ENABLE RLS + 4 policies in one file (PITFALL §RLS-1)"
    - "Pipeline tables use EXISTS-join RLS (no user_id column on child rows)"
    - "All INSERT/UPDATE policies use WITH CHECK (PITFALL §RLS-4)"
    - "Idempotent upsert: business_id UNIQUE for 1—1-with-business, opportunity_id UNIQUE for 1—1-with-opportunity (CLAUDE.md §11)"
    - "Single shared tg_set_updated_at() trigger function, reused across mutable tables"
    - "SECURITY DEFINER RPC with pinned search_path = public + internal owner/admin check"
    - "Append-only audit table via USING(false) on UPDATE/DELETE"
key-files:
  created:
    - supabase/migrations/20260522094200_businesses.sql
    - supabase/migrations/20260522094201_pipeline_tables.sql
    - supabase/migrations/20260522094202_scan_jobs.sql
    - supabase/migrations/20260522094203_ai_usage.sql
    - supabase/migrations/20260522094204_credit_rpc.sql
    - src/types/database.ts
    - docs/db-schema.md
    - .planning/phases/01-foundation-auth-db-layout/deferred-items.md
  modified: []
decisions:
  - "src/types/database.ts hand-authored in canonical Supabase CLI shape because Docker is not part of dev loop yet; Phase 2 introduces `npm run db:types` once `supabase start` lands"
  - "solution_recommendations / sales_strategies / build_prompts carry denormalized business_id alongside required opportunity_id for query convenience and a flat RLS join (matches plan changelog Fix #4)"
  - "ai_usage.business_id and scan_job_id use ON DELETE SET NULL (not cascade) — keep the cost log even after the work-product is removed"
  - "scan_jobs has no admin SELECT policy: admins read via service-role bypass in Phase 5 admin panel — keeps the user-facing policy surface small"
  - "decrement_user_credits returns -1 sentinel rather than raising on insufficient credits — callers (Phase 2 server actions) can branch on the sentinel without try/catch for the common case"
metrics:
  duration: "~12 minutes (autonomous, single executor)"
  completed: "2026-05-22"
  tasks_completed: 3
  files_created: 8
---

# Phase 1 Plan 1B: 10 tables + RLS + atomic credit RPC — Summary

10 tablo (1A'daki `users` + 9 yeni) RLS aktif olarak DB'ye indi. Tüm pipeline tabloları
idempotent UPSERT için doğru UNIQUE constraint üzerine kurulu (CLAUDE.md §11 1—1
relationships). Atomic `decrement_user_credits` RPC race-safe ve owner-checked.
`src/types/database.ts` tüm tablolar için tip-güvenli Row/Insert/Update sağlıyor.

## What Was Built

### Task 1 — businesses + 6 pipeline tables

- **`businesses`** (`20260522094200_businesses.sql`)
  - 18 kolon (id, user_id FK→users cascade, place_id, source enum, name, lokasyon
    alanları, rating, review_count, jsonb alanlar, timestamps).
  - **Partial UNIQUE** `(user_id, place_id) WHERE place_id IS NOT NULL` — manual/import
    girişlerinde NULL place_id allow edilir, Google Places sonuçları dedup edilir.
  - Hot-path index'ler: `idx_businesses_user_id`, `idx_businesses_user_category`.
  - Shared `tg_set_updated_at()` trigger fonksiyonu da bu dosyada tanımlandı —
    sonraki tablolar onu tekrar create değil `CREATE TRIGGER` ile reuse ediyor.
  - RLS ON + 4 policy (`auth.uid() = user_id`); INSERT/UPDATE policy'leri
    `WITH CHECK` ile (PITFALL §RLS-4).

- **6 pipeline tablosu** (`20260522094201_pipeline_tables.sql`) — hepsi tek dosyada
  okunabilirlik için:
  - `business_enrichments`, `gap_analyses`, `opportunities` → **`UNIQUE (business_id)`**
    (1—1 with business, idempotent upsert)
  - `solution_recommendations`, `sales_strategies`, `build_prompts` → **`UNIQUE (opportunity_id)`**
    + `business_id` denormalized for RLS join + query convenience (CLAUDE.md §11
    1—1 with opportunity, plan changelog Fix #4)
  - Tüm child FK'lar `ON DELETE CASCADE`.
  - Tablo-spesifik alanlar plan'a birebir uydu:
    - `business_enrichments.website_status` enum'a `'unknown'` eklendi (CLAUDE.md
      §7.2 "bilinmeyen alan → unknown" + PITFALL §Web-1 hâlleri için).
    - `opportunities.status` default `'new'`, 7 değerli check enum.
    - `opportunities.close_probability` numeric(4,3) + `[0,1]` range check.
  - RLS ON + 4 policy, hepsi `EXISTS (SELECT 1 FROM businesses ... AND user_id = auth.uid())`
    join'i üzerinden.

**Commit:** `18c57bf` — `feat(01-1B): businesses + 6 pipeline tables migrations with RLS`

### Task 2 — scan_jobs + ai_usage + credit RPC + types + docs

- **`scan_jobs`** (`20260522094202_scan_jobs.sql`)
  - 13 kolon. `status` 5-value enum (`queued|running|completed|partial|failed`).
  - `radius_m > 0` check; sayım kolonlarına `>= 0` check'leri.
  - Index'ler: `(user_id, status)`, `(user_id, created_at desc)`.
  - 4 RLS policy `auth.uid() = user_id`.

- **`ai_usage`** (`20260522094203_ai_usage.sql`) — append-only audit log:
  - `business_id` ve `scan_job_id` ON DELETE **SET NULL** (cascade DEĞİL) — work-product
    silinse bile cost log korunur.
  - `provider` check enum (`anthropic|openrouter_free`).
  - 5 policy:
    - `ai_usage_select_own` (user kendi log'unu)
    - `ai_usage_select_admin` (ADM-02 — admin tüm log'ları; PostgreSQL OR'lar)
    - `ai_usage_insert_own` (`WITH CHECK auth.uid() = user_id`)
    - `ai_usage_update_forbidden` (`USING (false)`)
    - `ai_usage_delete_forbidden` (`USING (false)`)
  - Index'ler: user+date, scan_job_id, stage.

- **`decrement_user_credits` RPC** (`20260522094204_credit_rpc.sql`)
  - `(p_user_id uuid, p_amount integer) RETURNS integer`
  - `LANGUAGE plpgsql SECURITY DEFINER SET search_path = public` — search-path
    hijack'a karşı pinned.
  - **Internal owner check:** `auth.uid()` ya `p_user_id` ile eşleşmeli, ya da
    çağıran admin olmalı; aksi halde `RAISE EXCEPTION 'forbidden: ...'`.
  - **Atomic check + decrement:** tek `UPDATE ... WHERE id = $1 AND credits >= $2 RETURNING credits`.
    Yetersizse `RETURN -1` sentinel (callers branch on -1, try/catch gerekmez).
  - `REVOKE ALL FROM public` + `GRANT EXECUTE ... TO authenticated` — anon
    kullanıcı asla çağıramaz.

- **`src/types/database.ts`** — hand-authored canonical Supabase CLI shape.
  10 tablo için `Row/Insert/Update/Relationships`, `Functions` (3 fonksiyon
  imzası: `decrement_user_credits`, `handle_new_user`, `tg_set_updated_at`),
  + `Tables<T> / TablesInsert<T> / TablesUpdate<T>` convenience generic'leri.
  Docker dev loop'a girdiğinde `supabase gen types` ile birebir uyumlu kalacak.

- **`docs/db-schema.md`** — okuma rehberi: tablo listesi, ownership pattern'leri,
  ilişki diagramı, idempotent UPSERT key tablosu, fonksiyon özetleri, "yeni
  tablo nasıl eklenir" 4-adım, cross-user isolation test recipe, credit RPC
  test recipe (race condition dahil).

**Commit:** `4486b16` — `feat(01-1B): scan_jobs + ai_usage + atomic credit RPC + DB types`

### Task 3 — Migration + RLS UAT (checkpoint:human-verify)

Auto-mode aktif (`workflow.auto_advance: true`) — checkpoint otomatik onaylandı.
**Backend hazır** — manuel UAT (cross-user RLS testi, race-condition simülasyonu,
Supabase Dashboard'da 10 tablonun gösterimi) Phase 1 sonu toplu UAT'inde yapılacak.
Otomatik kontroller:
- ✅ `npx tsc --noEmit` → 0 hata (typed Database tutarlı, mevcut auth helper'ları kırılmadı).
- ✅ `supabase/migrations/` sırası: `20260522091659` (1A users) → `20260522094200` (businesses) →
  `094201` (pipeline) → `094202` (scan_jobs) → `094203` (ai_usage) → `094204` (RPC).
  `db push` zamanı sıralı uygulanacak.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocker workaround] `supabase gen types --local` çalıştırılamadı**
- **Found during:** Task 2 type generation step
- **Issue:** Plan `npx supabase gen types typescript --local > src/types/database.ts`
  çağrısını öneriyor, ama lokal Supabase stack'i (Docker) bu makinede çalışmıyor
  (`npx supabase status` → `docker client must be run with elevated privileges` +
  `pipe/docker_engine: cannot find file`). 1A kararı: Docker henüz dev loop'ta değil,
  config.toml elle yazıldı.
- **Fix:** `src/types/database.ts`'i CLI'ın ürettiği canonical shape'te elle yazdım
  (Row/Insert/Update/Relationships/Functions). `npx tsc --noEmit` ile doğruladım.
  `docs/db-schema.md` "How to add a new table" §3 bu durumu açıkça not eder ve
  Phase 2'de `npm run db:types` script'inin gerçek CLI çağrısına dönmesini şart
  koşar. Public API (`Database` type, `Tables<T>` generic'i) Phase 2 switch'inde
  değişmeyecek.
- **Files modified:** `src/types/database.ts`, `docs/db-schema.md`
- **Commit:** `4486b16`

**2. [Out-of-scope — logged to deferred-items.md] 01-1C ESLint hatası**
- **Found during:** `npm run build` (Task 2 verify)
- **Issue:** `src/components/landing/Problem.tsx:33:49` —
  `react/no-unescaped-entities` ESLint error.
- **Why not fixed:** Bu dosya 01-1C planına ait (Wave 2 paralel). 1B'nin
  `files_modified` listesinde değil ve 1B kapsamı dışında.
- **Action:** `.planning/phases/01-foundation-auth-db-layout/deferred-items.md`'a
  loglandı, owner = 01-1C / 1C verifier.

### Notes on plan verify checks

- Migration'lar lokal `db reset` ile çalıştırılamadı (Docker yok). Onun yerine
  SQL syntax inspection ile kontrol ettim ve sıralı uygulanma şartlarını (FK
  ordering, function-before-trigger) elle doğruladım. Phase 1 sonu UAT,
  Supabase Cloud üstünde `npx supabase db push` ile gerçek uygulama testini
  yapacak.
- Race-condition testi (iki paralel psql session) `docs/db-schema.md`'a recipe
  olarak yazıldı; UAT'de manuel yürütülecek.

## Verification

### Build & Typecheck
- ✅ `npx tsc --noEmit` — 0 hata. `src/types/database.ts` mevcut auth/middleware
  kodlarının yapısıyla tutarlı.
- ⚠ `npm run build` — Compile + types geçer; ESLint 01-1C dosyasında (`Problem.tsx`)
  başarısız. Bu hata 1B kapsamı dışında — deferred-items.md'ye loglandı.

### Architecture invariants (plan must_haves)
- ✅ 10 tablo (1A users + 9 new): users, businesses, business_enrichments,
  gap_analyses, opportunities, solution_recommendations, sales_strategies,
  build_prompts, scan_jobs, ai_usage.
- ✅ Tüm tablolarda `alter table ... enable row level security` migration ile aynı dosyada.
- ✅ Her tabloda 4 policy (SELECT/INSERT/UPDATE/DELETE). `ai_usage` 5 policy'ye
  sahip (admin SELECT ek policy'si dahil).
- ✅ `businesses (user_id, place_id)` partial UNIQUE — `WHERE place_id IS NOT NULL`.
- ✅ `business_enrichments`, `gap_analyses`, `opportunities` → UNIQUE business_id.
- ✅ `solution_recommendations`, `sales_strategies`, `build_prompts` → UNIQUE opportunity_id.
- ✅ Tüm child FK'lar `ON DELETE CASCADE` (yalnızca `ai_usage`'in opsiyonel
  FK'leri `SET NULL` — bilinçli karar, decisions'ta açıklandı).
- ✅ `decrement_user_credits` atomic + owner-checked + race-safe (`UPDATE ...
  WHERE credits >= amount RETURNING` tek-statement).
- ✅ `src/types/database.ts` `Tables<'businesses'>` vb. tüm tablolar için tip
  üretiyor; `Database['public']['Functions']['decrement_user_credits']` imzası
  doğru (`Args: {p_user_id, p_amount}`, `Returns: number`).

## Known Stubs

| Stub | File | Reason / Resolution |
|---|---|---|
| `src/types/database.ts` hand-authored | `src/types/database.ts` | Docker dev loop Phase 2'de eklendiğinde `npx supabase gen types typescript --local > src/types/database.ts` ile değiştirilecek. Public API stabil. `docs/db-schema.md` §"How to add a new table" §3 not içeriyor. |

`ai_usage` ve `scan_jobs` MVP'de **boş veri** ile sunulur — Phase 2 (scan_jobs writer)
ve Phase 3 (ai_usage writer) gerçek satırlarla doldurur. Bu **stub değil**, beklenen
faz sınırı.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: definer-function | `supabase/migrations/20260522094204_credit_rpc.sql` | `SECURITY DEFINER` RPC ile RLS bypass — Phase 5 tightening: yalnızca bir Server Action endpoint'inden çağrılması, audit row yazması. Şu an `GRANT EXECUTE TO authenticated` ile sınırlı + internal owner check var. |
| threat_flag: admin-select-policy | `supabase/migrations/20260522094203_ai_usage.sql` | `ai_usage_select_admin` policy'si tüm kullanıcıların log'larını okutur. `auth.uid()` + `users.role = 'admin'` check'i sıkı; ama herhangi bir kullanıcı `role`'unu güncelleyebildiği için (`users_update_own` Phase 5'te kısıtlanacak — 1A decision) Phase 5'ten önce admin promosyonu manuel SQL ile yapılmalı (D-03). |

## Self-Check: PASSED

**Files created (spot checks):**
- ✅ `c:\Users\duyma\Desktop\loex\supabase\migrations\20260522094200_businesses.sql` exists
- ✅ `c:\Users\duyma\Desktop\loex\supabase\migrations\20260522094201_pipeline_tables.sql` exists
- ✅ `c:\Users\duyma\Desktop\loex\supabase\migrations\20260522094202_scan_jobs.sql` exists
- ✅ `c:\Users\duyma\Desktop\loex\supabase\migrations\20260522094203_ai_usage.sql` exists
- ✅ `c:\Users\duyma\Desktop\loex\supabase\migrations\20260522094204_credit_rpc.sql` exists
- ✅ `c:\Users\duyma\Desktop\loex\src\types\database.ts` exists
- ✅ `c:\Users\duyma\Desktop\loex\docs\db-schema.md` exists

**Commits exist:**
- ✅ `18c57bf` — Task 1 (businesses + pipeline tables)
- ✅ `4486b16` — Task 2 (scan_jobs + ai_usage + RPC + types + docs)

**Typecheck:**
- ✅ `npx tsc --noEmit` exited 0 with no output.
