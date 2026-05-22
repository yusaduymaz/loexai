---
phase: 01-foundation-auth-db-layout
plan: 1C
title: "Landing page (6 sections + animated dashboard preview) + login/register/pricing pages"
type: execute
wave: 2
mode: mvp
depends_on:
  - 01-1A
parallel_safe_with:
  - 01-1B
files_modified:
  - src/app/(marketing)/layout.tsx
  - src/app/(marketing)/page.tsx                  # Landing
  - src/app/(marketing)/pricing/page.tsx
  - src/app/(auth)/layout.tsx
  - src/app/(auth)/login/page.tsx
  - src/app/(auth)/register/page.tsx
  - src/app/(auth)/logout/route.ts
  - src/app/(auth)/actions.ts                     # registerAction, loginAction Server Actions
  - src/components/landing/Hero.tsx
  - src/components/landing/Problem.tsx
  - src/components/landing/HowItWorks.tsx
  - src/components/landing/DashboardPreview.tsx   # animated component (D-05)
  - src/components/landing/Pricing.tsx
  - src/components/landing/Faq.tsx
  - src/components/landing/Cta.tsx
  - src/components/landing/MarketingNav.tsx
  - src/components/landing/MarketingFooter.tsx
  - src/components/auth/LoginForm.tsx
  - src/components/auth/RegisterForm.tsx
  - src/components/auth/AuthShell.tsx             # shared layout (logo + card)
  - src/components/ui/button.tsx                  # shadcn vendorized
  - src/components/ui/input.tsx
  - src/components/ui/label.tsx
  - src/components/ui/card.tsx
  - src/components/ui/badge.tsx
  - src/components/ui/accordion.tsx               # FAQ
autonomous: false                                  # ends in human-verify checkpoint
requirements:
  - LAND-01   # landing 6 sections
  - LAND-02   # pricing page
  - LAND-03   # login + register pages
  - FOUND-01  # register flow UI
  - FOUND-02  # login flow UI
  - FOUND-03  # logout
must_haves:
  truths:
    - "Landing page'de Hero, Problem, How It Works, Dashboard Preview (animasyonlu), Pricing, FAQ, CTA bölümleri görünür"
    - "Hero CTA tıklaması doğrudan /register'a götürür (D-06)"
    - "DESIGN.md token'ları ve Geist font birebir uygulanır; LandingPage.html'in görsel referansına uyum"
    - "/login formuyla giriş yapan kullanıcı /dashboard'a yönlenir"
    - "/register formuyla kayıt olan kullanıcı /dashboard'a yönlenir, public.users satırı 20 credits ile mevcut"
    - "/logout endpoint'i oturumu kapatır ve /login'e redirect"
  artifacts:
    - path: "src/app/(marketing)/page.tsx"
      provides: "Landing — 6 sections (D-04..D-07)"
    - path: "src/components/landing/DashboardPreview.tsx"
      provides: "Animated UI demo (D-05) — fake scan akışı + skor counter + priority badge"
    - path: "src/app/(auth)/actions.ts"
      provides: "registerAction + loginAction Server Action'ları (Zod doğrulamalı)"
    - path: "src/app/(auth)/logout/route.ts"
      provides: "POST /logout → supabase.auth.signOut() → redirect /login"
  key_links:
    - from: "RegisterForm onSubmit"
      to: "actions.ts registerAction"
      via: "Server Action; Zod validate → supabase.auth.signUp() → trigger handle_new_user → redirect('/dashboard')"
    - from: "LoginForm onSubmit"
      to: "actions.ts loginAction"
      via: "Server Action; supabase.auth.signInWithPassword() → redirect('/dashboard')"
    - from: "Hero 'Get Started' button"
      to: "/register"
      via: "<Link href='/register'> (D-06)"
---

## Canonical References

**MUST READ before starting any task:**

1. `DESIGN.md` — Tüm tokens (renk, font, spacing, rounded, components). BAĞLAYICI.
2. `tasarimornegi/LandingPage.html` — **Primary visual reference**. Her bölümün layout/spacing/tonunu bu dosyadan oku.
3. `.planning/phases/01-foundation-auth-db-layout/01-CONTEXT.md` — D-04 (production quality), D-05 (animated preview), D-06 (Hero→register), D-07 (DESIGN.md token kullanımı)
4. `.planning/research/PITFALLS.md` §"Next.js 15 + Supabase SSR" #3 (hydration mismatch from auth state) — auth state'i Client Component initial render'da OKUMA
5. `.planning/phases/01-foundation-auth-db-layout/SKELETON.md` §2 (route group yapısı), §6 (UI sistemi)
6. `01-PLAN-1A.md` — Supabase client factory'lerinin nereden import edileceği, `lib/validators/auth.ts` Zod şemaları
7. `CLAUDE.md` §10 (stack), §14 (UI/UX yönü), §20 (kod kalitesi)

