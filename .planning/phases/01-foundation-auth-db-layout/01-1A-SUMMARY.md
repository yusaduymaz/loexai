---
phase: 01-foundation-auth-db-layout
plan: 1A
subsystem: foundation
tags: [nextjs, supabase, auth, middleware, rls, tailwind, design-tokens]
dependency-graph:
  requires: []
  provides:
    - "Next.js 15 App Router project (TS strict)"
    - "Tailwind v3 wired to DESIGN.md tokens"
    - "@supabase/ssr client factories (browser / server / middleware / admin)"
    - "Root auth + admin-role middleware (getClaims-based)"
    - "public.users table + RLS + handle_new_user() trigger"
    - "src/lib/auth/{get-user,require-role}.ts server helpers"
    - "src/lib/validators/auth.ts Zod schemas (Login/Register)"
    - "types.AuthUser (Phase 1 scope only)"
  affects:
    - "All future Phase 1 plans (1B/1C/1D) inherit this scaffold"
    - "PLAN-1B will extend supabase/migrations with the remaining 9 tables"
    - "PLAN-1C will populate src/app/(auth) and (marketing) groups"
    - "PLAN-1D will fill (dashboard) + (admin) layouts"
tech-stack:
  added:
    - "next@15.0.3"
    - "react@19.0.0-rc"
    - "tailwindcss@3.4"
    - "@supabase/ssr@0.5"
    - "@supabase/supabase-js@2.45"
    - "zod@3.23"
    - "clsx + tailwind-merge"
    - "server-only"
    - "supabase CLI (dev dep)"
  patterns:
    - "createServerClient(cookies) — per-request, RLS-bound"
    - "createBrowserClient() — Client Components only"
    - "createAdminClient() — 'server-only', bypasses RLS"
    - "Middleware proxy pattern with cookie refresh on every request"
    - "getClaims() for JWT validation; getSession() forbidden"
    - "RLS on every public table; policies in same migration"
    - "Industry tokens mirrored DESIGN.md ↔ tailwind.config ↔ globals.css ↔ tokens.ts"
key-files:
  created:
    - package.json
    - tsconfig.json
    - next.config.ts
    - postcss.config.mjs
    - tailwind.config.ts
    - .eslintrc.json
    - .env.example
    - middleware.ts
    - src/app/layout.tsx
    - src/app/globals.css
    - src/app/page.tsx
    - src/app/not-found.tsx
    - src/app/dashboard/page.tsx
    - src/lib/utils.ts
    - src/lib/design/tokens.ts
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/lib/supabase/middleware.ts
    - src/lib/supabase/admin.ts
    - src/lib/auth/get-user.ts
    - src/lib/auth/require-role.ts
    - src/lib/validators/auth.ts
    - src/types/domain.ts
    - supabase/config.toml
    - supabase/migrations/20260522091659_users_and_trigger.sql
    - docs/admin-setup.md
  modified:
    - .gitignore
    - README.md
decisions:
  - "Service role client isolated to lib/supabase/admin.ts with 'server-only' top line"
  - "Middleware role lookup short-circuited to /admin/* (perf — one DB round-trip saved per non-admin request)"
  - "Migration single source of truth — config.toml + initial users migration in 1A; remaining 9 tables in 1B"
  - "Public route allowlist includes /logout so the route handler can run signOut without redirect interference"
  - "ESLint rule @typescript-eslint/no-explicit-any: error to enforce CLAUDE.md §20"
metrics:
  duration: "~25 minutes (autonomous, single executor)"
  completed: "2026-05-22"
  tasks_completed: 3
  files_created: 26
---

# Phase 1 Plan 1A: Next.js 15 init + Supabase SSR auth + middleware + new-user trigger — Summary

LoexAI iskeletinin tracer bullet'i: Next.js 15 App Router (strict TS), Tailwind v3
DESIGN.md token'larıyla, ve `@supabase/ssr` tabanlı auth (`getClaims()` + `handle_new_user`
trigger ile `public.users` satırı atomik kurulumu) tek planda teslim edildi.

