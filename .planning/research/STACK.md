# Stack Research — LoexAI

**Researched:** 2026-05-22
**Overall Confidence:** MEDIUM-HIGH (official docs verified for most findings)

---

## Stack Decisions (Already Locked)

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15+ App Router, TypeScript strict, Tailwind CSS, shadcn/ui, Framer Motion, Lucide Icons, Recharts |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions), RLS |
| AI | AIProvider interface — OpenRouter free models (dev), Anthropic Claude API (prod) |
| Queue / Cache | Upstash QStash (queue) + Upstash Redis (cache + rate limit) |
| Payments | Stripe (Phase 5 only) |
| Deployment | Vercel (frontend) + Supabase (db/auth/storage) |

---

## Open Questions & Findings

### 1. Next.js 15 + Supabase SSR Auth

**Confidence: HIGH** (official Supabase docs, verified)

**Package:** `@supabase/ssr` — this is the current (non-deprecated) package. The old `@supabase/auth-helpers-nextjs` is deprecated and must NOT be used.

**Install:**
```bash
npm install @supabase/supabase-js @supabase/ssr
```

**Environment variables — use new publishable key format:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=   # NOT the old ANON_KEY
```

**The core problem:** Server Components in Next.js cannot write cookies directly. The middleware acts as the proxy that (a) refreshes expired tokens and (b) propagates the refreshed token both to Server Components (via `request.cookies.set`) and back to the browser (via `response.cookies.set`).

**Two client factories are needed:**
- `createBrowserClient` — Client Components only. Already uses singleton pattern internally; call freely.
- `createServerClient` — Server Components, Server Actions, Route Handlers, and Middleware. Must be called fresh per request (cookies are per-request).

**Critical security rule — enforced, not optional:**
- Use `supabase.auth.getClaims()` to protect routes and read user identity in server code. This validates the JWT signature against the project's published public keys on every call.
- NEVER use `supabase.auth.getSession()` inside server code. It does not revalidate the token and is spoofable.

**Cookie handling pattern (middleware):**
The `setAll` callback in `createServerClient` receives cache headers (`Cache-Control`, `Expires`, `Pragma`) automatically since `@supabase/ssr` v0.10.0. Applying these headers to the response is sufficient for CDN compatibility — no extra manual configuration needed.

**Route protection pattern:**
Middleware runs on every request. After the Supabase token refresh, redirect unauthenticated users away from protected routes. The matcher config in `middleware.ts` should exclude static assets and `/_next/` paths to avoid unnecessary overhead.

**Migration note:** If starting fresh (as LoexAI is), ignore auth-helpers migration guides entirely — start directly with `@supabase/ssr`.

---

### 2. Upstash QStash Pipeline Patterns

**Confidence: HIGH** (official Upstash docs and blog posts verified)

**Critical finding: Use Upstash Workflow, not raw QStash, for the 8-step pipeline.**

Upstash Workflow is built on top of QStash (it uses QStash as its messaging layer) but adds the orchestration primitives that the LoexAI pipeline needs:

| Feature | Raw QStash | Upstash Workflow |
|---------|-----------|-----------------|
| Multi-step sequencing | Manual (publish next step from each handler) | Built-in (`context.run()`) |
| Step-level retry | No (full job retries) | Yes (only failed step retries) |
| State passed between steps | Must use external store | Preserved automatically |
| Timeout bypass on Vercel | No | Yes (each step gets full execution window) |
| Visual debugging dashboard | No | Yes |
| Timeout per step | Platform limit | QStash max (~400s for paid) per step |

**How it solves the Vercel 15s default timeout problem:**

When a `context.call()` (external API call, e.g., to Anthropic or Google Places) is encountered, the Vercel function terminates immediately — no idle time is billed. Workflow re-triggers the function when the external call completes. Each step in the 8-step pipeline gets its own full execution window.

**Cost:** Each `context.call()` costs ~2 QStash messages. At 100,000 messages = $1, an 8-step pipeline costs roughly $0.00016 per business analyzed. Negligible.

**Flow control (important for LoexAI's batch scanning):**
Upstash Workflow supports `Rate Limit` (max calls/second) and `Parallelism Limit` (concurrent executions). For batch scanning jobs submitted via `scan_jobs`, set a parallelism limit to avoid hammering Google Places API and Anthropic simultaneously.

**Pattern for the 8-step pipeline:**
```typescript
// src/app/api/pipeline/route.ts
import { serve } from "@upstash/workflow/nextjs"

