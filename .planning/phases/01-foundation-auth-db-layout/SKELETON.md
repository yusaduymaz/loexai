---
phase: 01-foundation-auth-db-layout
type: walking-skeleton
purpose: "Tracer bullet — the thinnest end-to-end working slice. All subsequent plans (1A..1D) extend this skeleton."
---

# SKELETON.md — LoexAI Walking Skeleton

> Bu dosya Phase 1'in **mimari iskeletini** sabitler. Buradaki kararlar değiştirilemez —
> sonraki tüm plan'lar (1A, 1B, 1C, 1D) ve sonraki tüm faz'lar bu iskeletin üstüne inşa edilir.
> Kararlar değişirse migration ve refactor pahalıya patlar.

---

## Skeleton Hedefi (Tek Cümle)

> Yeni bir kullanıcı `/register`'dan kayıt olabilir, `/login`'den giriş yapabilir,
> korumalı `/dashboard` sayfasında **kendi email'ini ve DB'den okunan `credits=20`**'i görür,
> Vercel dev URL'inden bu akış canlıdır.

Bu, "ürün çalışıyor mu" testidir. 1A..1D bunun üstüne özellik ekler.

---

## 1. Locked Architectural Decisions

Aşağıdaki kararlar `CLAUDE.md`, `.planning/research/STACK.md` ve `01-CONTEXT.md`'den
çıkarılmıştır. Bu Phase 1'de doğrulanır ve **sonraki tüm faz'lar için bağlayıcıdır**.

### 1.1 Framework & Language