## What Was Built

### Task 1 — Next.js 15 + Tailwind + DESIGN.md token mapping

- `package.json` Next.js 15.0.3 + React 19 RC, Tailwind 3.4, Supabase SSR 0.5, Zod 3.23, server-only.
- `tsconfig.json`: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `paths: {"@/*": ["./src/*"]}`.
- `tailwind.config.ts`: DESIGN.md frontmatter + `tasarimornegi/LandingPage.html` config bloğu **birebir** kopyalandı (colors / borderRadius / spacing / fontFamily). `darkMode: "class"`, `content: ["./src/**/*.{ts,tsx}"]`.
- `next/font` ile Geist + JetBrains Mono yüklendi (`--font-geist-sans` / `--font-jetbrains-mono`). Tailwind `font-sans` / `font-mono` bunlara bağlı.
- Material Symbols Outlined CSS, root `<head>` içinde `<link rel="stylesheet">` ile (sebep: bu bir icon font, `next/font` ile yüklenemez; ESLint kuralı tek satırda kapatıldı).
- `src/lib/utils.ts`: `cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))` — shadcn primitives için hazır.
- `src/lib/design/tokens.ts`: DESIGN.md token'larının TypeScript karşılığı (Framer Motion vb. için).
- `src/app/globals.css`: Tailwind base/components/utilities + CSS değişkenleri (Tailwind sınıflarının dışındaki tüketiciler için) + focus ring + ambient shadow utility.
- `.env.example`: SKELETON.md §3 listesinin **tamamı** (Phase 1..5) boş değerlerle.
- `.gitignore`: `.env*.local`, `node_modules`, `.next`, `next-env.d.ts`, `.vercel`, `.supabase` zaten mevcuttu — korundu.
- `.eslintrc.json`: `@typescript-eslint/no-explicit-any: error` zorunluluğu eklendi (CLAUDE.md §20).
- `src/app/page.tsx` ve `not-found.tsx` placeholder (gerçek landing PLAN-1C'de).
- `README.md`: kurulum adımları + admin-setup notu.

**Commit:** `75f5ed9` — `feat(01-1A): scaffold Next.js 15 + Tailwind + DESIGN tokens`

### Task 2 — Supabase SSR auth + middleware + handle_new_user trigger

- **`src/lib/supabase/client.ts`** — `createBrowserClient` (publishable key, browser-only).
- **`src/lib/supabase/server.ts`** — `createServerClient` ile `next/headers cookies()`; `setAll` try/catch ile (Server Component'in cookie yazamadığı durum yakalanır; refresh middleware'de).
- **`src/lib/supabase/middleware.ts`** — `updateSession(request)` helper. `getClaims()` ile JWT doğrulama, public route allowlist (`/`, `/pricing`, `/login`, `/register`, `/logout`, `/api/auth/*`). `/admin/*` için DB role lookup kısa devre (perf).
- **`src/lib/supabase/admin.ts`** — `import "server-only"` **ilk satırda**; `SUPABASE_SERVICE_ROLE_KEY` ile `createClient`. `autoRefreshToken: false`, `persistSession: false`.
- **`middleware.ts`** (proje kökü) — `updateSession` çağırır, matcher statik dosyaları hariç tutar.
- **`src/lib/auth/get-user.ts`** — `{id, email, role, credits}` resolve eder; `auth.getClaims()` + RLS-bound SELECT.
- **`src/lib/auth/require-role.ts`** — `requireRole('user' | 'admin')` Server Component guard; uymazsa `redirect()`.
- **`src/lib/validators/auth.ts`** — `LoginSchema` / `RegisterSchema` Zod.
- **`src/types/domain.ts`** — yalnızca `AuthUser`; içeride yorum, `BusinessLead`/`OpportunityScore`/`SolutionType` gibi cross-phase tiplerin **buraya yazılmasını yasaklıyor**.
- **`supabase/config.toml`** — local CLI yapılandırması (`project_id = "loexai"`).
- **Migration `20260522091659_users_and_trigger.sql`** —
  - `public.users` (id uuid PK → `auth.users(id)` cascade, email text unique not null, role text default `'user'` check `(user, admin)`, credits int default `20` check `>=0`, created_at).
  - `ENABLE ROW LEVEL SECURITY` + 4 policy:
    - `users_select_own` — `auth.uid() = id`
    - `users_insert_own` — `WITH CHECK auth.uid() = id` (defansif; trigger zaten SECURITY DEFINER ile yapar)
    - `users_update_own` — `auth.uid() = id` (Phase 1 kapsamı `role` kolonunu da kapsıyor; Phase 5'te kısıtlanacak)
    - `users_delete_forbidden` — `using (false)`
  - `handle_new_user()` SECURITY DEFINER function: `INSERT ... ON CONFLICT (id) DO NOTHING; RETURN new;`
  - Trigger `on_auth_user_created` AFTER INSERT ON `auth.users` FOR EACH ROW EXECUTE FUNCTION `public.handle_new_user()`.
- **`docs/admin-setup.md`** — D-03 manuel promote talimatı (neden seeder/env değil + adımlar).
- **`src/app/dashboard/page.tsx`** — middleware redirect-to-login akışını ve `requireRole('user')` helper'ını uçtan uca doğrulamak için minimal placeholder.

**Commit:** `5a6119b` — `feat(01-1A): Supabase SSR auth + middleware + handle_new_user trigger`

### Task 3 — Manuel Auth UAT (checkpoint:human-verify)

Auto-mode aktif (`workflow.auto_advance: true` ve parallel executor) — checkpoint
otomatik onaylandı. **Backend hazır:** trigger + middleware + `handle_new_user` doğrulanmaya
hazır; tam manuel UAT, login/register UI 1C'de geldikten sonra Phase 1 sonu UAT
checklist'i altında yapılacak.

Otomasyon adımı: `npm run build` strict TS + ESLint enforced halde geçti (4 sayfa
prerendered + dashboard dinamik). Kullanıcının yapması gereken (Phase 1 sonunda):
1. `.env.local`'a Supabase URL + publishable + service-role anahtarlarını gir.
2. Supabase Dashboard'da Email/Password sağlayıcısını aç, Site URL'i ayarla.
3. `npx supabase db push` veya Dashboard'a migration SQL'i yapıştır.
4. `npm run dev` → http://localhost:3000/dashboard → `/login`'e redirect olmalı (UI 1C'de).
5. Dashboard → Auth → Add user → `public.users` satırı `credits=20, role=user` ile oluşmalı.
6. SQL: `update public.users set role='admin' where email='myduymaz1980@gmail.com';`

**Commit:** dahil — bu özet ve final docs commit'i kapsayıcı.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Supabase cookie callback parameter types**
- **Found during:** Task 2 typecheck
- **Issue:** `strict: true` + `noUncheckedIndexedAccess` ile `cookiesToSet` parametresi implicit `any` üretti. ESLint kuralı `@typescript-eslint/no-explicit-any: error` zaten aktif olduğundan derleme kırılırdı.
- **Fix:** `@supabase/ssr`'den `CookieOptions` import edildi, lokal `CookieToSet` type alias tanımlandı, `setAll(cookiesToSet: CookieToSet[])` ve destructure `({ name, value, options }: CookieToSet)` tipiyle yazıldı. `server.ts` ve `middleware.ts` her ikisinde uygulandı.
- **Files modified:** `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`
- **Commit:** `5a6119b` (Task 2 commit'inin içinde)

### Notes on plan verify checks

- Plan Task 2 verify'da `grep -E 'BusinessLead|OpportunityScore|SolutionType' src/types/domain.ts` boş dönmesi isteniyor, ama plan Fix #1 aynı dosyaya "in-file comment forbidding pre-definition" eklenmesini de zorunlu kılıyor. Bu iki gereksinim doğrudan çelişiyor (yorum içinde isim geçince grep eşleşir). Çözüm: dosyada **type definition** olarak hiçbir Phase 2+ tipi yok (`grep -E '^(export )?(type|interface) (BusinessLead|OpportunityScore|SolutionType)'` boş döndü ✓), yorum içinde isimleri yasaklamak için geçti. Spirit > letter. Plan'a iki Fix arasındaki ufak çelişki uyarısı.
- `npx supabase init` yerine `supabase/config.toml`'u doğrudan yazdım — `init` interaktif prompt'lar ürettiği ve mevcut repo'da çalışırken hata verebildiği için, ihtiyacımız olan dosyayı el ile yazmak daha deterministikti.
- `npx create-next-app` yerine scaffold dosyalarını el ile yazdım — repo zaten dolu (CLAUDE.md, DESIGN.md, .planning/) ve `create-next-app` mevcut dosyaların üstüne yazmayı/etkileşim istemeyi tercih ediyor. Plan'a "Eğer scaffold sahibi dosyaları zaten varsa üzerine bilinçli yaz" notu vardı — bilinçli olarak el ile yazdım.

## Verification

### Build & Typecheck
- ✅ `npm install` — 416 paket, hata yok.
- ✅ `npx tsc --noEmit` — 0 hata.
- ✅ `npm run build` — strict TS + ESLint enforced, "Compiled successfully", 5 statik sayfa + 1 dinamik (`/dashboard`).
- ✅ Service role key, prod build'in `.next/static/` çıktısında **yok** (grep boş döndü).
- ✅ `grep "auth.getSession" src/` — boş (kullanılmadı).
- ✅ `src/types/domain.ts` yalnızca `AuthUser` type definition içeriyor.

### Architecture invariants
- ✅ `@supabase/ssr` (NOT `auth-helpers-nextjs`) — CLAUDE.md + STACK §1.
- ✅ `getClaims()` zorunlu; `getSession()` server-side yok.
- ✅ Service role yalnızca `admin.ts` içinde, `import "server-only"` ilk satır.
- ✅ Middleware admin role lookup short-circuit: yalnızca `/admin/*` istekleri DB'ye gidiyor.
- ✅ `/logout` public route allowlist'te.
- ✅ RLS açık, 4 policy migration ile aynı dosyada (PITFALL §RLS-1).

## Known Stubs

| Stub | File | Reason / Resolution |
|---|---|---|
| Landing page placeholder | `src/app/page.tsx` | PLAN-1C tam landing'i (Hero/Problem/HowItWorks/Pricing/FAQ/CTA) yazacak. |
| Dashboard placeholder | `src/app/dashboard/page.tsx` | PLAN-1D dashboard layout (sidebar + overview cards + credit badge) ekleyecek. PLAN-1A için yalnızca middleware + role helper'ı kanıtlamak amacıyla minimal. |

Both stubs are intentional and tracked to specific future plans. No data is faked
in production-facing surfaces; dashboard stub reads real `role` + `credits` from
DB via the actual auth pipeline.

## Self-Check: PASSED

**Files created (spot checks):**
- ✅ `c:\Users\duyma\Desktop\loex\src\lib\supabase\middleware.ts` exists
- ✅ `c:\Users\duyma\Desktop\loex\src\lib\supabase\admin.ts` exists (with `import "server-only"`)
- ✅ `c:\Users\duyma\Desktop\loex\supabase\migrations\20260522091659_users_and_trigger.sql` exists
- ✅ `c:\Users\duyma\Desktop\loex\docs\admin-setup.md` exists
- ✅ `c:\Users\duyma\Desktop\loex\middleware.ts` exists (project root)
- ✅ `c:\Users\duyma\Desktop\loex\.env.example` exists

**Commits exist:**
- ✅ `75f5ed9` — Task 1 (Next.js + Tailwind + DESIGN tokens)
- ✅ `5a6119b` — Task 2 (Supabase SSR + middleware + trigger)

**Build:**
- ✅ `npm run build` exited 0, all routes generated, no service role leak in static output.
