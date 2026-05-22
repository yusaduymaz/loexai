---
phase: 01-foundation-auth-db-layout
plan: 1D
title: "Dashboard layout + admin layout + credit badges + Upstash Workflow/Redis provisioning"
type: execute
wave: 3
mode: mvp
depends_on:
  - 01-1A
  - 01-1B
parallel_safe_with: []
files_modified:
  # Dashboard layout & pages
  - src/app/(dashboard)/layout.tsx
  - src/app/(dashboard)/dashboard/page.tsx                # Overview
  - src/app/(dashboard)/dashboard/discovery/page.tsx      # coming-soon dim shell
  - src/app/(dashboard)/dashboard/opportunities/page.tsx  # coming-soon dim shell
  - src/app/(dashboard)/dashboard/business/[id]/page.tsx  # placeholder (Phase 4)
  - src/app/(dashboard)/dashboard/campaigns/page.tsx
  - src/app/(dashboard)/dashboard/prompt-studio/page.tsx
  - src/app/(dashboard)/dashboard/saved/page.tsx
  - src/app/(dashboard)/dashboard/crm/page.tsx
  - src/app/(dashboard)/dashboard/analytics/page.tsx
  - src/app/(dashboard)/dashboard/settings/page.tsx       # coming-soon dim shell
  - src/components/dashboard/Sidebar.tsx
  - src/components/dashboard/Header.tsx
  - src/components/dashboard/CreditBadge.tsx              # compact + full variants
  - src/components/dashboard/NavItem.tsx
  - src/components/dashboard/ComingSoonNavItem.tsx
  - src/components/dashboard/OverviewCard.tsx
  - src/components/dashboard/EmptyState.tsx               # "Start a scan" CTA (DASH-04, D-12)
  # Admin layout & pages
  - src/app/(admin)/layout.tsx
  - src/app/(admin)/admin/page.tsx
  - src/app/(admin)/admin/users/page.tsx
  - src/app/(admin)/admin/usage/page.tsx                  # ai_usage reader (ADM-02)
  - src/app/(admin)/admin/jobs/page.tsx                   # scan_jobs reader (placeholder)
  - src/app/(admin)/admin/templates/page.tsx              # view-only (ADM-03 minimum)
  - src/components/admin/AdminSidebar.tsx
  - src/components/admin/AdminHeader.tsx
  # Upstash provisioning (placeholder — active in Phase 2+)
  - src/lib/workflow/client.ts                            # @upstash/workflow client wrapper
  - src/lib/redis/client.ts                               # @upstash/redis client wrapper
  - src/app/api/workflow/pipeline/route.ts                # placeholder serve() handler
  - src/lib/ai/types.ts                                   # AIProvider interface skeleton (Phase 3 implements)
  - src/lib/discovery/types.ts                            # DiscoveryProvider interface skeleton (Phase 2 implements)
  - .env.example                                          # ensure UPSTASH_WORKFLOW_URL etc. present (consistency with 1A)
autonomous: false                                          # ends in human-verify checkpoint
requirements:
  - DASH-01   # sidebar sections
  - DASH-02   # overview cards
  - DASH-03   # credit balance visible (sidebar + header)
  - DASH-04   # empty state "Start a scan"
  - ADM-01    # /admin: user list (Phase 1 view-only)
  - ADM-02    # ai_usage viewer
  - ADM-03    # templates view-only minimum
  - FOUND-06  # backend credit check — RPC ready from 1B; this plan WIRES the read path (badge displays)
  - FOUND-07  # ai_usage logging infra — table from 1B; this plan creates the admin reader
