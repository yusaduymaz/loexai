---
phase: 01-foundation-auth-db-layout
plan: 1A
title: "Next.js 15 init + Supabase SSR auth + middleware + new-user trigger"
type: execute
wave: 1
mode: mvp
depends_on: []
parallel_safe_with: []   # 1A must finish before 1B/1C/1D start
files_modified:
  - package.json
  - tsconfig.json
  - next.config.ts
  - tailwind.config.ts
  - postcss.config.mjs
  - .env.example
  - .gitignore
  - README.md
  - middleware.ts
  - docs/admin-setup.md
  - src/app/layout.tsx
  - src/app/globals.css
  - src/app/not-found.tsx
  - src/lib/supabase/client.ts
  - src/lib/supabase/server.ts
  - src/lib/supabase/middleware.ts
  - src/lib/supabase/admin.ts
  - src/lib/auth/get-user.ts
  - src/lib/auth/require-role.ts
  - src/lib/design/tokens.ts
  - src/lib/utils.ts
  - src/lib/validators/auth.ts
  - src/types/domain.ts
  - supabase/config.toml
  - supabase/migrations/<ts>_users_and_trigger.sql   # User trigger only — full schema is PLAN-1B
autonomous: false
requirements:
  - FOUND-01
  - FOUND-02
  - FOUND-03
  - FOUND-04
  - FOUND-08
user_setup:
  - service: supabase
    why: "Create Supabase project + collect keys before auth can work"
    env_vars:
      - name: NEXT_PUBLIC_SUPABASE_URL
        source: "Supabase Dashboard → Project Settings → API → Project URL"
      - name: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
        source: "Supabase Dashboard → Project Settings → API Keys → publishable key (NEW format, not legacy anon)"
      - name: SUPABASE_SERVICE_ROLE_KEY
        source: "Supabase Dashboard → Project Settings → API Keys → service_role (secret)"
    dashboard_config:
      - task: "Enable Email/Password provider"
        location: "Supabase Dashboard → Authentication → Providers → Email"
      - task: "Set Site URL to http://localhost:3000 for dev; later add Vercel preview URL"
        location: "Supabase Dashboard → Authentication → URL Configuration"
must_haves:
  truths:
    - "Yeni kullanıcı /register'dan kayıt olabilir ve oturum açık olur"
    - "Kullanıcı /login'den giriş yapabilir, sayfalar arası oturum korunur"
    - "Kullanıcı /logout'a tıkladığında oturum kapanır ve /login'e döner"
    - "Auth'suz /dashboard ziyaret → /login redirect"
    - "Yeni kullanıcı için public.users satırı handle_new_user trigger ile otomatik insert edilir (credits=20, role='user')"
  artifacts:
    - path: "middleware.ts"
      provides: "Tek auth + role middleware (D-02). getClaims() ile JWT doğrulama. Public/auth/dashboard/admin route ayrımı."
    - path: "src/lib/supabase/server.ts"
      provides: "createServerClient — Server Components/Actions/Route Handlers için"
    - path: "src/lib/supabase/client.ts"
      provides: "createBrowserClient — Client Components için"
    - path: "src/lib/supabase/middleware.ts"
      provides: "updateSession helper — middleware.ts içinden çağrılır"
    - path: "src/lib/supabase/admin.ts"
      provides: "Service-role client, import 'server-only' başlıklı, yalnızca admin Server Action'larında"
    - path: "src/lib/auth/get-user.ts"
      provides: "Server-side {id, email, role, credits} okuma"
    - path: "supabase/migrations/<ts>_users_and_trigger.sql"
      provides: "auth.users → public.users insert trigger; default credits=20, role='user'"
    - path: ".env.example"
      provides: "Tüm Phase 1..5 env anahtarları (boş değerlerle) — SKELETON.md §3'e uyumlu"
  key_links:
    - from: "middleware.ts"
      to: "lib/supabase/middleware.ts updateSession"
      via: "cookie-based token refresh on every request"
    - from: "Supabase auth.users (insert)"
      to: "public.users (insert)"
      via: "AFTER INSERT trigger handle_new_user() — atomic, runs in same transaction"
    - from: "Server Components / Server Actions"
      to: "createServerClient(cookies)"
      via: "cookie-based per-request client; NEVER service role"
