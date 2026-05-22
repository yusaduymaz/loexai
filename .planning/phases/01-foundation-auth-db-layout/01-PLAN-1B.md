---
phase: 01-foundation-auth-db-layout
plan: 1B
title: "Supabase migrations — 10 tables + RLS policies + atomic credit RPC"
type: execute
wave: 2
mode: mvp
depends_on:
  - 1A   # needs Supabase project wired + public.users table from 1A's handle_new_user migration
parallel_safe_with:
  - 1C   # 1B touches supabase/, 1C touches src/app/(marketing) + src/app/(auth) — no file overlap
files_modified:
  - supabase/migrations/<ts>_businesses.sql
  - supabase/migrations/<ts>_pipeline_tables.sql       # business_enrichments, gap_analyses, opportunities, solution_recommendations, sales_strategies, build_prompts
  - supabase/migrations/<ts>_scan_jobs.sql
  - supabase/migrations/<ts>_ai_usage.sql
  - supabase/migrations/<ts>_credit_rpc.sql            # decrement_user_credits atomic function
  - src/types/database.ts                              # supabase gen types --local output
  - src/types/domain.ts                                # extend with row types if needed
  - docs/db-schema.md                                  # short reader's reference to migration intent
autonomous: false                                       # ends in human-verify checkpoint
requirements:
  - FOUND-05   # default credits=20 (handled in 1A; this plan keeps it intact + RPC for decrement)
  - FOUND-06   # backend credit check (this plan ships atomic decrement; Phase 2 wires the call)
  - FOUND-07   # ai_usage table created
  - FOUND-08   # RLS on every table
must_haves:
  truths:
    - "10 tablo (users + 9 yeni) DB'de mevcut ve RLS aktif"
    - "Tüm tablolarda 4 policy (SELECT/INSERT/UPDATE/DELETE) tanımlı; cross-user erişim engellendiği test edildi"
    - "businesses (user_id, place_id) UNIQUE — aynı işletme iki kez kaydedilemez"
    - "opportunities tablosu business_id UNIQUE (MVP'de işletme başına tek fırsat); solution_recommendations / sales_strategies / build_prompts ise opportunity_id UNIQUE — idempotent upsert garantili (CLAUDE.md §11: bunlar 1—1 with opportunity)"
    - "Tüm child FK'lar ON DELETE CASCADE"
    - "decrement_user_credits RPC atomik — race condition'da iki request birden geçemez"
  artifacts:
    - path: "supabase/migrations/<ts>_businesses.sql"
      provides: "businesses tablosu + (user_id,place_id) UNIQUE + RLS (4 policy)"
    - path: "supabase/migrations/<ts>_pipeline_tables.sql"
      provides: "business_enrichments + gap_analyses + opportunities (each UNIQUE business_id); solution_recommendations + sales_strategies + build_prompts (each UNIQUE opportunity_id per CLAUDE.md §11). RLS via business→user_id join."
    - path: "supabase/migrations/<ts>_scan_jobs.sql"
      provides: "scan_jobs tablosu + user-scoped RLS + status enum (queued/running/completed/partial/failed)"
    - path: "supabase/migrations/<ts>_ai_usage.sql"
      provides: "ai_usage tablosu — user_id + opsiyonel business_id + stage/model/tokens/cost — admin için aggregate query'lere hazır indeksli"
    - path: "supabase/migrations/<ts>_credit_rpc.sql"
      provides: "decrement_user_credits(p_user_id uuid, p_amount int) RETURNS int — atomic check+decrement; returns new balance or -1 if insufficient"
    - path: "src/types/database.ts"
      provides: "supabase gen types --local çıktısı; tüm tablolar için typed insert/update/row"
  key_links:
    - from: "businesses.user_id"
      to: "public.users.id ON DELETE CASCADE"
      via: "FK + RLS policy: business satırı yalnızca owning user'ın user_id'sine eşitse okunur/yazılır"
    - from: "business_enrichments / gap_analyses / opportunities (business_id)"
      to: "businesses.id ON DELETE CASCADE"
      via: "FK; RLS user erişimi `business.user_id = auth.uid()` join'i üzerinden"
    - from: "Phase 2+ scan flow"
      to: "rpc('decrement_user_credits', ...)"
      via: "atomic credit check before enqueue (PITFALL §Credit-1)"