must_haves:
  truths:
    - "Authenticated user /dashboard'a girince sidebar + header + Overview cards görünür"
    - "Sidebar bottom'da 'X credits' (full label), header'da kompakt badge — her ikisi de live DB değeri"
    - "Credit ≤ 5: badge amber; credit = 0: badge red + scan blocked CTA"
    - "Sidebar'da tüm 10 nav item render; unbuilt olanlar dimmed + lock icon + 'Coming soon' tooltip"
    - "Overview cards (5 metric) sıfır değerlerle + 'Start a scan' empty state CTA gösterir (DASH-04, D-12)"
    - "Admin user /admin açabilir; non-admin /admin'a giderse /dashboard'a yönlendirilir"
    - "/admin/usage ai_usage tablosunu listeler (date + user + stage + tokens + cost)"
    - "Upstash Workflow placeholder route ve client wrapper provisioned; env değişkenleri .env.example'da"
  artifacts:
    - path: "src/app/(dashboard)/layout.tsx"
      provides: "Dashboard shell — requireRole('user') + sidebar + header + main area"
    - path: "src/components/dashboard/CreditBadge.tsx"
      provides: "İki variant: compact (header) ve full (sidebar bottom). Threshold-based color: default → amber@5 → red@0"
    - path: "src/app/(admin)/layout.tsx"
      provides: "Admin shell — requireRole('admin') + admin sidebar + header"
    - path: "src/app/(admin)/admin/usage/page.tsx"
      provides: "ai_usage tablosu reader; filtre: tarih aralığı + user_id; pagination"
    - path: "src/app/api/workflow/pipeline/route.ts"
      provides: "@upstash/workflow placeholder serve() handler; Phase 2+ gerçek step'leri ekler"
    - path: "src/lib/workflow/client.ts"
      provides: "Upstash Workflow client wrapper — env-driven config; getWorkflowClient() factory"
    - path: "src/lib/redis/client.ts"
      provides: "Upstash Redis wrapper — env-driven; getRedis() factory; Phase 2+ cache için kullanır"
  key_links:
    - from: "src/app/(dashboard)/layout.tsx"
      to: "lib/auth/get-user.ts"
      via: "Server Component; getUser() ile {id, email, role, credits} alır ve sidebar/header'a prop geçer"
    - from: "src/app/(dashboard)/layout.tsx"
      to: "requireRole('user')"
      via: "auth'suz veya role mismatch ise redirect (1A middleware ayrıca koruma sağlar — defense in depth)"
    - from: "src/app/(admin)/layout.tsx"
      to: "requireRole('admin')"
      via: "non-admin /admin/* girişlerde /dashboard'a redirect (1A middleware + sayfa düzeyi 2'li koruma)"
    - from: "Sidebar CreditBadge"
      to: "props.credits (passed from layout)"
      via: "no client fetch on initial paint — Server Component'tan prop; hydration mismatch riski yok (PITFALL §Next.js-3)"
---

## Canonical References

**MUST READ before starting:**

1. `DESIGN.md` — sidebar token'ları (#0b1c30 background, 4px primary left bar on active), card stilleri
2. `tasarimornegi/Dashboard-Overview.html` — **Primary visual reference** for dashboard layout (D-13)
3. `tasarimornegi/Dashboard-Lead-Discovery.html`, `Dashboard-Opportunities-List.html` — dimmed/coming-soon shell referans için
4. `.planning/phases/01-foundation-auth-db-layout/01-CONTEXT.md` — D-08..D-13 (credit display thresholds, dimmed nav, empty state)
5. `.planning/research/STACK.md` §2 — Upstash Workflow `serve()` pattern, env vars (`UPSTASH_WORKFLOW_URL`, `QSTASH_CURRENT_SIGNING_KEY` etc.)
6. `.planning/research/PITFALLS.md` §"Credit System" #2 — credit threshold UX
7. `.planning/research/ARCHITECTURE.md` §"Background Job Architecture" — Workflow placeholder layout
8. `01-PLAN-1A.md` (middleware role check), `01-PLAN-1B.md` (ai_usage admin SELECT policy)
9. `CLAUDE.md` §12 (User Dashboard + Admin route listesi), §13 (route listesi)

---

## Objective