---

## Canonical References

**MUST READ before starting any task:**

1. `CLAUDE.md` — Sections 10 (stack), 11 (data model intro), 16 (security), 17 (env), 20 (code quality)
2. `.planning/research/STACK.md` §1 — `@supabase/ssr` + `getClaims()` pattern, two client factories, middleware proxy
3. `.planning/research/PITFALLS.md` §"Next.js 15 + Supabase SSR" + §"Supabase RLS" #2 — service role exposure rules
4. `.planning/phases/01-foundation-auth-db-layout/01-CONTEXT.md` — D-01, D-02, D-03 (admin role detection)
5. `.planning/phases/01-foundation-auth-db-layout/SKELETON.md` — Sections 1, 2, 3, 4 (architecture, layout, env, auth flow)
6. `DESIGN.md` — token list (used to seed `tailwind.config.ts` colors map)
7. `tasarimornegi/LandingPage.html` lines 1–110 — Tailwind config block shows the exact color tokens already mapped

---

## Objective

LoexAI projesinin Next.js 15 + TypeScript strict + Supabase SSR auth iskeletini kurar.
Bu plan **çalışan auth akışını** teslim eder: register → otomatik public.users insert →
dashboard görür → logout → login redirect. Diğer tablolar (businesses, ai_usage, vs.)
**1B'nin işidir**; 1A yalnızca `public.users` + trigger'ı oluşturur ki auth akışı uçtan
uca test edilebilsin.

Phase 1 success criteria #1 (register/login/dashboard), #2 (auth'suz redirect) ve #4'ün
DB tarafı (credits=20 default) bu plan tarafından satisfy edilir.

---

## Tasks

### Task 1: Next.js 15 init + Tailwind + DESIGN.md token mapping  *(M)*

**Files:**
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- `src/app/layout.tsx`, `src/app/globals.css`, `src/app/not-found.tsx`
- `src/lib/utils.ts` (shadcn cn helper), `src/lib/design/tokens.ts`
- `.env.example`, `.gitignore`, `README.md`

**Action:**
1. `npx create-next-app@latest loex --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` çalıştır (mevcut dizinde init et — proje kökü `c:\Users\duyma\Desktop\loex`). Eğer scaffold sahibi dosyaları zaten varsa üzerine bilinçli yaz.
2. `tsconfig.json`: `"strict": true`, `"noUncheckedIndexedAccess": true`, `paths: { "@/*": ["./src/*"] }` ayarla. `any` yasak (eslint kuralı: `@typescript-eslint/no-explicit-any: error`).
3. `tailwind.config.ts`: DESIGN.md'deki **tüm** renk token'larını ve `tasarimornegi/LandingPage.html`'ın `tailwind.config` bloğundaki Tailwind extension'ını birebir kopyala (renkler, `borderRadius`, `spacing`, `fontFamily`). `darkMode: "class"`. `content: ["./src/**/*.{ts,tsx}"]`.
4. `next/font` ile Geist + JetBrains Mono yükle; `<html>`'e `font-sans` ve `dark` class'ı ekle. `src/app/layout.tsx`: root layout dark theme + Material Symbols Outlined CSS stylesheet `<link>`'i ekle (HTML referansları kullanıyor).
5. `src/app/globals.css`: Tailwind base/components/utilities + DESIGN.md token'ları CSS değişkenleri olarak (shadcn primitives için). Surface katmanları, focus ring (`primary` 2px), ambient shadow utility.
6. `src/lib/utils.ts`: shadcn `cn = (...inputs) => twMerge(clsx(inputs))` helper'ı (`clsx`, `tailwind-merge` install).
7. `src/lib/design/tokens.ts`: DESIGN.md'deki yapısal token'ları (renk, spacing, typography) TypeScript const export et — Framer Motion animation'larında string referans için kullanılır.
8. `.env.example`: SKELETON.md §3'teki **tam** liste, tüm değerler boş.
9. `.gitignore`: `.env.local`, `.env*.local`, `node_modules`, `.next`, `next-env.d.ts`, `.vercel` ekle.
10. `README.md`: kurulum adımları + "İlk admin için bkz. `docs/admin-setup.md`" notu.