export const { POST } = serve(async (context) => {
  // Step 1: Discovery (deterministic)
  const businesses = await context.run("discovery", async () => { ... })

  // Step 2: Enrichment (deterministic)
  const enriched = await context.run("enrichment", async () => { ... })

  // Steps 3-8: AI calls via context.call() to avoid Vercel timeouts
  const gaps = await context.call("gap-analysis", {
    url: process.env.ANTHROPIC_API_URL,
    body: { ... }
  })
  // ...etc
})
```

**Recommendation:** Provision Upstash Workflow from Phase 2 onward. Do not implement the pipeline inline inside route handlers — that will hit Vercel's 15s (default) or 5m (pro max) wall and break on AI calls.

---

### 3. OpenRouter Free Models for Structured JSON

**Confidence: MEDIUM** (OpenRouter docs partially blocked; cross-referenced from multiple sources)

**Rate limits for free tier:**
- Without credits purchased: 50 requests/day, 20 requests/minute
- With at least $10 credits purchased: 1,000 requests/day
- These are account-level limits shared across all free models

**Free models with confirmed structured output / JSON mode support (as of research date):**

| Model | Structured Output | Context | Notes |
|-------|-----------------|---------|-------|
| `openai/gpt-oss-120b` (OpenAI open-weight) | Yes (native) | 131K | Most reliable; no listed rate limits |
| `google/gemma-3` series | Yes (function calling + structured output) | Varies | Good math/reasoning |
| `mistralai/mistral-small-3.2-24b` | Yes (tool use + structured output) | Varies | Strong JSON adherence |
| `openrouter/free` router | Selects capable models automatically | — | Filters for structured output support if requested |

**Reliability warning (LOW confidence, flag for validation):**
Free models can disappear without notice (model deprecation, provider policy changes). Structured output quality varies — smaller free models may hallucinate JSON structure even with `response_format: json_schema`. The `AIProvider` abstraction in `lib/ai/` is therefore critical: if a free model fails JSON validation (caught by Zod), the system must retry or fall back gracefully.

**Practical recommendation for dev/test:**
Use `openai/gpt-oss-120b` as the default free model — it has confirmed native structured output support and a 131K context window (sufficient for the enrichment + gap analysis prompts). Pin the model ID in `lib/ai/openrouter.ts` as a constant; don't rely on `openrouter/free` router for dev because it selects randomly and makes behavior non-deterministic during testing.

**JSON schema approach:**
```typescript
// All AI calls must include response_format
const response = await openrouter.chat.completions.create({
  model: "openai/gpt-oss-120b",
  response_format: {
    type: "json_schema",
    json_schema: { name: "GapAnalysis", schema: gapAnalysisZodSchema }
  },
  messages: [...]
})
// Then validate with Zod — if fails, retry once, then throw
```

---

### 4. Supabase Edge Functions vs Route Handlers

**Confidence: HIGH** (official Supabase limits docs verified)

**Supabase Edge Function hard limits:**

| Limit | Free Tier | Paid Tier |
|-------|-----------|-----------|
| Wall clock duration | 150 seconds | 400 seconds |
| CPU time per request | 2 seconds | 2 seconds |
| Memory | 256 MB | 256 MB |
| Bundle size | 20 MB | 20 MB |
| Functions per project | 100 | 500+ |

**The 2-second CPU limit is the critical constraint.** Supabase Edge Functions run on Deno Deploy. CPU time (not wall clock) is capped at 2 seconds per request. An 8-step pipeline that calls Anthropic Claude API multiple times will easily exceed this CPU limit even though most of that time is async I/O waiting — Deno's CPU accounting may include serialization/deserialization overhead.

**For AI pipeline orchestration: use Vercel Route Handlers + Upstash Workflow, NOT Supabase Edge Functions.**

Supabase Edge Functions are appropriate for:
- Webhook receivers (short, fast)
- Database triggers / post-insert hooks
- Simple data transformations
- Auth hooks (Supabase-native)

**Next.js Route Handlers on Vercel are appropriate for:**
- Orchestrating the 8-step pipeline (via Upstash Workflow)
- Serving dashboard API endpoints
- Receiving QStash/Workflow callbacks

**Cold start comparison:**
- Supabase Edge Functions: ~400ms cold, ~125ms hot (community-reported)
- Vercel Route Handlers (Edge Runtime): comparable cold starts; Fluid Compute on Vercel reduces cold starts for sustained traffic
- For background jobs driven by Workflow, cold starts are less critical (the job is async)

**Decision: Keep all 8-step pipeline logic in Next.js Route Handlers. Use Supabase Edge Functions only for Supabase-native hooks (e.g., post-auth triggers, storage hooks).**

---

### 5. shadcn/ui + Recharts Dashboard

**Confidence: HIGH** (official shadcn docs + GitHub issues verified)

**Current state:** shadcn/ui chart component uses Recharts v3. This is a significant change from Recharts v2.

**Known breaking changes in Recharts v3 (relevant to LoexAI):**

| Issue | Details | Mitigation |
|-------|---------|-----------|
| TypeScript types rewritten | Many props removed from public types | Generate charts fresh with `npx shadcn add chart` — don't copy v2 examples |
| CSS color tokens changed | Must use `var(--chart-1)` not `hsl(var(--chart-1))` | Update color references |
| Tooltip positioning | Sometimes renders top-left before settling | Use `ChartTooltip.defaultIndex` for initial state |
| Animation lag | Charts cause side-animation lag on initial render | Use `isAnimationActive={false}` on dashboard tables where performance matters |
| `<Bar>` layout prop | Conflicts when parent `<BarChart>` also defines layout | Remove `layout` from `<Bar>` |

**Installation (correct approach for new project):**
```bash
npx shadcn@latest add chart
```
This vendorizes the chart component into your project (`components/ui/chart.tsx`). You own the code and can patch issues without waiting for upstream fixes.

**Dark mode:** Recharts + shadcn/ui theming integrates automatically via CSS variables. Charts respect dark/light mode with no extra configuration.

**Architecture pattern for LoexAI dashboard:**
- Use `ChartContainer` (shadcn) as the wrapper — handles responsive sizing and theme config
- Use native Recharts components (`AreaChart`, `BarChart`, `RadialBarChart`) inside it
- Use `ChartTooltip`, `ChartTooltipContent`, `ChartLegend` (shadcn wrappers) for consistent styling
- Add `"use client"` directive to chart components — Recharts uses browser APIs

**Recommended charts for LoexAI:**
- Opportunity score distribution: `RadialBarChart` or `BarChart`
- Revenue potential over time: `AreaChart`
- Pipeline stage funnel: `BarChart` horizontal
- AI token usage (admin): `AreaChart` stacked

**No fundamental incompatibility** between shadcn/ui and Recharts v3 — the issues are friction points during migration from v2, not blockers for a new project starting with v3 directly.

---

## Recommendations

**1. Use `@supabase/ssr` with `getClaims()` — no exceptions.**
Never use the deprecated auth-helpers package. Never use `getSession()` on the server. The middleware proxy pattern is mandatory for token refresh. Set this up in Phase 1 and treat it as foundational.

**2. Replace raw QStash with Upstash Workflow for the 8-step pipeline.**
CLAUDE.md specifies "Upstash QStash (queue)" but Upstash Workflow is the correct tool for multi-step orchestration — it is built on QStash and adds step-level retry, state passing, and Vercel timeout bypass. Update environment provisioning to include `UPSTASH_WORKFLOW_TOKEN` alongside `UPSTASH_QSTASH_TOKEN`. QStash remains appropriate for simple fire-and-forget jobs (e.g., triggering a scan from the dashboard).

**3. Keep all AI pipeline logic in Next.js Route Handlers, NOT Supabase Edge Functions.**
Supabase Edge Functions have a 2-second CPU cap that makes them unsuitable for multi-step AI orchestration. Edge Functions are appropriate only for Supabase-native hooks and lightweight webhooks.

**4. Pin a specific free model for dev (`openai/gpt-oss-120b`), not the `openrouter/free` router.**
The free router selects randomly, breaking deterministic testing. Pin the model ID as a constant in `lib/ai/openrouter.ts`. Add Zod validation with a single retry on JSON parse failure — free models occasionally produce malformed JSON even with `json_schema` response format.

**5. Start shadcn/ui charts with v3 primitives from day one.**
Use `npx shadcn@latest add chart` to vendor the component. Use `var(--chart-1)` color tokens (not the hsl wrapper). Disable animations on heavy dashboard pages (`isAnimationActive={false}`) to avoid lag. All chart components must be Client Components (`"use client"`).

---

## Confidence Assessment

| Area | Confidence | Source |
|------|-----------|--------|
| Supabase SSR auth pattern | HIGH | Official Supabase docs |
| Upstash Workflow for pipelines | HIGH | Official Upstash blog + docs |
| OpenRouter free model rate limits | MEDIUM | OpenRouter docs (partially blocked, cross-referenced) |
| OpenRouter structured output model list | MEDIUM | Cross-referenced from multiple search results |
| Supabase Edge Function limits | HIGH | Official Supabase limits page |
| shadcn/ui + Recharts v3 compatibility | HIGH | Official shadcn docs + GitHub issues |

---

## Sources

- [Supabase SSR Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase SSR Client Creation](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Edge Function Limits](https://supabase.com/docs/guides/functions/limits)
- [Upstash Workflow Announcement](https://upstash.com/blog/workflow-kafka)
- [Upstash Workflow: Solving Vercel Timeouts](https://upstash.com/blog/vercel-cost-workflow)
- [Upstash QStash Rate Limiting & Parallelism](https://upstash.com/blog/QStash-rateLimit)
- [OpenRouter Free Models Collection](https://openrouter.ai/collections/free-models)
- [OpenRouter Rate Limits Docs](https://openrouter.ai/docs/api/reference/limits)
- [OpenRouter Structured Outputs Guide](https://openrouter.ai/docs/guides/features/structured-outputs)
- [shadcn/ui Chart Component Docs](https://ui.shadcn.com/docs/components/radix/chart)
- [Recharts v3 Compatibility Issue](https://github.com/shadcn-ui/ui/issues/7669)
- [Supabase Edge Functions Architecture](https://supabase.com/docs/guides/functions/architecture)