---

## Objective

Production kalitesinde landing page (6 bölüm + animasyonlu dashboard preview) + login/register/pricing
sayfalarını teslim eder. Phase 1 success criterion #1'i (UI tarafı — register→login→dashboard akışı)
TAM satisfy eder; FOUND-01, FOUND-02, FOUND-03, LAND-01, LAND-02, LAND-03'ü kapatır.

**Tasarım kuralı (bağlayıcı):** Hiçbir renk hex değeri component dosyalarında **hardcode** edilmez —
tüm renkler `tailwind.config.ts`'deki DESIGN.md token isimleri (örn. `bg-primary-container`,
`text-on-surface`) üzerinden. `LandingPage.html` referansından kopyalanan inline style varsa
token karşılığına çevrilir.

---

## Tasks

### Task 1: Marketing layout + Landing page sections (Hero, Problem, How It Works, Pricing, FAQ, CTA) + nav/footer  *(L)*

**Files:**
- `src/app/(marketing)/layout.tsx`
- `src/app/(marketing)/page.tsx`
- `src/app/(marketing)/pricing/page.tsx`
- `src/components/landing/MarketingNav.tsx`
- `src/components/landing/MarketingFooter.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/Problem.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/Pricing.tsx`
- `src/components/landing/Faq.tsx`
- `src/components/landing/Cta.tsx`
- shadcn primitives: `src/components/ui/{button,card,badge,accordion}.tsx`

**Action:**
1. shadcn primitives'i vendorize et: `npx shadcn@latest add button input label card badge accordion`. DESIGN.md `rounded-md` (button) / `rounded-lg` (card) kuralına uy. Tüm primitives `"use client"` gerektirenler için doğru direktifle.
2. **MarketingNav** (`MarketingNav.tsx`) — sticky top, transparent over Hero scroll position; logo solda, ortada "Product / Pricing / FAQ" anchor link'ler, sağda "Log In" (ghost) + "Get Started" (primary gradient → `/register`). LandingPage.html nav stilini takip et.
3. **Hero** (`Hero.tsx`) — `"use client"` (Framer Motion için).
   - Başlık (display-lg): **"Find local businesses that actually need your services."** (LAND-01)
   - Alt başlık (body-lg, `on-surface-variant`): LoexAI'ın opportunity intelligence platformu olduğunu özetleyen 2 cümle (CLAUDE.md §2'den) — Türkçe değil İngilizce, çünkü ürünün hedefi global freelancer/ajans.
   - Primary CTA: "Get Started" → `<Link href="/register">` (D-06). Secondary CTA: "See how it works" → `#how` anchor.
   - Arka plan: surface gradient + soft cyan glow accent (DESIGN.md §Elevation).
   - Scroll-fade-up animasyon (Framer Motion `motion.div initial={{opacity:0, y:24}} whileInView={{opacity:1, y:0}} viewport={{once:true}}`).