Authenticated dashboard shell + admin shell + credit display + tüm Phase 1 sidebar
nav iskeletini teslim eder. Phase 1'in son success criterion'ları (#1 dashboard görünür,
#4 credits visible, #5 /admin admin için açılır, ai_usage görüntülenebilir) bu planda
TAM kapatılır. Ayrıca Upstash Workflow/Redis provisioning yapılır (env + placeholder
client wrapper + boş serve() handler) — Phase 2+ aktif step'leri ekleyecek.

**Tasarım kuralı (bağlayıcı):** Dashboard-Overview.html `tasarimornegi/` altındaki dosya
**primary visual reference** (D-13). Sidebar grup yapısı, kart placement, header bileşeni
bu HTML ile pariteli olmalı.

---

## Tasks

### Task 1: Dashboard layout (sidebar + header + nav items) + CreditBadge + ComingSoon shells  *(L)*

**Files:**
- `src/app/(dashboard)/layout.tsx`
- `src/components/dashboard/Sidebar.tsx`
- `src/components/dashboard/Header.tsx`
- `src/components/dashboard/CreditBadge.tsx`
- `src/components/dashboard/NavItem.tsx`
- `src/components/dashboard/ComingSoonNavItem.tsx`
- `src/components/ui/tooltip.tsx` (shadcn vendorize)
- `src/components/ui/dropdown-menu.tsx` (shadcn — header user menu)
- `src/app/(dashboard)/dashboard/discovery/page.tsx`     (dim shell)
- `src/app/(dashboard)/dashboard/opportunities/page.tsx` (dim shell)
- `src/app/(dashboard)/dashboard/business/[id]/page.tsx` (Phase 4 placeholder)
- `src/app/(dashboard)/dashboard/campaigns/page.tsx`     (dim shell)
- `src/app/(dashboard)/dashboard/prompt-studio/page.tsx` (dim shell)
- `src/app/(dashboard)/dashboard/saved/page.tsx`         (dim shell)
- `src/app/(dashboard)/dashboard/crm/page.tsx`           (dim shell)
- `src/app/(dashboard)/dashboard/analytics/page.tsx`     (dim shell)
- `src/app/(dashboard)/dashboard/settings/page.tsx`      (dim shell)

**Action:**
1. **`(dashboard)/layout.tsx`** — Server Component.
   - `const user = await requireRole('user')` (`lib/auth/require-role.ts`). Null veya admin değil-değil (user da olabilir, sadece auth'lu olmalı).
   - Layout grid: `grid-cols-[280px_1fr]` desktop; tablet'te sidebar icon-only `grid-cols-[72px_1fr]`; mobile'da sidebar drawer (`Sheet` shadcn'den) + alt nav bar.
   - `<Sidebar user={user} />` + `<div><Header user={user} /><main>{children}</main></div>`.
   - Body bg `bg-surface`, sidebar bg `bg-surface-container-low` (DESIGN.md §Sidebar).
2. **`Sidebar.tsx`** — Server Component (interaktif öğeler için `<NavItem>` Client).
   - Üstte logo + product name.
   - Aşağıdaki nav item listesi (CLAUDE.md §12 + D-11):

   | Label | Icon | Href | Status (Phase 1) |
   |---|---|---|---|
   | Overview | `LayoutDashboard` | `/dashboard` | ACTIVE |
   | Lead Discovery | `Search` | `/dashboard/discovery` | dimmed |
   | Opportunities | `Target` | `/dashboard/opportunities` | dimmed |
   | Business Reports | `FileText` | `/dashboard/business` | dimmed (no index — link disabled) |
   | Campaigns | `Megaphone` | `/dashboard/campaigns` | dimmed |
   | Prompt Studio | `Sparkles` | `/dashboard/prompt-studio` | dimmed |
   | Saved Leads | `Bookmark` | `/dashboard/saved` | dimmed |
   | CRM | `Users` | `/dashboard/crm` | dimmed |
   | Analytics | `BarChart3` | `/dashboard/analytics` | dimmed |
   | Settings | `Settings` | `/dashboard/settings` | dimmed |

   - Aktif `Overview` item: solunda 4px `bg-primary` dikey bar (DESIGN.md §Sidebar).
   - Dimmed item'lar: `opacity-50` + Lucide `Lock` icon sağda + shadcn `<Tooltip>` "Coming soon" (D-11).
   - Bottom (sticky): `<CreditBadge variant="full" credits={user.credits} />` ve altında küçük "Need more? Upgrade" link (Phase 5'te aktif olur; Phase 1'de disabled).
3. **`Header.tsx`** — Server Component (user menu Client).
   - Sol: breadcrumb veya sayfa başlığı (mobile için hamburger trigger).
   - Sağ: `<CreditBadge variant="compact" credits={user.credits} />` + `<DropdownMenu>` (user email + Log out form butonu POST `/logout`).
   - bg `bg-surface-container-lowest` + 1px alt border `border-outline-variant`.
4. **`CreditBadge.tsx`** — `"use client"` değil; pure render Server Component.
   - Props: `{ credits: number, variant: 'full' | 'compact' }`.
   - Renk eşiği:
     - `credits === 0`: `bg-error-container/20 text-error border-error/40` (red)
     - `credits <= 5`: `bg-amber-500/15 text-amber-300 border-amber-500/40` (D-09)
     - else: `bg-surface-container text-on-surface border-outline-variant`
   - `full`: pill `rounded-full px-3 py-1.5` — "**20** credits" (sayı JetBrains Mono `data-mono`)
   - `compact`: yuvarlak badge `rounded-full w-9 h-9 flex items-center justify-center` — "20" sayısı JetBrains Mono
   - 0 durumunda full variant alt satırı `<Link>` "Upgrade" CTA gösterir; compact variant ise tooltip "No credits — upgrade".
5. **`NavItem.tsx`** — `"use client"` (active route detection için `usePathname`).
   - Props: `{ href, icon, label, dimmed?: boolean }`
   - Active state: `pathname === href || pathname.startsWith(href + '/')` → primary bar + `text-primary`.
   - Hover: `bg-surface-container`.
6. **`ComingSoonNavItem.tsx`** — `<NavItem dimmed />` + `<Lock />` ikon + `<Tooltip content="Coming soon" />` wrapper. `aria-disabled="true"`, `tabIndex={-1}`, `onClick` preventDefault.
7. **Coming-soon shell pages** (her bir dim shell sayfası):
   - Server Component
   - İçerik: sayfa başlığı (title-md) + kısa açıklama + büyük dimmed icon + "Available in Phase X" rozeti
   - Lead Discovery shell: `tasarimornegi/Dashboard-Lead-Discovery.html`'in dimmed/blur versiyonu — gerçek formu render ETME, sadece görsel placeholder
   - Opportunities shell: `tasarimornegi/Dashboard-Opportunities-List.html`'in dimmed versiyonu — boş tablo iskeleti + "No data yet" empty state
   - Diğerleri (campaigns, prompt-studio, saved, crm, analytics, settings): basit "Coming soon" hero kartı + "Start a scan" CTA → `/dashboard`
   - **Önemli:** Bu sayfalar middleware tarafından erişilebilir kalır (auth'lu user gidebilir), ancak Phase 1'de işlevsel değildirler. Sidebar'da dimmed gösterimi ile uyumlu.
8. **`business/[id]/page.tsx`** — Phase 4 için minimal placeholder: "Business Reports — Coming in Phase 4". `params.id`'yi okur ama hiçbir DB sorgusu yapmaz (henüz business yok).

**Verify:**
- `/dashboard` auth'lu user için render olur; sidebar 10 item, sadece Overview aktif (primary bar)
- Diğer 9 item dimmed + lock icon + hover'da tooltip "Coming soon"
- Sidebar bottom: "20 credits" (JetBrains Mono ile sayı)
- Header sağ: compact "20" badge
- Mobile 375px: sidebar drawer, hamburger trigger çalışır
- Görsel: `tasarimornegi/Dashboard-Overview.html` ile sidebar yapısı ve tema pariteli
- Auth'suz `/dashboard` → `/login` (middleware ayrıca layout'taki `requireRole`)
- Dim shell'lerden birine (örn. `/dashboard/discovery`) elle git → "Coming in Phase 2" placeholder görünür, gerçek form yok

**Done:** Dashboard shell tamamlandı; sidebar+header+credit badge'ler live DB değerini gösteriyor; tüm coming-soon route'lar dim shell ile render oluyor; mobile responsive.

---

### Task 2: Dashboard Overview page (5 cards + empty state) + admin shell + ai_usage reader  *(L)*

**Files:**
- `src/app/(dashboard)/dashboard/page.tsx`                # Overview
- `src/components/dashboard/OverviewCard.tsx`
- `src/components/dashboard/EmptyState.tsx`
- `src/app/(admin)/layout.tsx`
- `src/app/(admin)/admin/page.tsx`                        # /admin landing
- `src/app/(admin)/admin/users/page.tsx`
- `src/app/(admin)/admin/usage/page.tsx`
- `src/app/(admin)/admin/jobs/page.tsx`
- `src/app/(admin)/admin/templates/page.tsx`
- `src/components/admin/AdminSidebar.tsx`
- `src/components/admin/AdminHeader.tsx`

**Action:**
1. **Overview page (`(dashboard)/dashboard/page.tsx`)** — Server Component.
   - `getUser()` zaten layout'tan; sayfa kendi sorgusunu yapar:
     - `select count(*) from businesses where user_id=$me` → totalLeads
     - `select count(*) from opportunities o join businesses b on b.id=o.business_id where b.user_id=$me and o.priority in ('high','urgent')` → highOpportunityLeads
     - `select coalesce(avg(opportunity_score),0) from opportunities o join businesses b ...` → averageOpportunityScore
     - `select count(*) from sales_strategies s join businesses b ...` → aiStrategiesGenerated
     - `select count(*) from build_prompts p join businesses b ...` → buildPromptsGenerated
   - Phase 1'de hepsi 0 dönecek (henüz scan yok) — bu beklenen davranış (D-12).
   - Header: "Welcome back, {email}" + sağda "Start a scan" primary CTA (Phase 1'de `/dashboard/discovery` dimmed olduğu için disabled state — onClick tooltip "Available in Phase 2" YA DA: butonu aktif tut ve discovery dim shell'ine yönlendir; CONTEXT D-12 "Start a scan" CTA istiyor — discovery sayfasına yönlendirmek daha doğru, kullanıcı oraya gidip "Coming soon" görür).
   - 5 `<OverviewCard>` grid (`grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-stack-md`):
     | Title | Value | Icon |
     |---|---|---|
     | Total Leads | 0 | `Search` |
     | High Opportunity Leads | 0 | `Flame` |
     | Average Opportunity Score | — / 100 | `Gauge` |
     | AI Strategies Generated | 0 | `Mail` |
     | Build Prompts Generated | 0 | `Code2` |
   - Altında `<EmptyState>` — büyük blok: ikon + "No data yet" başlık + body "Start a scan to discover local businesses and uncover digital opportunities." + primary CTA "Start a scan" → `/dashboard/discovery` (D-12, DASH-04).
   - DESIGN.md token'ları; görsel pariteli `Dashboard-Overview.html` (D-13).
2. **`OverviewCard.tsx`** — props `{title, value, icon, hint?}`. Card: `bg-surface-container` + outline-variant border + ambient shadow. Title `label-caps`, value `display-lg` JetBrains Mono, hint `body-sm on-surface-variant`.
3. **`EmptyState.tsx`** — generic; props `{icon, title, body, ctaLabel, ctaHref}`. Dashboard scope'unda kullanılır; gelecekte lead list empty state'i de kullanır.
4. **Admin layout (`(admin)/layout.tsx`)** — Server Component.
   - `await requireRole('admin')` — role≠'admin' ise `redirect('/dashboard')` (1A middleware ayrıca yapıyor; defense in depth).
   - `<AdminSidebar />` + `<AdminHeader />` + `<main>`.
   - Sidebar farkı: visual tone biraz farklı (örn. üstte "ADMIN" label-caps rozeti); admin sidebar item'ları: Users, AI Usage, Scan Jobs, Templates, "← Back to Dashboard".
5. **`(admin)/admin/page.tsx`** — admin landing: kısa welcome + 4 quick-link kartı (Users / Usage / Jobs / Templates).
6. **`(admin)/admin/users/page.tsx`** — Server Component.
   - `service-role` client (`lib/supabase/admin.ts`) kullan — admin için tüm users'ı listelemek RLS'siz erişim gerektirir. Bu, **server-only** dosya import'unun haklı kullanımıdır.
   - Tablo: email, role, credits, created_at. Pagination yok (Phase 1: ≤50 kullanıcı varsayımı). Sort by created_at desc.
   - "Update role" / "Grant credits" butonları **disabled** (Phase 5 işi); sadece view.
7. **`(admin)/admin/usage/page.tsx`** — ADM-02.
   - Server Component, server-role client.
   - Tablo: `created_at`, user email (join), `stage`, `provider`, `model`, `input_tokens`, `output_tokens`, `cost_usd`.
   - Filtre query param'ları: `?from=YYYY-MM-DD&to=YYYY-MM-DD&user=<email>`. Form GET method.
   - Phase 1'de tablo boş döner (henüz AI call yok). Boş durumda "No AI usage recorded yet" empty state.
   - Toplam satır: aggregate footer "Total cost: $0.00" (boş listede).
8. **`(admin)/admin/jobs/page.tsx`** — scan_jobs reader, aynı pattern. Phase 1'de boş.
9. **`(admin)/admin/templates/page.tsx`** — ADM-03 view-only minimum. Sabit kodlu industry template listesi (`klinik`, `kafe`, `güzellik salonu`) sadece görüntüler — düzenleme yok (Phase 5 işi).
10. **Middleware sanity check:** 1A'da `/admin/*` zaten `role==='admin'` kontrolünden geçiyor. Bu plan defansif olarak `requireRole('admin')` layout düzeyinde tekrar uygular.

**Verify:**
- Auth'lu non-admin user `/admin` URL'sini elle açar → middleware veya layout `redirect('/dashboard')`
- Supabase Dashboard SQL ile bir kullanıcıyı admin yap: `UPDATE public.users SET role='admin' WHERE email='myduymaz1980@gmail.com';`
- Browser'da cookie yenile (logout/login) → `/admin` açılır, admin landing görünür
- `/admin/users` → tablo en az 1 satır (kendi user'ın) gösterir, role='admin'
- `/admin/usage` → "No AI usage recorded yet" empty state
- `/dashboard` → 5 kart hepsi 0 gösterir; alt empty state "Start a scan" CTA görünür
- "Start a scan" → `/dashboard/discovery` (dim shell, "Coming in Phase 2")
- Görsel: `Dashboard-Overview.html` ile kart layout/spacing pariteli (D-13)

**Done:** Overview page 5 kart + empty state ile çalışıyor; admin shell role-gated; `/admin/usage` ai_usage tablosunu okuyor (boş listeyle); admin sidebar nav doğru.

---

### Task 3: Upstash Workflow + Redis provisioning + AIProvider/DiscoveryProvider interface skeleton  *(M)*

**Files:**
- `src/lib/workflow/client.ts`
- `src/lib/redis/client.ts`
- `src/app/api/workflow/pipeline/route.ts`
- `src/lib/ai/types.ts`
- `src/lib/discovery/types.ts`
- `.env.example` (final sync — SKELETON.md §3 ile birebir)

**Action:**
1. **Install:** `@upstash/workflow @upstash/redis @upstash/qstash`. (`@upstash/qstash` Workflow internally kullanıyor; ayrıca ileride raw QStash fire-and-forget için gerekli olabilir.)
2. **`src/lib/redis/client.ts`** — `import "server-only";` + `import { Redis } from "@upstash/redis"`. Lazy singleton:
   ```ts
   let _redis: Redis | null = null;
   export function getRedis(): Redis {
     if (!_redis) {
       _redis = new Redis({
         url: process.env.UPSTASH_REDIS_REST_URL!,
         token: process.env.UPSTASH_REDIS_REST_TOKEN!,
       });
     }
     return _redis;
   }
   ```
   Env eksikse build-time değil runtime-time hata at; Phase 1'de wrapper deploy'a girer ama hiç çağrılmaz, env'in eksik olması crash etmesin.
3. **`src/lib/workflow/client.ts`** — `import "server-only";`. `@upstash/workflow/nextjs` re-export'larını expose et + dev için `verifySignatureAppRouter` helper. Active workflow definitions Phase 2+ eklenir.
4. **`src/app/api/workflow/pipeline/route.ts`** — placeholder serve handler:
   ```ts
   import { serve } from "@upstash/workflow/nextjs";

   // Phase 2+ will add real steps: discovery → enrichment → ... → build_prompt.
   // Phase 1 ships an empty workflow so the route is reachable and signature
   // verification is wired. Calling this endpoint in Phase 1 returns immediately.
   export const { POST } = serve(async (context) => {
     await context.run("noop", async () => {
       return { phase: "1-foundation", message: "Pipeline placeholder; no active steps." };
     });
   });
   ```
5. **`src/lib/ai/types.ts`** — interface skeleton (Phase 3 implements):
   ```ts
   import type { z } from "zod";
   export type ModelTier = "reasoning" | "cheap";
   export interface AIProvider {
     generate<T>(prompt: string, schema: z.ZodSchema<T>, tier?: ModelTier): Promise<T>;
   }
   // Factory not implemented in Phase 1; Phase 3 adds getAIProvider() under lib/ai/index.ts.
   ```
6. **`src/lib/discovery/types.ts`** — interface skeleton (Phase 2 implements):
   ```ts
   export interface DiscoveryInput {
     location: string;
     category: string;
     radiusM: number;
   }
   export interface RawBusiness {
     placeId: string;
     name: string;
     category?: string;
     // ... CLAUDE.md §7.1 BusinessLead alanları
   }
   export interface DiscoveryProvider {
     search(input: DiscoveryInput): Promise<RawBusiness[]>;
   }
   ```
7. **`.env.example` final sync** — SKELETON.md §3'teki tam liste; özellikle `UPSTASH_WORKFLOW_URL`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`'in mevcut olduğundan emin ol (1A bunları ekledi ise duplicate yapma — sadece doğrula).
8. **`README.md`** — Upstash Workflow URL'in dev için ngrok / Vercel preview gerektirdiğini not et; localhost'tan QStash callback gelemediği için workflow active step testleri Phase 2'de Vercel preview üzerinde yapılır.

**Verify:**
- `npm run build` 0 hata
- `npx tsc --noEmit` 0 hata
- Dev server'da `curl -X POST http://localhost:3000/api/workflow/pipeline -H "Content-Type: application/json" -d '{}'` — placeholder yanıtı veya signature error (signing key yoksa) — handler tetiklenebilir, route reachable
- `grep -r "from \"@upstash/workflow\"" src/` sadece `lib/workflow/client.ts` ve `app/api/workflow/pipeline/route.ts`'de
- `grep "NEXT_PUBLIC_UPSTASH\|NEXT_PUBLIC_OPENROUTER\|NEXT_PUBLIC_ANTHROPIC" .env.example` 0 sonuç (PITFALL §RLS-2 hijack — yanlış prefix engellenir)
- `.env.example` ile SKELETON.md §3'ün diff'i boş

**Done:** Upstash Workflow + Redis client wrapper'ları yerinde; placeholder pipeline route reachable; AIProvider + DiscoveryProvider interface'leri sonraki faz'lar için hazır; env değişkenleri tam ve doğru prefix'lerde.

---

### Task 4 (Checkpoint): Phase 1 full end-to-end UAT  *(checkpoint:human-verify)*

**What was built (across this plan):**
- Authenticated dashboard shell: sidebar (10 nav items, 9 dimmed) + header + credit badges (full + compact)
- Overview page: 5 cards (zeros) + empty state CTA
- 9 dim shell pages (discovery, opportunities, business/[id], campaigns, prompt-studio, saved, crm, analytics, settings)
- Admin shell: layout + landing + users (server-role read) + usage (ai_usage reader) + jobs + templates (view-only)
- Upstash Workflow + Redis provisioning, AIProvider + DiscoveryProvider interface skeletons

**How to verify (end-to-end Phase 1 acceptance):**

Bu Phase 1'in kapanış UAT'sı. Tüm 5 success criterion'a kayıt yapın:

1. **Success #1 (register → /dashboard)**
   - `/register` → `phase1uat@example.com` / `password1234` → submit → `/dashboard` render olur, sidebar+header görünür ✅
2. **Success #2 (auth'suz /dashboard → /login)**
   - Logout → `/dashboard` URL'ini elle aç → `/login`'e redirect ✅
3. **Success #3 (10 tablo + RLS)**
   - Supabase Dashboard → Database → Tables → 10 tablo listelenir, hepsi RLS aktif (PLAN-1B'nin checkpoint'ini referans)
4. **Success #4 (credits=20, sidebar + header görünür)**
   - Yeni user için public.users.credits=20
   - Sidebar bottom: "20 credits" (data-mono sayı)
   - Header sağ: kompakt "20" badge
   - Manuel test: Supabase SQL `UPDATE public.users SET credits=3 WHERE email='phase1uat@example.com';` → dashboard refresh → her iki badge AMBER renkte "3 credits" / "3" gösterir (D-09)
   - `UPDATE public.users SET credits=0` → her iki badge KIRMIZI; "Start a scan" CTA bloklanır veya "No credits" uyarısı (D-10)
5. **Success #5 (/admin admin için açılır, ai_usage görüntülenebilir)**
   - Supabase SQL ile user'ı admin yap → cookie refresh (logout/login)
   - `/admin` → admin landing açılır
   - `/admin/usage` → ai_usage boş listeyle empty state görünür
   - Non-admin user `/admin` → `/dashboard` redirect ✅

**Cross-cutting:**
- Görsel paritey: `tasarimornegi/Dashboard-Overview.html` ile sidebar/cards yapısı uyumlu (D-13)
- DESIGN.md token kullanımı: DevTools'ta hardcoded hex YOK
- `npx tsc --noEmit` 0 hata, `npm run build` başarılı
- `vercel deploy` (dev preview) → tüm akış preview URL'inde geçer
- `.env.example` ↔ `.env.local` ile key isimleri eşleşir

**Resume signal:** "approved — Phase 1 complete" veya hata listesi.

---

## Goal-Backward Verification

| Success Criterion (Phase 1) | Karşılanır mı? | Nasıl? |
|---|---|---|
| #1 register/login → /dashboard görünür | TAM | dashboard layout + Overview page bu planda; auth UI 1C'den; trigger 1A'dan |
| #2 auth'suz /dashboard → /login | TAM | 1A middleware + bu planda `requireRole('user')` defense in depth |
| #3 10 tablo + RLS | TAM | 1B; bu plan tüketici (sadece Overview SQL'leri ve admin reader) |
| #4 credits=20 görünür | TAM | CreditBadge (compact + full); threshold renkleri (D-08, D-09, D-10) |
| #5 /admin admin için + ai_usage görüntülenebilir | TAM | admin layout + `/admin/usage` reader |

---

## Open Questions

- "Start a scan" CTA Phase 1'de `/dashboard/discovery` dim shell'ine mi yönlendirsin yoksa doğrudan disabled mı? **Claude'un discretion'ı:** dim shell'e yönlendir (kullanıcı orada "Coming in Phase 2" görür) — disabled CTA UX'i kırılır. CONTEXT bunu açıkça çözmüyor.
- Admin sidebar'ında "AI Usage" linkinin Phase 1'de görünür olması ama Phase 3'e kadar gerçek veri olmaması — sorun değil, "No AI usage recorded yet" empty state ile zaten karşılanıyor.
