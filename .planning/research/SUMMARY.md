# Research Summary — LoexAI

**Synthesized:** 2026-05-22
**Sources:** STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md

---

## Top 5 Insights for Roadmap

1. **Upstash Workflow > raw QStash for the 8-step pipeline.** CLAUDE.md specifies QStash, but Upstash Workflow (built on QStash) is the correct tool — it provides step-level retry, state passing between steps, and Vercel timeout bypass (each step gets its own execution window). This is a drop-in upgrade with no architectural change to the pipeline design but must be provisioned in Phase 1.

2. **The magic moment is a single page: `/dashboard/business/[id]`.** Every onboarding and UX decision should optimize for getting users to a Business Report as fast as possible. Score + Gaps load instantly (deterministic); Solution + Sales Strategy load async (AI). Build Prompt is LoexAI's unique differentiator with no direct competitor — it must be in MVP.

3. **Hallucination accumulation is the #1 product-credibility risk.** If enrichment fails to fetch a website and stores silence instead of `null`, every downstream AI stage fabricates analysis around non-existent gaps. The null-propagation rule (explicit `null`/`"fetch_failed"` for unknown fields; pipeline stages refuse to run if required upstream fields are null) must be designed in Phase 3 before writing any pipeline stage.

4. **Google Places API has a 60-result hard cap per search.** Users scanning dense areas (Istanbul restaurants) will hit this. A geographic subdivision strategy (grid/cluster) must be built before the first scan job, with honest UI messaging about the limit.

5. **Cost explosion risk is real without circuit breakers.** A documented incident burned $4,200 in 63 hours. Max 2 retries per pipeline stage per business, per-job token budgets, and mid-job `ai_usage` table checks must be in Phase 3 before any AI call goes live.

---

## Confirmed Stack Decisions

| Component | Decision | Rationale |
|-----------|----------|-----------|
| Auth | `@supabase/ssr` + `getClaims()` | Old auth-helpers deprecated; `getSession()` is spoofable |
| Pipeline Orchestration | Upstash Workflow (not raw QStash) | Step-level retry, state preservation, Vercel timeout bypass |
| AI Calls (production) | Next.js Route Handlers + Workflow | Supabase Edge Functions have 2s CPU cap — unsuitable |
| Free dev model | `openai/gpt-oss-120b` pinned | Reliable JSON schema support; 131K context; stable |
| Charts | shadcn/ui chart + Recharts v3 | Native dark mode; use `var(--chart-1)` tokens; `"use client"` required |
| Discovery | Google Places API (primary) + RapidAPI (fallback) | Official, predictable cost; free tier covers MVP scale |

---

## Top 5 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Hallucination accumulation in pipeline | CRITICAL — product credibility collapses | Explicit `null` for unknowns; pipeline stages refuse with null upstream; QA compares to raw enrichment |
| Cost explosion from retry loops | CRITICAL — financial | Max 2 retries/stage; per-job token budget; circuit breaker in admin |
| Google Places 60-result cap | HIGH — user churn on dense areas | Geographic subdivision; honest UI messaging |
| OpenRouter free model instability | MEDIUM — dev/test breakage | Pin `openai/gpt-oss-120b`; AIProvider abstraction ensures swap is single env change |
| Supabase RLS policy gaps | HIGH — security breach | Test RLS with a second user account before Phase 2 ships; never bypass with service role in user-facing code |

---

## Recommended Build Order

**Phase 1: Foundation**
Next.js 15 + Supabase auth + Upstash Workflow provisioning + database schema (all tables from CLAUDE.md Section 11) + landing page + dashboard/admin layouts + `ai_usage` logging infrastructure

**Phase 2: Lead Discovery**
DiscoveryProvider interface + Google Places implementation + scan form + business deduplication + lead list UI + geographic subdivision (60-result cap mitigation) + credit check before scan

**Phase 3: Intelligence Pipeline**
Enrichment (deterministic) → Gap Analysis (templates + rules) → Opportunity Scoring (deterministic) → AI reasoning (score rationale + solution recommendation). Null-propagation rule and cost circuit breaker built first.

**Phase 4: AI Output**
Sales strategy (cold email, DM, WhatsApp) → Build Prompt → QA layer → Business Report page fully assembled → PDF/CSV export

**Phase 5: SaaS Layer**
Stripe billing + plan tiers + admin monitoring (AI usage costs, scan jobs) + error logging

---

## Critical Path to First User Value

```
1. Auth: signup → dashboard (Phase 1)
2. Discovery form: location + category → Places API → business list (Phase 2)
3. Business Report: deterministic enrichment + gap list + score (Phase 3)
4. Cold email: first AI-generated pitch asset (Phase 4)
→ TARGET: under 2 minutes from signup to copied cold email
```

The Build Prompt feature (Phase 4) is the unique moat — prioritize it immediately after cold email, not after Phase 5.

---

## Key Open Questions

1. **Batch scanning UI**: Should users see real-time progress per business or just a completion notification? (Impacts QStash Workflow UI design in Phase 2)
2. **Industry templates**: CLAUDE.md lists clinic, cafe, beauty salon. Are more needed at MVP? (3 is the minimum — more can be added per-phase)
3. **Credit pricing**: How many credits per scan? 1 credit per business analyzed, or 1 credit per scan job? (Recommend: 1 credit per business — more transparent)
4. **Enrichment depth**: Puppeteer/headless for JS-rendered sites — defer to Phase 3+? (Recommend: defer; mark JS-only sites as `"unknown"` in MVP)
5. **Google Places QPM**: Default QPM not published — check Cloud Console Quotas after API enabled.
