# LoexAI — Local Opportunity Engine AI

AI-powered local business opportunity intelligence platform.
LoexAI keşfeder → analiz eder → fırsat puanlar → satış stratejisi ve build prompt üretir.

> Detaylı mimari kararlar için `CLAUDE.md`'yi oku — buradaki kararlar bağlayıcıdır.

---

## Stack

- **Next.js 15** (App Router) + TypeScript strict
- **Tailwind CSS v3** + DESIGN.md token'ları (dark theme)
- **Supabase** — Auth, Postgres, RLS
- **@supabase/ssr** — server-side auth (`getClaims()`, NEVER `getSession()`)
- **Upstash Workflow / Redis** — pipeline orchestration + cache (Phase 2+)
- **AIProvider abstraction** — OpenRouter (dev), Anthropic (prod) — Phase 3+

---

## Local Setup

1. Node 20.x+ (LTS) ve `npm` kurulu olmalı.
2. Repo klonlandıktan sonra bağımlılıkları yükle:
   ```bash
   npm install
   ```
3. `.env.example`'ı kopyala ve gerçek değerleri gir:
   ```bash
   cp .env.example .env.local
   ```
   - **Supabase** anahtarları için: Supabase Dashboard → Project Settings → API.
     `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = **yeni publishable key** (legacy ANON değil).
   - Diğer servisler (Upstash, Anthropic, OpenRouter, Stripe, Google Places) Phase 1'de
     **provisioning** amaçlıdır; aktif kullanım sonraki faz'larda başlar.
4. Supabase migration'larını uygula:
   ```bash
   npx supabase db push
   ```
5. Geliştirme sunucusunu başlat:
   ```bash
   npm run dev
   ```
   → http://localhost:3000

---

## İlk Admin Promote

Phase 1'de admin rolü, ilk kullanıcı için Supabase Dashboard SQL Editor üzerinden
manuel olarak verilir. Detay: [`docs/admin-setup.md`](./docs/admin-setup.md).

---

## Scripts

| Komut | Açıklama |
|---|---|
| `npm run dev` | Dev sunucu (http://localhost:3000) |
| `npm run build` | Production build (strict TS + ESLint enforced) |
| `npm run start` | Production server |
| `npm run typecheck` | `tsc --noEmit` — strict tip kontrolü |
| `npm run lint` | ESLint |

---

## Klasör Yapısı

`SKELETON.md` (Phase 1) sabit dizin yapısını locklar. Yeni dosya eklemeden önce o
dosyaya bak — özellikle `src/lib/` altında nereye gideceğine.

---

## Lisans

Private — UNLICENSED.