**Verify:**
- `npm install` hatasız tamamlanır
- `npm run build` strict mode'da hatasız geçer (boş app)
- `npm run dev` → http://localhost:3000 404 veya boş home gösterir, console temiz
- `npx tsc --noEmit` 0 hata
- `grep -E "any" src/` (hariç `cn(...inputs: ClassValue[])` Tailwind tipleri) — beklenmedik `any` yok

**Done:** Boş Next.js 15 projesi çalışır; Tailwind DESIGN.md token'ları ile aktif; Geist ve JetBrains Mono yüklü; dark class'ı root'a uygulanmış; `.env.example` SKELETON listesiyle birebir.

---

### Task 2: Supabase SSR auth wiring + middleware + handle_new_user trigger  *(L)*

**Files:**
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `src/lib/supabase/admin.ts`
- `src/lib/auth/get-user.ts`
- `src/lib/auth/require-role.ts`
- `src/lib/validators/auth.ts`
- `src/types/domain.ts`
- `middleware.ts` (proje kökü)
- `supabase/config.toml`
- `supabase/migrations/<timestamp>_handle_new_user.sql`
- `docs/admin-setup.md`

**Action:**
1. Install: `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `server-only`. Supabase CLI: `npm i -D supabase`.
2. `npx supabase init` → `supabase/config.toml` oluştur. Kullanıcının önceden oluşturduğu Supabase project URL/keys'i `.env.local`'a girmesini iste (frontmatter `user_setup` blokunda açıklanmıştır).
3. **`src/lib/supabase/client.ts`** — `createBrowserClient` factory. Tek dosya, `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` kullanır.
4. **`src/lib/supabase/server.ts`** — `createServerClient` factory. `cookies()` `next/headers`'tan alınır. `getAll` / `setAll` cookie callback'leri RESEARCH STACK §1'deki kalıba göre. `Cache-Control`/`Expires`/`Pragma` cookie callback'i tarafından otomatik set edilir (v0.10+).
5. **`src/lib/supabase/middleware.ts`** — `updateSession(request)` helper. `NextRequest` alır; cookie'leri refresh eder; **`supabase.auth.getClaims()`** çağırır (NEVER `getSession()`). Public route allowlist (`/`, `/pricing`, `/login`, `/register`, `/logout`, `/api/auth/*`) — eşleşmeyen route'larda auth yoksa `/login` redirect. **Role lookup short-circuit (perf):** `public.users.role` sorgusunu YALNIZCA `request.nextUrl.pathname.startsWith('/admin')` olduğunda yap; diğer authed path'ler için role lookup'ı atla (her request için bir DB round-trip tasarrufu). `/admin/*` istekleri için `claims` aldıktan sonra `public.users` tablosundan `role` çek; `role !== 'admin'` ise `/dashboard` redirect (D-02). Return `NextResponse`.
6. **`src/lib/supabase/admin.ts`** — **TOP LINE: `import "server-only";`** (PITFALL §RLS-2). Standart `createClient` ile `SUPABASE_SERVICE_ROLE_KEY` kullanır. Yalnızca `lib/auth/get-user.ts` (role/credits okumak için) ve sonraki admin Server Action'larından import edilir.
7. **`middleware.ts`** (proje kökü) — `updateSession`'ı çağırır. `matcher`: statik dosyalar ve `_next` hariç tutulur:
   ```
   matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
   ```
8. **`src/lib/auth/get-user.ts`** — Server-side helper: `getClaims()` ile auth user'ı al; `null` ise `null` dön. Aksi halde `public.users` satırından `role` ve `credits` çek (`createServerClient`, RLS altında kendi user_id'sini okur — bu yüzden SELECT policy gerekli; PLAN-1B yazar, ama users tablosu için SELECT policy bu plan içinde de gerekli — aşağıdaki migration'a ekle). Dönüş: `{ id: string; email: string; role: 'user' | 'admin'; credits: number } | null`.
9. **`src/lib/auth/require-role.ts`** — `requireRole('admin' | 'user')` Server Component helper: `get-user.ts` çağırır; uymazsa Next.js `redirect()`. Dashboard ve admin sayfalarının üstünde kullanılır.
10. **`src/lib/validators/auth.ts`** — Zod şemaları: `LoginSchema` ({email: z.string().email(), password: z.string().min(8)}), `RegisterSchema` (aynı + opsiyonel `name`). Strict, no `any`.
11. **`src/types/domain.ts`** — YALNIZCA auth-ilgili user şeklini içerir:
    ```ts
    // Phase 2+ types added in their respective phases — do not pre-define here.
    export type AuthUser = { id: string; email: string; role: 'user' | 'admin'; credits: number };
    ```
    Cross-phase tipler (`BusinessLead`, `OpportunityScore`, `SolutionType` vs.) bu dosyaya **eklenmez** — Phase 2/3/4 kendi tiplerini kendi planlarında ekler.
12. **Migration `supabase/migrations/<ts>_users_and_trigger.sql`** — PLAN-1B tüm tablo şemasını yazacak; 1A YALNIZCA `public.users` tablosunu ve trigger'ı oluşturur ki auth akışı 1B tamamlanmadan da test edilebilsin. Migration içeriği:
    - `public.users` tablosu (id uuid PK referencing `auth.users(id) on delete cascade`, email text not null unique, role text not null default 'user' check (role in ('user','admin')), credits int not null default 20 check (credits >= 0), created_at timestamptz not null default now())
    - `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY`
    - SELECT policy: `auth.uid() = id` (own row read)
    - UPDATE policy: `auth.uid() = id` (own row update — sadece email vs. için, role hariç. role kolonu için `false` UPDATE policy'si eklemek isterseniz Phase 5 admin işine bırakın; Phase 1'de full-row UPDATE policy yeterli)
    - INSERT policy: `auth.uid() = id` (Server Action signup sonrası kullanıcı kendi profile satırını oluşturabilsin — ama trigger zaten yapar; trigger SECURITY DEFINER ile çalışacağı için policy gerekmiyor; yine de defensive)
    - DELETE policy: `false` (kullanıcı kendi satırını silmesin)
    - Function `public.handle_new_user()` SECURITY DEFINER: `INSERT INTO public.users (id, email, role, credits) VALUES (new.id, new.email, 'user', 20) ON CONFLICT (id) DO NOTHING;` then `RETURN new;`
    - Trigger `on_auth_user_created` AFTER INSERT ON `auth.users` FOR EACH ROW EXECUTE FUNCTION `public.handle_new_user()`
    - Comment lines documenting WHY each policy exists (PITFALL §RLS-1 → tests her policy'yi okuyabilmeli)
13. **`docs/admin-setup.md`** — adımlı talimat: Supabase Dashboard → SQL Editor → `UPDATE public.users SET role='admin' WHERE email='myduymaz1980@gmail.com';` (D-03). Bunun neden seeder'a değil de manuel SQL'e bırakıldığı (CONTEXT D-03 referansı).

**Verify:**
- `npx supabase db push` (veya `db reset --local`) sıfır hata
- `psql` ile (veya Supabase Dashboard SQL): `select * from public.users` çalışır, RLS açık görünür (`pg_class.relrowsecurity = true`)
- Manuel test akışı:
  1. `npm run dev`
  2. Supabase Dashboard → Auth → "Add user (Email)" ile test kullanıcı oluştur
  3. `public.users` tablosunda otomatik satır oluşmuş, `credits=20`, `role='user'`
  4. Aynı kullanıcı için ikinci eklemede `on conflict do nothing` çalışıyor — yeniden yazma yok
- Browser DevTools → Network → no `SUPABASE_SERVICE_ROLE_KEY` string'i bundle'da görünmüyor (kontrol: production build alıp `grep` ile)
- `grep -r "auth.getSession" src/` boş döner (kullanılmamalı)
- `grep -r 'createClient.*service_role\|admin.ts' src/` sadece `lib/supabase/admin.ts` import eder ve `server-only` başlığı vardır
- `src/types/domain.ts` YALNIZCA `AuthUser` tipini içerir; `BusinessLead`/`OpportunityScore`/`SolutionType` veya başka business/opportunity/solution şekli YOK (`grep -E 'BusinessLead|OpportunityScore|SolutionType' src/types/domain.ts` boş döner)
- Auth'lu kullanıcı `/logout`'a POST ettiğinde middleware engellemez (allowlist'te) ve route handler `signOut` çalıştırır

**Done:** Supabase auth client'ları doğru factory pattern'iyle ayrı; middleware token refresh + role check yapıyor; `handle_new_user` trigger yeni kullanıcıyı `credits=20, role='user'` ile insert ediyor; service role key client bundle'da yok; `getClaims()` kullanımı zorunlu.

---

### Task 3 (Checkpoint): Manuel auth UAT  *(checkpoint:human-verify)*

**Note:** Auth sayfaları (login/register UI) PLAN-1C'de yazılır. Bu checkpoint **yalnızca**
trigger + middleware + Supabase Dashboard manuel test akışını doğrular. Tam UI testi 1C
sonunda yapılır.

**What was built (in this plan):**
- Next.js 15 strict TS projesi, Tailwind + DESIGN.md token'ları
- Supabase SSR auth iskeleti, middleware, `getClaims()` tabanlı korumalar
- `handle_new_user` trigger, `public.users` tablosu (RLS açık)
- `docs/admin-setup.md` ilk admin promote notu

**How to verify:**
1. `.env.local`'a SKELETON.md §3'teki anahtarların gerçek değerlerini yaz (Supabase URL, publishable key, service role)
2. Supabase Dashboard → Authentication → Providers → Email'in açık olduğunu doğrula
3. `npm run dev`
4. Supabase Dashboard → Authentication → Users → "Add user (Email)" → `test@example.com` / `password1234`
5. Supabase Dashboard → Table Editor → `public.users` → satırı kontrol et: `credits=20`, `role='user'`, `email='test@example.com'`
6. Browser'da http://localhost:3000/dashboard adresine git → `/login`'e redirect olmalı (auth yok)
7. Supabase Dashboard SQL Editor: `UPDATE public.users SET role='admin' WHERE email='test@example.com';`
8. (Bu noktada login UI yok — 1C'de gelecek. Şimdilik DB trigger ve redirect'in doğru olduğu kanıtlandı.)

**Resume signal:** "approved" yaz veya sorunları açıkla.

---

## Goal-Backward Verification

| Success Criterion (Phase 1) | Karşılanır mı? | Nasıl? |
|---|---|---|
| #1 register/login → /dashboard görünür | KISMEN — backend hazır | trigger + middleware test edildi; UI 1C'de tamamlanır |
| #2 auth'suz /dashboard → /login redirect | TAM | middleware getClaims() + matcher; manuel test ile doğrulandı |
| #3 10 tablo + RLS | HAYIR — 1B'nin işi | yalnızca `public.users` + RLS bu planda |
| #4 yeni kullanıcı credits=20 DB'de | TAM (DB tarafı) | `handle_new_user` trigger DEFAULT 20 ile insert |
| #5 /admin admin için açılır | KISMEN | middleware role check hazır; admin sayfası 1D'de |

---

## Open Questions

- Yok. Tüm kararlar CONTEXT D-01..D-03 ve RESEARCH STACK §1 ile sabit.


---

## Changelog

- **Fix #1:** `src/types/domain.ts` scope tightened to auth-only (`AuthUser` type). Cross-phase types (`BusinessLead`, `OpportunityScore`, `SolutionType`) removed — they belong to Phase 2/3/4. Added in-file comment forbidding pre-definition. Verify step added.
- **Fix #2:** Middleware role-query short-circuit — `public.users.role` lookup only fires when `request.nextUrl.pathname.startsWith('/admin')`. Saves one DB round-trip per non-admin authed request.
- **Fix #3 (cosmetic):** Migration filename renamed from `<ts>_handle_new_user.sql` to `<ts>_users_and_trigger.sql` (it creates table + 4 policies + function + trigger, not just a trigger).
- **Fix #7:** Added `/logout` to middleware public-route allowlist (route lives at `src/app/(auth)/logout/route.ts` per PLAN-1C). Added verify step confirming middleware does not block the logout POST.