4. **Problem** (`Problem.tsx`) — 3 sütunlu pain point grid (CLAUDE.md §2'deki çekirdek vizyondan çıkar):
   - "Manual research wastes hours"
   - "Generic pitches get ignored"
   - "Build prompts? You write them yourself."
   Her kart: ikon (Lucide), title-md başlık, body-sm açıklama. `bg-surface-container` + 1px `outline-variant` border.
5. **HowItWorks** (`HowItWorks.tsx`) — 3 adımlı pipeline gösterimi (CLAUDE.md §3'teki 7-step özet):
   - "1. Discover" — yerel işletmeleri tara
   - "2. Analyze" — dijital eksikleri ve fırsat skorunu hesapla
   - "3. Sell + Build" — cold email + build prompt üret
   Numerik adım rozeti (JetBrains Mono, `bg-primary-container/15` pill). Adımlar arası ince çizgi/ok.
6. **DashboardPreview** (kendi task'ı — bkz. Task 2) — `<DashboardPreview />` import'u burada.
7. **Pricing** (`Pricing.tsx`) — Phase 1'de Stripe yok, ama plan yapısını göster:
   - 3 plan: Starter (Free — 20 credits), Pro ("Coming Q1"), Agency ("Coming Q1")
   - Pro/Agency butonu disabled + "Coming soon" tooltip
   - Starter butonu → `/register`
   - Her plan card: title-md, fiyat (display-lg JetBrains Mono), 5-7 feature bullet (Lucide check)
8. **Faq** (`Faq.tsx`) — shadcn `Accordion`. 6-8 gerçek soru:
   - "What is LoexAI?" (CLAUDE.md §2 cevabı)
   - "Is this a lead scraper?" (Hayır — opportunity intelligence; CLAUDE.md §2)
   - "What does a credit get me?"
   - "Do you store business data forever?" (Google Places 30-day policy — PITFALL §Places-2)
   - "Can I use my own AI provider?" (Evet, AIProvider interface — CLAUDE.md §9)
   - "What about EU data?" / "Is my data shared?"
   - vs.
9. **Cta** (`Cta.tsx`) — final conversion section: büyük başlık + primary CTA → `/register`. `bg-primary-container` background ile kontrast.
10. **MarketingFooter** — logo, kısa açıklama, link kolonları (Product, Resources, Legal). Email: `hello@loexai.com`. Copyright + "Made with intent" tagline. Görsel referans için LandingPage.html footer.
11. **`src/app/(marketing)/layout.tsx`** — `<MarketingNav />` + `{children}` + `<MarketingFooter />`. Body class `bg-surface text-on-surface`.
12. **`src/app/(marketing)/page.tsx`** — `<Hero />, <Problem />, <DashboardPreview />, <HowItWorks />, <Pricing />, <Faq />, <Cta />` sırasıyla. Section'lar arası `py-stack-xl` (48px).
13. **`src/app/(marketing)/pricing/page.tsx`** — `<Pricing />` standalone full-width section + üst nav'ı override eden bir başlık. (LAND-02)
14. **Public route allowlist** — middleware 1A'da `/`, `/pricing`, `/login`, `/register` zaten public. Buraya ek route YOK.

**Anti-pattern uyarısı (PITFALL §Next.js-3):** Hero/Pricing'de auth state'i Client Component initial render'da okuma. Auth state'e bağlı varyant istenirse Server Component'tan prop olarak geç (örn. `<MarketingNav authenticated={Boolean(user)} />`).

**Verify:**
- `npm run dev` → http://localhost:3000 landing açılır
- Görsel olarak `tasarimornegi/LandingPage.html` ile yan yana karşılaştır: section sırası, spacing, ton uyumlu
- Lighthouse mobile: Performance ≥ 80, Accessibility ≥ 90 (font yükleme + alt text + semantic HTML)
- `npx tsc --noEmit` 0 hata
- DevTools elements panel: hardcoded `#hex` color YOK (sadece DESIGN.md token sınıfları)
- Hero CTA → tıkla → `/register`'a yönlendir
- Pricing "Get Started" → `/register`
- Mobile responsive (375px) — sidebar nav hamburger'a düşer, tek kolon stack

**Done:** Tüm 6 section render'da; DESIGN.md token uyumu doğrulandı; mobile/desktop test edildi; LandingPage.html ile görsel paritede.

---

### Task 2: DashboardPreview animated component  *(M)*

**Files:**
- `src/components/landing/DashboardPreview.tsx`

**Action:**
1. **Component spec (D-05 — "live intelligence feed" hissi):**
   - Layout: kart içinde mini-dashboard mock — sol "Scan progress" bölümü + sağ "Latest opportunity" kartı.
   - **Sol bölüm:** üst kısımda input mock ("dentists in Istanbul, 2km") + altında 5-7 işletme satırı sırayla "Analyzing..." → "Score: XX" şeklinde animate olarak akar. Her satır 600ms aralıklı `motion.div` ile fade-in. İşletme isimleri fake ama Türkçe (örn. "Klinik Beyaz", "Cafe Mavi", "Berber Yusuf"). Skor 0'dan rastgele (45-92 arası sabit liste) sayar (CountUp pattern — Framer Motion `useMotionValue` + `useTransform`).
   - **Sağ bölüm:** seçilmiş "Klinik Beyaz" için detay kartı — Opportunity Score: 87 (büyük JetBrains Mono), priority badge "HIGH" (amber pill, DESIGN.md §Components Opportunity Badges), gap listesi (3 madde Lucide check), kısa "Recommended: Business Website + Booking" satırı.
   - Animasyon döngüsü: 8 saniyede tam tur (5 işletme akar → detay kartı belirir → 2sn dur → reset). `setInterval` yerine Framer `useAnimationFrame` veya basit `useEffect` interval.
   - `"use client"` zorunlu (Framer Motion + interval).
2. **Token kuralları:**
   - Konteyner: `bg-surface-container` + `rounded-lg` + 1px `outline-variant` + ambient shadow.
   - Aktif "analyzing" satırı: cyan glow (`shadow-[0_0_24px_rgba(0,217,255,0.35)]`).
   - Skor: JetBrains Mono, font-medium, `text-on-surface`.
   - Priority badge: `bg-amber-500/15 text-amber-300` (HIGH için); kategorize edilmiş 4 renk için DESIGN.md §Data Semantic.
3. **Accessibility:** `aria-hidden="true"` tüm dekoratif animasyonlar; reduced-motion respect (`useReducedMotion` → animasyonu pasif yap, statik snapshot göster).
4. **Performans:** animasyon `isAnimationActive` Recharts pitfall'ı gibi — bu component Recharts kullanmıyor ama yine de `will-change-transform` ile compositor hint.

**Verify:**
- `npm run dev` → landing'de DashboardPreview döngüsü 8sn'de bir başa döner, frame drop yok (Chrome DevTools Performance)
- `prefers-reduced-motion: reduce` set'le → animasyon durur, statik final state görünür
- DevTools elements: hardcoded hex yok; sadece Tailwind token sınıfları
- Mobile (375px) — kart tek sütuna döner, animasyon hala akıcı

**Done:** "Live intelligence feed" hissi veren animasyonlu dashboard preview; D-05 satisfy.

---

### Task 3: Auth shell + login/register/logout (Server Actions)  *(M)*

**Files:**
- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/logout/route.ts`
- `src/app/(auth)/actions.ts`
- `src/components/auth/AuthShell.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/RegisterForm.tsx`
- shadcn primitives: `src/components/ui/{input,label}.tsx` (vendorize)

**Action:**
1. **AuthShell** — minimal centered layout: logo top-center, `<Card>` ortalanmış (max-w-md), arka plan `bg-surface` + subtle dot pattern. Sol/sağda hero'nun light branded paneli yok (MVP basit).
2. **LoginForm** — `"use client"`, controlled inputs (email, password), submit → `loginAction` Server Action call. shadcn `Input` + `Label`. "Forgot password?" link disabled (CONTEXT — Deferred). Bottom: "Don't have an account? **Sign up**" → `/register`.
3. **RegisterForm** — aynı yapı; submit → `registerAction`. Minimum şifre 8 karakter (Zod). "Already have an account? **Log in**".
4. **`actions.ts`** (Server Actions, `"use server"`):
   - `registerAction(formData)`:
     - `LoginSchema`/`RegisterSchema` (1A `lib/validators/auth.ts`) ile parse
     - `createServerClient` → `supabase.auth.signUp({email, password})`
     - Hata varsa `{ ok: false, message }` döner
     - Başarılı: `redirect('/dashboard')` (next/navigation `redirect`). `handle_new_user` trigger (1A) public.users satırını zaten oluşturmuş olur.
   - `loginAction(formData)`:
     - Zod parse → `signInWithPassword({email, password})`
     - Hata: `{ ok: false, message: "Invalid credentials" }` (gerçek hatayı leak etme)
     - Başarılı: `redirect('/dashboard')`
   - Her ikisi de `import "server-only"` veya `"use server"` direktifi ile.
5. **`logout/route.ts`** — `POST` handler: `createServerClient` → `supabase.auth.signOut()` → `NextResponse.redirect(new URL('/login', request.url), 303)`. `<MarketingNav />` ve `<DashboardHeader />` (1D) çıkış butonları bu endpoint'e POST eder (HTML form ile, prefetch-safe).
6. **`(auth)/login/page.tsx`** — Server Component; eğer user zaten auth'lu ise (`getClaims` döner) `redirect('/dashboard')`. Aksi halde `<AuthShell><LoginForm /></AuthShell>`.
7. **`(auth)/register/page.tsx`** — aynı pattern.
8. **Error display:** form submit hatasında inline `<p role="alert">` ile. `useFormState` (React 19 / Next 15) ile Server Action return value'ları client'a taşı.
9. **Public route allowlist (zaten 1A middleware'inde):** `/login`, `/register` public. Auth'lu user bu sayfaları açarsa Server Component üzerinden `/dashboard`'a yönlendir.

**Verify:**
- Browser akışı:
  1. `/register` → boş form → submit → "Email is required" hata
  2. `/register` → `bademail` + `12345` → "Invalid email", "Password too short"
  3. `/register` → `test2@example.com` + `password1234` → submit → `/dashboard` render
  4. Supabase Dashboard public.users → satır mevcut, `credits=20`, `role='user'`
  5. `/logout` POST (form butonu) → `/login` redirect, cookie'ler silindi (DevTools Application → Cookies boş)
  6. `/login` → `test2@example.com` + `password1234` → `/dashboard` render
  7. `/login` → yanlış şifre → "Invalid credentials"
  8. Auth'luyken `/login` URL'sini elle aç → `/dashboard`'a redirect
- `npx tsc --noEmit` 0 hata
- `grep -r "getSession" src/` 0 sonuç

**Done:** Login/register/logout uçtan uca çalışıyor; Zod validation hatalarını gösteriyor; auth'lu user public auth sayfalarından dashboard'a yönlendiriliyor; logout cookie'leri temizliyor.

---

### Task 4 (Checkpoint): Landing + auth full UAT  *(checkpoint:human-verify)*

**What was built:**
- Production-quality landing page (6 sections + animated preview)
- Pricing page
- Login + register + logout (Server Actions, Zod, getClaims-based)
- DESIGN.md token-only styling, Geist + JetBrains Mono, dark theme

**How to verify:**
1. http://localhost:3000 → landing açılır; Hero başlığı doğru ("Find local businesses..."); CTA → `/register`
2. Tüm 6 section görünür: Hero, Problem, How It Works (sıra), Dashboard Preview animasyonu döner, Pricing, FAQ, CTA
3. Yan yana karşılaştır `tasarimornegi/LandingPage.html` ile — section sırası, renk paleti, font, spacing pariteli
4. Mobile 375px viewport — tüm section'lar tek sütun, navigation hamburger menü, FAQ accordion açılıp kapanır
5. `/pricing` → standalone sayfa, 3 plan görünür, Starter → `/register`
6. `/register` ile yeni kullanıcı oluştur → `/dashboard` placeholder sayfası (1D'den önce 404 olabilir — 1D PLAN'ında doldurulacak; YA da 1A'da `/dashboard` için minimal `<p>Hello {email}</p>` placeholder ekle ki 1C UAT'ı temiz geçsin)
7. Logout butonu (provisional, marketing nav'da auth'luysa görünen — TASK 1 ile uyumlu) → `/login` redirect
8. Re-login → DB'deki kullanıcı için başarılı, dashboard placeholder görünür
9. Yanlış credential, kısa şifre, geçersiz email — hata mesajları görünür
10. DevTools Network → `SUPABASE_SERVICE_ROLE_KEY` bundle'da yok; `Authorization: Bearer` header'ı yalnızca server-side cookie üzerinden geliyor (client'tan plaintext token görünmüyor)
11. `npx tsc --noEmit` ve `npm run build` 0 hata

**Resume signal:** "approved" veya hata listesi.

---

## Goal-Backward Verification

| Success Criterion (Phase 1) | Karşılanır mı? | Nasıl? |
|---|---|---|
| #1 register → /login → /dashboard | TAM (UI tarafı) | LoginForm + RegisterForm + Server Actions; trigger 1A'dan; dashboard içeriği 1D |
| #2 auth'suz /dashboard → /login | Zaten 1A middleware | bu plan değiştirmiyor; sadece login/register UI sağlıyor |
| #4 sidebar/header'da credits görünür | HAYIR — 1D'nin işi | (yalnızca DB tarafı 1A+1B tarafından sağlandı) |

---

## Open Questions

- Marketing nav auth-aware variant: marketing nav'da kullanıcı auth'lu ise "Get Started" yerine "Dashboard" butonu mu görünmeli? CONTEXT bunu açıkça çözmüyor — **Claude'un discretion'ı:** evet, auth'luysa "Dashboard" + "Log out", aksi halde "Log in" + "Get Started". Server Component'tan prop geçilir, hydration mismatch yok.
- "Made with intent" tagline footer'da kullanılsın mı yoksa daha kurumsal mı? — discretion; ürün hissine uygun.


---

## Changelog

- **Fix #7:** No file edits needed in this plan — logout route stays at `src/app/(auth)/logout/route.ts` (cohesion with auth group). PLAN-1A middleware allowlist was updated to include `/logout`. Recorded here for traceability of the cross-plan resolution.