---

## Canonical References

**MUST READ before starting any task:**

1. `CLAUDE.md` §11 — Conceptual data model + relationship map (tüm tablolar ve sorumlulukları)
2. `CLAUDE.md` §16 — Security rules (RLS, service-role, AI çıktı doğrulama)
3. `.planning/research/ARCHITECTURE.md` §"Idempotent Pipeline Design" — UPSERT pattern, business_id UNIQUE constraint
4. `.planning/research/PITFALLS.md` §"Supabase RLS Security Holes" #1, #3, #4 + §"Credit System Mistakes" #1
5. `.planning/research/STACK.md` §4 — Supabase Edge Function limits (sadece bilgi amaçlı; bu plan trigger'a girmiyor)
6. `.planning/phases/01-foundation-auth-db-layout/01-CONTEXT.md` — D-01 (role kolonu zaten 1A'da)
7. `.planning/phases/01-foundation-auth-db-layout/SKELETON.md` §5 — şema diagramı + binding constraint'ler
8. `01-PLAN-1A.md` — `public.users` zaten oluşturuldu; bu plan onun üstüne 9 tablo daha ekler

---

## Objective

Tüm 10 tabloyu, RLS politikalarını, idempotent UPSERT constraint'lerini ve atomic
credit decrement RPC'sini tek bir migration setiyle teslim eder. Phase 1 success
criterion #3 (10 tablo + RLS) ve #4 (credits=20 default — DB tarafı tamamı) bu plan
tarafından **TAM** satisfy edilir. FOUND-06 (atomic credit check) için RPC hazır,
Phase 2 wire eder.

**Tasarım kuralları (bağlayıcı — PITFALL'den):**
- Her tablo migration'ı: tablo + RLS enable + 4 policy aynı dosyada (PITFALL §RLS-1)
- View kullanmaktan KAÇIN; gerekirse `WITH (security_invoker = true)` (PITFALL §RLS-3)
- RPC fonksiyonları `SECURITY INVOKER` (default) — yalnızca atomic credit decrement
  `SECURITY DEFINER` olabilir (gerçek atomic operasyon için), bu durumda RLS bypass
  ettiği AÇIKÇA dokümante edilir ve fonksiyon `auth.uid()` ile owner check yapar.

---

## Tasks

### Task 1: businesses + pipeline tables migration  *(L)*

**Files:**
- `supabase/migrations/<ts>_businesses.sql`
- `supabase/migrations/<ts>_pipeline_tables.sql`

**Action:**
1. **`businesses` tablosu** (single migration file):
   - Kolonlar: `id uuid PK default gen_random_uuid()`, `user_id uuid not null references public.users(id) on delete cascade`, `place_id text`, `source text not null check (source in ('google_maps','manual','import'))`, `name text not null`, `category text`, `address text`, `city text`, `country text`, `phone text`, `website text`, `google_maps_url text`, `rating numeric(3,2)`, `review_count int`, `opening_hours jsonb`, `photos jsonb`, `social_links jsonb`, `raw_data jsonb`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`
   - UNIQUE: `(user_id, place_id) WHERE place_id IS NOT NULL` (partial unique — manuel/import girişlerinde place_id null olabilir)
   - Index: `idx_businesses_user_id (user_id)`, `idx_businesses_user_category (user_id, category)`
   - `updated_at` için trigger: `BEFORE UPDATE SET updated_at = now()`
   - RLS enable + 4 policy: hepsi `auth.uid() = user_id`
   - **Yorumlar:** her policy üstüne `-- WHY: user can only see/modify own businesses (PITFALL §RLS-1)`

2. **`pipeline_tables` migration** (6 tablo, tek dosyada okunabilirlik için):
   Her biri aynı şablonu izler:
   - `id uuid PK default gen_random_uuid()`
   - `business_id uuid not null references public.businesses(id) on delete cascade`
   - **UNIQUE constraint per CLAUDE.md §11 relationship map:**
     - `business_enrichments`, `gap_analyses`, `opportunities` → `UNIQUE (business_id)` (1—1 with business; MVP'de işletme başına tek fırsat)
     - `solution_recommendations`, `sales_strategies`, `build_prompts` → `UNIQUE (opportunity_id)` (1—1 with opportunity, NOT business — bu tablolar opportunity'ye bağlı, business'e değil)
   - Idempotent upsert garantisi (ARCH §Idempotent) doğru parent ID üzerinden işler
   - tablo-spesifik jsonb/text alanlar (CLAUDE.md §11):
     - **business_enrichments**: `has_website boolean`, `has_instagram boolean`, `has_reservation_system boolean`, `has_whatsapp_cta boolean`, `mobile_experience text`, `brand_quality text`, `digital_maturity_score int check (digital_maturity_score between 0 and 100)`, `enrichment_data jsonb`, `website_status text` (PITFALL §Web-1: blocked/timeout/ok/fetch_failed)
     - **gap_analyses**: `gaps jsonb not null`, `severity_score int`, `summary text`
     - **opportunities**: `opportunity_score int check (opportunity_score between 0 and 100)`, `priority text check (priority in ('low','medium','high','urgent'))`, `close_probability numeric(4,3)`, `estimated_deal_value_min numeric`, `estimated_deal_value_max numeric`, `estimated_deal_value_currency text check (currency in ('USD','EUR','TRY'))`, `reasoning text`, `status text not null default 'new' check (status in ('new','analyzed','saved','contacted','proposal_sent','won','lost'))`
     - **solution_recommendations**: `opportunity_id uuid not null references public.opportunities(id) on delete cascade`, `primary_offer jsonb`, `secondary_offers jsonb`, `upsell_offers jsonb`
     - **sales_strategies**: `opportunity_id uuid not null references public.opportunities(id) on delete cascade`, `short_pitch text`, `cold_email text`, `instagram_dm text`, `whatsapp_message text`, `discovery_call_opener text`, `objection_handling jsonb`, `proposal_summary text`, `value_proposition text`
     - **build_prompts**: `opportunity_id uuid not null references public.opportunities(id) on delete cascade`, `prompt_body text not null`, `target_tool text check (target_tool in ('claude','cursor'))`, `tech_stack jsonb`
   - `created_at`, `updated_at` her tabloda standart + updated_at trigger
   - RLS enable + 4 policy. SELECT/UPDATE/DELETE policy join üzerinden:
     ```sql
     using (
       exists (
         select 1 from public.businesses b
         where b.id = business_id and b.user_id = auth.uid()
       )
     )
     ```
     INSERT policy `with check` aynı join'i kullanır.
   - **Yorumlar her policy üstünde** — neden bu join (PITFALL §RLS-4: write policy'ler ayrıca tanımlanmalı).

**Verify:**
- `npx supabase db reset --local` (veya remote için `db push`) tüm migration'ları sıralı uygular, hata yok
- `psql`: `\d public.businesses` çıktısında `(user_id, place_id)` partial unique index görünür
- `select tablename, rowsecurity from pg_tables where schemaname='public'` — tüm tablolar `rowsecurity=true`
- `select policyname, cmd from pg_policies where schemaname='public'` — her tablo için 4 policy
- `\d public.solution_recommendations` / `\d public.sales_strategies` / `\d public.build_prompts` çıktısında UNIQUE constraint **`opportunity_id`** üzerinde (business_id DEĞİL)
- `\d public.opportunities` / `\d public.business_enrichments` / `\d public.gap_analyses` çıktısında UNIQUE constraint `business_id` üzerinde
- Manuel RLS testi (psql veya Supabase SQL Editor):
  1. Kullanıcı A (`set local "request.jwt.claims" = '{"sub":"<uuid-A>"}'`) bir `businesses` satırı insert eder
  2. Kullanıcı B (`set local "request.jwt.claims" = '{"sub":"<uuid-B>"}'`) `select * from businesses` çalıştırır — sıfır satır döner (cross-user okuma engelli)
  3. Kullanıcı B `update businesses set name='x' where id='<A's row id>'` çalıştırır — 0 row updated
  4. Kullanıcı B `delete from businesses where id='<A's row id>'` — 0 row deleted

**Done:** businesses + 6 pipeline tablosu RLS açık, idempotent UNIQUE constraint'leri yerinde, cross-user erişim manuel olarak engellendi.

---

### Task 2: scan_jobs + ai_usage + credit RPC + type generation  *(M)*

**Files:**
- `supabase/migrations/<ts>_scan_jobs.sql`
- `supabase/migrations/<ts>_ai_usage.sql`
- `supabase/migrations/<ts>_credit_rpc.sql`
- `src/types/database.ts`
- `src/types/domain.ts` (extend)
- `docs/db-schema.md`

**Action:**
1. **`scan_jobs`**:
   - Kolonlar: `id uuid PK`, `user_id uuid not null references public.users(id) on delete cascade`, `location text not null`, `category text not null`, `radius_m int not null check (radius_m > 0)`, `status text not null default 'queued' check (status in ('queued','running','completed','partial','failed'))`, `found_count int not null default 0`, `analyzed_count int not null default 0`, `error_count int not null default 0`, `error_message text`, `started_at timestamptz`, `completed_at timestamptz`, `created_at timestamptz default now()`
   - Index: `idx_scan_jobs_user_status (user_id, status)`, `idx_scan_jobs_created (user_id, created_at desc)`
   - RLS enable + 4 policy: `auth.uid() = user_id`

2. **`ai_usage`**:
   - Kolonlar: `id uuid PK`, `user_id uuid not null references public.users(id) on delete cascade`, `business_id uuid references public.businesses(id) on delete set null`, `scan_job_id uuid references public.scan_jobs(id) on delete set null`, `stage text not null` (enrichment_summary, gap_summary, scoring_reasoning, solution_rec, sales_strategy, build_prompt, qa), `model text not null`, `provider text not null check (provider in ('anthropic','openrouter_free'))`, `input_tokens int not null check (input_tokens >= 0)`, `output_tokens int not null check (output_tokens >= 0)`, `cost_usd numeric(10,6) not null default 0`, `created_at timestamptz not null default now()`
   - Indexes: `idx_ai_usage_user_date (user_id, created_at desc)`, `idx_ai_usage_job (scan_job_id)`, `idx_ai_usage_stage (stage)`
   - RLS enable + 4 policy. SELECT için iki ayrı policy:
     - `auth.uid() = user_id` (user kendi log'unu görür)
     - `exists (select 1 from public.users u where u.id = auth.uid() and u.role = 'admin')` (admin tüm log'ları görür — ADM-02)
   - INSERT policy: service role bypass eder zaten; user-side INSERT `auth.uid() = user_id`
   - UPDATE/DELETE policy: hiç kimse (`USING (false)`) — log immutable

3. **`credit_rpc` migration**:
   ```sql
   create or replace function public.decrement_user_credits(p_user_id uuid, p_amount int)
   returns int
   language plpgsql
   security definer
   set search_path = public
   as $$
   declare
     new_balance int;
   begin
     -- Owner check: caller must be the user OR admin (Phase 2 wires this from a Server Action)
     if auth.uid() is null or (auth.uid() <> p_user_id
        and not exists (select 1 from public.users where id = auth.uid() and role = 'admin')) then
       raise exception 'forbidden: not owner';
     end if;
     if p_amount <= 0 then
       raise exception 'invalid amount: %', p_amount;
     end if;
     update public.users
       set credits = credits - p_amount
       where id = p_user_id and credits >= p_amount
       returning credits into new_balance;
     if new_balance is null then
       return -1;  -- insufficient credits
     end if;
     return new_balance;
   end;
   $$;

   grant execute on function public.decrement_user_credits(uuid, int) to authenticated;
   ```
   Yorum: SECURITY DEFINER kullanılır çünkü `auth.uid()` check + atomic UPDATE tek statement içinde yapılmalı; `search_path = public` set ile search-path hijack pitfall'ından kaçınılır.

4. **`src/types/database.ts`** — `npx supabase gen types typescript --local > src/types/database.ts`. Çıktı strict.

5. **`src/types/domain.ts`** extend: `Database['public']['Tables']['businesses']['Row']` benzeri convenience type alias'ları + CLAUDE.md §7'deki domain tipleri (Row tipleriyle birebir uyumlu olduğundan emin ol).

6. **`docs/db-schema.md`** — kısa okuma rehberi: tablo listesi, RLS özet, "yeni tablo nasıl eklenir" 3-adımlı süreç (migration + RLS + types regen).

**Verify:**
- `npx supabase db reset --local` hata yok
- `select count(*) from pg_proc where proname='decrement_user_credits'` = 1
- RPC manuel test (Supabase SQL Editor, kendi user_id ile auth'lu):
  1. Başlangıç: `credits = 20`
  2. `select public.decrement_user_credits('<my-id>', 5)` → `15`
  3. Tekrar `select public.decrement_user_credits('<my-id>', 20)` → `-1` (insufficient; credits hala 15)
  4. `select public.decrement_user_credits('<another-user-id>', 1)` → exception "forbidden: not owner"
- Race condition simülasyonu (iki paralel psql session ile): kullanıcının kredisi 1; iki session aynı anda `decrement_user_credits(..., 1)` çağırır; biri 0, diğeri -1 döner — ASLA ikisi de başarılı olmaz
- `src/types/database.ts` üretildi, `tsc --noEmit` 0 hata

**Done:** scan_jobs + ai_usage tabloları RLS açık (admin SELECT policy dahil); atomic credit RPC ownership + race-safe; tüm TS tipler üretildi.

---

### Task 3 (Checkpoint): Migration + RLS UAT  *(checkpoint:human-verify)*

**What was built:**
- 10 tablo (1A'daki users + 9 yeni) hepsi RLS aktif
- 4 policy per tablo
- businesses (user_id, place_id) partial unique
- 6 pipeline tablosu business_id UNIQUE (idempotent)
- Atomic credit decrement RPC
- Tüm typed database tipleri üretildi

**How to verify:**
1. Supabase Dashboard → Database → Tables → 10 tablonun göründüğünü doğrula
2. Database → Policies → her tablo için ≥4 policy (users hariç — 3 yeterli çünkü DELETE yok)
3. SQL Editor — iki kullanıcı ile cross-user erişim testi (Task 1 verify adımlarını gerçek dashboard'da çalıştır)
4. SQL Editor — credit RPC testleri (Task 2 verify adımlarını çalıştır)
5. `select * from public.ai_usage` boş döner, hata yok
6. Localhost dev'de `npm run build` → `src/types/database.ts` typecheck'i geçer

**Resume signal:** "approved" veya hata listesi.

---

## Goal-Backward Verification

| Success Criterion (Phase 1) | Karşılanır mı? | Nasıl? |
|---|---|---|
| #3 10 tablo + RLS policies | TAM | bu plan 9 tabloyu ekler, 1A'daki `users` ile birlikte 10; tüm RLS açık ve test edildi |
| #4 credits=20 (DB tarafı) | TAM (zaten 1A) | 1A trigger korunuyor; 1B değişiklik yapmıyor |
| #5 admin için /admin açılır (DB tarafı) | TAM (DB tarafı) | `users.role` 1A'da; admin SELECT policy `ai_usage` üstünde ADM-02 için hazır |

---

## Open Questions

- Yok. CLAUDE.md §11 + ARCH §Idempotent + PITFALL §RLS hepsi karar sağlamış.


---

## Changelog

- **Fix #4 (data model correctness):** Per CLAUDE.md §11, `solution_recommendations` / `sales_strategies` / `build_prompts` are 1—1 with **opportunity**, not business. Changed their `UNIQUE` constraint from `(business_id)` to `(opportunity_id)`. Their `opportunity_id` columns are now `NOT NULL`. `opportunities` itself keeps `UNIQUE(business_id)` (one opportunity per business in MVP). Updated must_haves truths, pipeline_tables artifact description, action template, and verify steps accordingly.