| Karar | Değer | Kaynak |
|---|---|---|
| Framework | Next.js 15+ App Router | CLAUDE.md §10 |
| Language | TypeScript strict (no unjustified `any`) | CLAUDE.md §20 |
| Package manager | `npm` | Convention; lockfile sabit kalır |
| Node version | LTS (20.x+) | Next.js 15 gereksinimi |
| Styling | Tailwind CSS v3 + DESIGN.md token'ları | CLAUDE.md §10, DESIGN.md |
| UI primitives | shadcn/ui (vendorize edilir) | RESEARCH STACK §5 |
| Icons | Lucide + Material Symbols Outlined (HTML örneklerinde Material kullanılıyor) | DESIGN.md, tasarimornegi/*.html |
| Animation | Framer Motion | CLAUDE.md §10 |
| Charts | shadcn chart + Recharts v3 (Phase 3+ aktif) | RESEARCH STACK §5 |
| Font | Geist (body), JetBrains Mono (data) | DESIGN.md |

### 1.2 Backend & Auth

| Karar | Değer | Kaynak |
|---|---|---|
| Backend | Supabase (PostgreSQL + Auth + Storage) | CLAUDE.md §10 |
| Auth package | `@supabase/ssr` (NOT `auth-helpers-nextjs`) | RESEARCH STACK §1, PITFALL N15-1 |
| Server-side validation | `supabase.auth.getClaims()` — **NEVER** `getSession()` | RESEARCH STACK §1 |
| Session refresh | Middleware proxy pattern (token refresh per request) | RESEARCH STACK §1 |
| Admin detection | `users.role` text column (default `'user'`) | CONTEXT D-01..03 |
| First admin | Promoted via Supabase Dashboard SQL — no seeder | CONTEXT D-03 |
| RLS | Enabled on every table; policies in same migration as table | PITFALL §RLS-1 |
| Service role key | Server-only; never `NEXT_PUBLIC_` prefix; `import "server-only"` | PITFALL §RLS-2 |

### 1.3 Queue & Cache (provisioning only in Phase 1)

| Karar | Değer | Kaynak |
|---|---|---|
| Pipeline orchestrator | Upstash Workflow (`@upstash/workflow`) | RESEARCH STACK §2, ARCH §Multi-Step |
| Cache & rate limit | Upstash Redis | CLAUDE.md §10 |
| Phase 1 scope | Env provisioned + placeholder workflow file; no active steps | CONTEXT — Claude's Discretion |

### 1.4 AI (NOT integrated in Phase 1 — provisioned only)

| Karar | Değer | Kaynak |
|---|---|---|
| Provider abstraction | `lib/ai/AIProvider` interface (CREATED in Phase 1, IMPLEMENTED in Phase 3) | CLAUDE.md §9 |
| Dev provider | OpenRouter, pinned model `openai/gpt-oss-120b` | RESEARCH STACK §3 |
| Prod provider | Anthropic Claude API | CLAUDE.md §10 |
| Prompts | Files under `lib/prompts/` (NOT DB) | CLAUDE.md §10, §20 |
| Validation | Zod on every AI response | CLAUDE.md §8, §20 |
| Usage logging | `ai_usage` table (CREATED in Phase 1, WRITTEN in Phase 3) | CLAUDE.md §9, §11 |

### 1.5 Deployment

| Karar | Değer | Kaynak |
|---|---|---|
| Frontend host | Vercel (dev preview URL'i Phase 1 sonunda canlı olmalı) | CLAUDE.md §10 |
| DB host | Supabase Cloud | CLAUDE.md §10 |
| Env management | `.env.local` (gitignored), `.env.example` (committed) | CLAUDE.md §17 |
| Schema source of truth | `supabase/migrations/` — never direct DB edits | CLAUDE.md §11 |

---

## 2. Directory Layout (Locked)

Aşağıdaki yapı `CLAUDE.md §15`'in expansion'ıdır. Sonraki tüm faz'lar bu ağacın
**altına** ekleme yapar; üst seviye klasörleri yeniden adlandırmaz.

```text
loex/
├── .env.example                    # Committed — keys boş ama dolu liste
├── .env.local                      # gitignored — gerçek key'ler
├── CLAUDE.md                       # Architecture spec (BINDING)
├── DESIGN.md                       # Design tokens (BINDING)
├── README.md                       # docs/admin-setup.md notu içerir
├── docs/
│   └── admin-setup.md              # "İlk admin nasıl promote edilir" (D-03)
├── middleware.ts                   # Tek auth+role middleware (D-02)
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts              # DESIGN.md token'ları map edilmiş
├── tsconfig.json                   # strict: true
├── supabase/
│   ├── config.toml
│   └── migrations/
│       └── YYYYMMDDHHMMSS_init_schema.sql   # 10 tablo + RLS (PLAN-1B)
├── public/
└── src/
    ├── app/
    │   ├── (marketing)/            # Public route group — landing, pricing, FAQ
    │   │   ├── layout.tsx
    │   │   ├── page.tsx            # Landing (PLAN-1C)
    │   │   └── pricing/page.tsx
    │   ├── (auth)/                 # Auth route group — login, register, callback
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   ├── register/page.tsx
    │   │   └── logout/route.ts
    │   ├── (dashboard)/            # Authenticated route group
    │   │   ├── layout.tsx          # Sidebar + header (PLAN-1D)
    │   │   └── dashboard/
    │   │       ├── page.tsx        # Overview (PLAN-1D)
    │   │       ├── discovery/page.tsx        # Coming-soon dim shell
    │   │       ├── opportunities/page.tsx    # Coming-soon dim shell
    │   │       ├── business/[id]/page.tsx    # Phase 4 placeholder
    │   │       ├── campaigns/page.tsx        # Coming-soon dim shell
    │   │       ├── prompt-studio/page.tsx    # Coming-soon dim shell
    │   │       ├── saved/page.tsx            # Coming-soon dim shell
    │   │       ├── crm/page.tsx              # Coming-soon dim shell
    │   │       ├── analytics/page.tsx        # Coming-soon dim shell
    │   │       └── settings/page.tsx         # Coming-soon dim shell
    │   ├── (admin)/                # Admin route group — role='admin' only
    │   │   ├── layout.tsx          # Admin sidebar (PLAN-1D)
    │   │   └── admin/
    │   │       ├── page.tsx        # User list (read-only Phase 1)
    │   │       ├── users/page.tsx
    │   │       ├── usage/page.tsx  # ai_usage read-only viewer
    │   │       ├── jobs/page.tsx   # scan_jobs placeholder
    │   │       └── templates/page.tsx
    │   ├── api/
    │   │   └── workflow/
    │   │       └── pipeline/route.ts        # Placeholder Workflow file (PLAN-1D)
    │   ├── layout.tsx              # Root layout — font, theme provider
    │   ├── globals.css             # Tailwind base + DESIGN.md CSS vars
    │   └── not-found.tsx
    ├── components/
    │   ├── ui/                     # shadcn vendorized primitives (button, input, card, tooltip, badge, dialog)
    │   ├── landing/                # Hero, Problem, HowItWorks, Pricing, FAQ, CTA, DashboardPreview (PLAN-1C)
    │   ├── auth/                   # LoginForm, RegisterForm (PLAN-1C)
    │   ├── dashboard/              # Sidebar, Header, CreditBadge, NavItem, ComingSoonItem (PLAN-1D)
    │   └── admin/                  # AdminSidebar, AdminHeader (PLAN-1D)
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts           # createBrowserClient — for Client Components
    │   │   ├── server.ts           # createServerClient — for Server Components/Actions/Route Handlers
    │   │   ├── middleware.ts       # updateSession helper — used by root middleware.ts
    │   │   └── admin.ts            # service-role client; `import "server-only"` (PLAN-1D)
    │   ├── ai/                     # PHASE 3 — interface + types only in Phase 1 (placeholder)
    │   │   └── types.ts            # AIProvider interface skeleton (not implemented)
    │   ├── discovery/              # PHASE 2 — empty in Phase 1
    │   ├── enrichment/             # PHASE 3 — empty in Phase 1
    │   ├── scoring/                # PHASE 3 — empty in Phase 1
    │   ├── templates/              # PHASE 3 — empty in Phase 1
    │   ├── prompts/                # PHASE 3+ — empty in Phase 1
    │   ├── validators/             # Zod schemas — auth schemas in Phase 1
    │   │   └── auth.ts
    │   ├── workflow/               # Upstash Workflow wrapper (placeholder in Phase 1)
    │   │   └── client.ts
    │   ├── redis/                  # Upstash Redis wrapper (placeholder in Phase 1)
    │   │   └── client.ts
    │   ├── credits.ts              # Atomic credit decrement RPC wrapper (Phase 2 uses)
    │   ├── auth/
    │   │   ├── get-user.ts         # Server-side: read user + role + credits from claims + DB
    │   │   └── require-role.ts     # Helper: throw/redirect if role mismatch
    │   ├── design/
    │   │   └── tokens.ts           # TypeScript export of DESIGN.md tokens (used by components)
    │   └── utils.ts                # cn() helper for shadcn
    ├── types/
    │   ├── database.ts             # Generated from supabase (PLAN-1B output)
    │   └── domain.ts               # BusinessLead, OpportunityScore, etc. (cross-phase types — from CLAUDE.md §7)
    ├── hooks/                      # Client-side hooks (Phase 2+)
    └── server/                     # Server-only utilities (Phase 2+)
```

**Sözleşme:**
- Yeni external service için `lib/{service-name}/` altında interface + implementation
- Yeni Zod şeması için `lib/validators/{domain}.ts`
- Yeni component için `components/{domain}/{Component}.tsx`
- Yeni sayfa için route group'a uygun konum
- `src/app/(marketing)`, `(auth)`, `(dashboard)`, `(admin)` group'ları **boyut değiştirmez**

---

## 3. Environment Variables (Locked List)

`.env.example` aşağıdaki tüm anahtarları (boş değerle) içerir. `.env.local` gerçek
değerleri tutar ve commit edilmez. CLAUDE.md §17 kaynağıdır; aşağıda Phase 1
provisioning sınırı işaretlenmiştir.

```env
# ── App ────────────────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ── Supabase (Phase 1 — ACTIVE) ────────────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=        # NEW publishable key format (not legacy ANON)
SUPABASE_SERVICE_ROLE_KEY=                   # server-only — NO NEXT_PUBLIC_ prefix

# ── AI (Phase 3 — provisioned only in Phase 1) ─────────────────────────
AI_PROVIDER=openrouter_free                  # openrouter_free | anthropic
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
OPENROUTER_FREE_MODEL=openai/gpt-oss-120b    # pinned default

# ── Discovery (Phase 2 — provisioned only in Phase 1) ─────────────────
DISCOVERY_PROVIDER=google_places             # google_places | rapidapi
GOOGLE_PLACES_API_KEY=
RAPIDAPI_KEY=

# ── Queue / Cache (Phase 1 — provisioned, not active) ─────────────────
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
UPSTASH_QSTASH_TOKEN=
UPSTASH_WORKFLOW_URL=                        # base URL Workflow callbacks vurur (dev: ngrok / Vercel preview)
QSTASH_CURRENT_SIGNING_KEY=
QSTASH_NEXT_SIGNING_KEY=

# ── Stripe (Phase 5 — provisioned only) ───────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

**Kural:** `NEXT_PUBLIC_` öneki **yalnızca** `SUPABASE_URL` ve `SUPABASE_PUBLISHABLE_KEY`
için kullanılır. Başka hiçbir secret bu prefix'i almaz.

---

## 4. Auth Flow (End-to-End — Phase 1 Implements This)

```
[Browser] → GET /register
   ↓
[(auth)/register/page.tsx — Server Component] renders <RegisterForm />
   ↓
[<RegisterForm /> — Client Component] submits to Server Action `registerAction()`
   ↓
[Server Action]
   1. Zod validate {email, password}
   2. supabase.auth.signUp({email, password})
   3. on signUp success: Supabase trigger `handle_new_user()` (defined in migration)
      inserts row into public.users with credits=20, role='user'
   4. redirect("/dashboard")
   ↓
[middleware.ts]
   1. createServerClient (cookie-based)
   2. supabase.auth.getClaims() → if null → redirect("/login")
   3. for /admin/* → read users.role → if != 'admin' → redirect("/dashboard")
   ↓
[(dashboard)/dashboard/page.tsx — Server Component]
   1. lib/auth/get-user.ts → returns {id, email, role, credits}
   2. renders sidebar (with credit badge), header, overview cards (Phase 1: zeros + CTA)
```

**Critical Phase 1 invariants:**
1. `handle_new_user()` Postgres trigger atomically inserts the public.users row when
   Supabase Auth creates an auth.users row. Without this trigger, the user signs up
   but has no `credits` field — checking credits later throws.
2. Middleware NEVER calls `getSession()`. It calls `getClaims()` which validates JWT.
3. Service role client is imported ONLY in `lib/supabase/admin.ts` with `import "server-only"`
   at the top — any accidental client-side import becomes a build error.

---

## 5. Database Schema (Conceptual — PLAN-1B implements)

**10 tablo, hepsi RLS ON, hepsi `users.id` üzerinden user-scoped:**

```
users                      (id, email, role, credits, created_at)
  ↓ user_id
businesses                 (id, user_id, place_id, name, ..., raw_data jsonb)
  ↓ business_id
business_enrichments       (id, business_id, has_website, ..., enrichment_data jsonb)
gap_analyses               (id, business_id, gaps jsonb, severity_score, summary)
opportunities              (id, business_id, opportunity_score, priority, status, ...)
  ↓ opportunity_id
solution_recommendations   (id, business_id, opportunity_id, offers jsonb)
sales_strategies           (id, business_id, opportunity_id, cold_email, pitch, ...)
build_prompts              (id, business_id, opportunity_id, prompt_body, target_tool)

scan_jobs                  (id, user_id, location, category, status, ...)
ai_usage                   (id, user_id, business_id?, stage, model, tokens, cost_usd)
```

**Constraints (binding):**
- `businesses (user_id, place_id) UNIQUE` — dedup
- All downstream pipeline tables: `business_id` UNIQUE (idempotent upsert)
- All FKs: `ON DELETE CASCADE` (parent gone → child gone)
- Trigger `handle_new_user()` on `auth.users` AFTER INSERT → inserts to `public.users` with `credits=20, role='user'`
- Atomic credit decrement RPC: `decrement_user_credits(user_id uuid, amount int)` —
  `UPDATE users SET credits = credits - amount WHERE id = $1 AND credits >= amount RETURNING credits`

---

## 6. UI System (Locked Tokens)

- Tailwind config DESIGN.md token'larını **birebir** map eder (renkler, font'lar, spacing, rounded)
- CSS değişkenleri `globals.css` üstünde — shadcn primitives ile uyumlu
- Dark mode varsayılan (`class="dark"` on `<html>`). Light mode Phase 1'de **yok** (CONTEXT — Deferred).
- Geist + JetBrains Mono Google Fonts üzerinden veya `next/font` ile. `next/font` tercih edilir.
- Material Symbols Outlined (HTML referansları kullanıyor) — Google Fonts CSS ile yüklenir.
- Sidebar Surface = `bg-surface-container-low` (#0b1c30), aktif item solunda 4px `primary` çubuk.
- Card = `bg-surface-container` + 1px `outline-variant` border + soft ambient shadow.
- Primary button = linear gradient `from-primary to-secondary`, white text, `rounded-md` (8px).

---

## 7. Walking Skeleton Acceptance Checklist

Aşağıdakilerin tümü Phase 1 sonunda **gözle doğrulanır** (manuel UAT — Turkish):

- [ ] `npm install` → `npm run dev` → http://localhost:3000 landing açılır (Hero görünür)
- [ ] `/register` → email+password → submit → otomatik `/dashboard`'a yönlenir
- [ ] Supabase Dashboard → Auth users + public.users tablosunda satır var, `credits=20`, `role='user'`
- [ ] `/dashboard` sidebar'da "20 credits" yazıyor, header'da "20" badge'i var
- [ ] Logout → `/login`'e döner
- [ ] Logout'ken `/dashboard` URL'sini elle aç → `/login`'e redirect
- [ ] Supabase SQL'de `UPDATE users SET role='admin' WHERE email='myduymaz1980@gmail.com';`
- [ ] Admin user `/admin` açabiliyor; user role admin değilse `/admin` → `/dashboard` redirect
- [ ] `/admin/usage` `ai_usage` tablosunu boş listeyle gösterir (tablo var ama 0 satır)
- [ ] `vercel deploy` çalışıyor, preview URL üstünde aynı akış geçiyor
- [ ] `.env.example` 1:1 `.env.local` ile uyumlu (key isimleri eşleşir)

---

## 8. Out of Scope for This Skeleton

- Password reset, OAuth, magic link — CONTEXT Deferred
- Light mode — CONTEXT Deferred
- Active AI calls — Phase 3
- Active scan / discovery — Phase 2
- Stripe — Phase 5
- Real industry templates (admin view-only is enough) — ADM-03 minimum
- Active Upstash Workflow steps — sadece env + placeholder dosya

---

## 9. Cross-Plan Dependency Map

```
SKELETON.md (this file — establishes layout, tokens, env list)
   ├──> PLAN-1A : Next.js init + Supabase wiring + middleware + handle_new_user trigger
   │       │
   │       └──┐
   │          ▼
   ├──> PLAN-1B : All 10 migrations + RLS policies + credit RPC + DB types regen
   │       │
   │       ├──> PLAN-1C : Landing + auth pages (depends on 1A; SAFE to start parallel)
   │       │
   │       └──> PLAN-1D : Dashboard + Admin layouts + Upstash provisioning
   │                       (depends on 1A AUTH + 1B TABLES — must wait for both)
```

**Wave structure:**
- Wave 1: 1A (foundation)
- Wave 2: 1B and 1C in parallel (1B touches `supabase/`, 1C touches `src/app/(marketing)` + `src/app/(auth)` — no file overlap)
- Wave 3: 1D (depends on both 1A auth wiring and 1B tables)
