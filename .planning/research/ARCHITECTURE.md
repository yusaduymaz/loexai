# Architecture Research — LoexAI

**Researched:** 2026-05-22
**Overall confidence:** HIGH (Upstash Workflow docs verified, Google pricing from official source, patterns from multiple production references)

---

## Multi-Step Pipeline Patterns

### The Core Problem

An 8-step sequential pipeline where each step consumes the previous step's output has two failure axes:
1. **Transient failures** — rate limit 429s, network timeouts, LLM API unavailability. These are retryable.
2. **Quality failures** — AI hallucination, bad parse result, missing enrichment data. These are NOT retryable with the same input; they need a different response (log, skip, flag).

Production systems distinguish these explicitly. Retrying a hallucination does the same wrong thing again. [Source: Temporal AI Agent Failures post, Coverge multi-agent orchestration guide]

### Recommended Orchestration: Upstash Workflow (not raw QStash)

Upstash offers two products: **QStash** (raw message queue) and **Workflow** (durable step orchestrator). For LoexAI's pipeline, use **Upstash Workflow**. It is purpose-built for exactly this shape of problem.

Each pipeline stage becomes a `context.run()` step. Steps execute sequentially; each step's output feeds the next. If a step fails, Workflow retries only that step (not the whole pipeline), preserving all prior step results in its execution log.

```typescript
// src/app/api/pipeline/route.ts
import { serve } from "@upstash/workflow/nextjs";
import { runDiscovery } from "@/lib/discovery";
import { runEnrichment } from "@/lib/enrichment";
import { runGapAnalysis } from "@/lib/scoring";
// ...

export const { POST } = serve<{ businessId: string }>(async (context) => {
  const { businessId } = context.requestPayload;

  // Step 1 — deterministic, no AI
  const enrichment = await context.run("enrichment", async () => {
    return runEnrichment(businessId);
  });

  // Step 2 — deterministic, no AI
  const gaps = await context.run("gap-analysis", async () => {
    return runGapAnalysis(businessId, enrichment);
  });

  // Step 3 — deterministic scoring
  const score = await context.run("opportunity-scoring", async () => {
    return runOpportunityScoring(businessId, gaps);
  });

  // Step 4 — AI reasoning (only now, after deterministic work is done)
  const recommendation = await context.run("solution-recommendation", async () => {
    return runSolutionRecommendation(businessId, score, gaps);
  });

  // Steps 5-7 follow the same pattern
});
```

**Key properties of this approach (HIGH confidence — from Upstash official docs):**
- Automatic retry with exponential backoff, 3 attempts per step by default before DLQ
- Resume from DLQ picks up from the exact failed step, not from the beginning
- `failureFunction` callback for Sentry/logging when a run enters DLQ
- Steps are idempotent by design because Workflow deduplicates step execution via its internal log

### Failure Classification Pattern

Wrap AI calls to distinguish retryable from non-retryable errors:

```typescript
// lib/ai/error-classifier.ts
export class AIQualityError extends Error {
  readonly retryable = false; // Don't retry; log and flag the business
}

export class AITransientError extends Error {
  readonly retryable = true;  // Let Workflow retry normally
}
```

Within each `context.run()` step, throw `AIQualityError` when Zod validation of AI output fails after the built-in retry exhausts. This causes the step to fail into DLQ for manual review rather than burning retries on bad output.

### Per-step Partial Result Persistence

Do NOT wait until the full pipeline completes before writing to the database. Write to the database at the END of each step inside `context.run()`. This means if a later step fails, the earlier enrichment/gap data is still queryable and the Business Report page can show partial results. This is the "partial result" pattern used in production SaaS pipelines.

```typescript
const enrichment = await context.run("enrichment", async () => {
  const result = runEnrichment(businessId);
  // Write to DB inside the step — survives failure of later steps
  await supabase.from("business_enrichments").upsert({ business_id: businessId, ...result });
  return result;
});
```

---

## Website Analysis Feasibility

### What is Achievable from a Serverless Environment (no headless browser)

The enrichment layer is deterministic. These checks are feasible using a plain `fetch()` in a Next.js Route Handler or Supabase Edge Function — no Puppeteer, no browser infrastructure:

| Signal | Method | Feasibility |
|--------|--------|-------------|
| Website existence | `fetch(url)` → check HTTP status | HIGH — straightforward |
| SSL validity | `fetch()` will throw on invalid SSL; or use `ssl-checker` npm package | HIGH |
| HTTP→HTTPS redirect | Follow redirect chain, inspect final protocol | HIGH |
| Mobile viewport meta tag | `fetch()` + parse HTML with `cheerio`, look for `<meta name="viewport">` | HIGH |
| Contact form / CTA presence | `cheerio` selectors for `<form>`, `tel:`, `wa.me` links | HIGH |
| WhatsApp CTA | Search HTML for `wa.me` or `api.whatsapp.com` | HIGH |
| Online booking signals | Search for keywords: `book`, `appointment`, `calendly`, `acuity` | MEDIUM |
| Page title / description | `cheerio` — `<title>` and `<meta name="description">` | HIGH |
| Schema.org structured data | Parse `<script type="application/ld+json">` | HIGH |

**What is NOT feasible from serverless fetch:**

| Signal | Problem | Alternative |
|--------|---------|-------------|
| JavaScript-rendered content | `fetch()` gets raw HTML; React/Vue SPAs return empty shell | Use Browserless.io / Hyperbrowser as paid service; mark as "unknown" if fetch content is too thin |
| PageSpeed / Core Web Vitals | Requires Google PageSpeed Insights API | Use Google PageSpeed Insights API (free, 25,000 req/day) separately |
| Real mobile rendering | Requires actual browser | Mark as "inferred from viewport meta" — sufficient for gap analysis |

### Recommended Enrichment Stack

```
fetch() + cheerio  →  deterministic signal extraction
  +
ssl-checker (npm)  →  SSL certificate validation
  +
Google PageSpeed Insights API (free)  →  performance score
```

This requires zero paid browser infrastructure. Store "unknown" for any signal that cannot be determined from raw HTML — never infer.

### Vercel Serverless Function Limits

Vercel serverless functions time out at 10 seconds (Hobby) or 60 seconds (Pro) by default. A website analysis `fetch()` for an unresponsive site can hang. Always set explicit timeouts:

```typescript
const response = await fetch(url, {
  signal: AbortSignal.timeout(8000), // 8 second hard cap
});
```

For the Upstash Workflow approach, each step runs as a separate serverless invocation, so the 60-second limit applies per step, not to the whole pipeline.

---

## Idempotent Pipeline Design

### The Core Pattern: PostgreSQL UPSERT

Every pipeline table uses `INSERT ... ON CONFLICT (business_id) DO UPDATE SET ...`. The `(user_id, place_id)` unique constraint on `businesses` and `business_id` unique constraints on all downstream tables enforce exactly-one-result-per-business.

```sql
-- Pattern used in every downstream pipeline table
INSERT INTO business_enrichments (business_id, has_website, digital_maturity_score, ...)
VALUES ($1, $2, $3, ...)
ON CONFLICT (business_id) DO UPDATE SET
  has_website = EXCLUDED.has_website,
  digital_maturity_score = EXCLUDED.digital_maturity_score,
  updated_at = NOW();
```

This is atomic at the DB level. Whether the pipeline ran once or five times, there is exactly one row per business. [HIGH confidence — standard PostgreSQL pattern, verified against multiple data engineering sources]

### Status Column Pattern

The `scan_jobs` table tracks pipeline state with a `status` enum. The `opportunities` table has its own `status` for business lifecycle. Pipeline stages should also store a `pipeline_stage` on the business or scan_job row to enable "resume from stage X" scenarios without re-running earlier steps.

Recommended `scan_jobs.status` values: `queued` → `running` → `completed` | `partial` | `failed`

Use `partial` when some but not all businesses in a scan job completed their pipeline.

### Supabase-Specific Upsert

Supabase's JavaScript client supports upsert natively:

```typescript
await supabase
  .from("business_enrichments")
  .upsert(
    { business_id: businessId, has_website: true, ... },
    { onConflict: "business_id" }
  );
```

---

## Provider Abstraction Patterns

### The Interface Pattern (TypeScript)

TypeScript interfaces disappear at runtime. For env-driven provider selection, use a factory function that returns a concrete class — both implementing the same interface.

```typescript
// lib/discovery/types.ts
export interface DiscoveryProvider {
  search(input: DiscoveryInput): Promise<RawBusiness[]>;
}

// lib/discovery/google-places.provider.ts
export class GooglePlacesProvider implements DiscoveryProvider {
  async search(input: DiscoveryInput): Promise<RawBusiness[]> {
    // Google Places API (New) Text Search
  }
}

// lib/discovery/rapidapi.provider.ts
export class RapidAPIProvider implements DiscoveryProvider {
  async search(input: DiscoveryInput): Promise<RawBusiness[]> {
    // RapidAPI Maps scraper
  }
}

// lib/discovery/index.ts  — factory, reads env
export function getDiscoveryProvider(): DiscoveryProvider {
  const provider = process.env.DISCOVERY_PROVIDER ?? "google_places";
  switch (provider) {
    case "rapidapi":     return new RapidAPIProvider();
    case "google_places":
    default:             return new GooglePlacesProvider();
  }
}
```

The same pattern applies to `AIProvider`:

```typescript
// lib/ai/types.ts
export interface AIProvider {
  generate<T>(prompt: string, schema: ZodSchema<T>, model?: ModelTier): Promise<T>;
}

// ModelTier controls cost: "reasoning" maps to claude-sonnet, "cheap" maps to claude-haiku
export type ModelTier = "reasoning" | "cheap";

// lib/ai/index.ts
export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER ?? "openrouter_free";
  switch (provider) {
    case "anthropic":      return new AnthropicProvider();
    case "openrouter_free":
    default:               return new OpenRouterProvider();
  }
}
```

**Critical rule:** All callers import `getDiscoveryProvider()` or `getAIProvider()` — never instantiate a concrete class directly in application code. This is the only way a provider swap requires zero code changes.

### Zod Schema as Contract

Every AI call is typed via a Zod schema passed into `AIProvider.generate()`. The provider is responsible for parsing and validating — callers receive a typed result or a thrown error. This keeps validation centralized.

```typescript
const OpportunityReasoningSchema = z.object({
  observedFact: z.string(),
  inference: z.string(),
  opportunity: z.string(),
  reasoning: z.string(),
});

const result = await aiProvider.generate(
  prompt,
  OpportunityReasoningSchema,
  "reasoning"
);
// result is fully typed: { observedFact: string; inference: string; ... }
```

---

## Background Job Architecture

### QStash vs. Workflow — Choose Workflow

Raw QStash delivers HTTP messages. It does not understand steps or pipelines. You would have to build step chaining manually (each step's handler publishes the next message). This is error-prone.

**Upstash Workflow** (built on top of QStash) is the correct choice. It handles step chaining, retry logic, DLQ routing, and state passing between steps automatically. Use `@upstash/workflow` package, not raw `@upstash/qstash` directly for the pipeline.

### Retry Configuration (HIGH confidence — from Upstash official docs)

- Default: 3 retries per step with exponential backoff
- Configurable via the `retries` option on `serve()`
- After exhausting retries, the run moves to the **Dead Letter Queue (DLQ)**
- DLQ entries support three recovery actions via REST API: **Resume** (from failed step), **Restart** (from beginning), **Callback** (re-trigger failure notification)

```typescript
export const { POST } = serve<PipelinePayload>(
  async (context) => { /* steps */ },
  {
    retries: 3, // per step
    failureFunction: async ({ context, failStatus, failResponse }) => {
      // Log to Sentry, mark scan_job as "partial", notify admin
      await supabase
        .from("scan_jobs")
        .update({ status: "partial", error_message: failResponse })
        .eq("id", context.requestPayload.scanJobId);
    },
  }
);
```

### Scan Job as the Outer Coordinator

A scan job discovers N businesses. Each business triggers its own Workflow run. The scan_job row tracks aggregate progress (found_count, analyzed_count, error_count). This decouples discovery throughput from pipeline throughput — if enrichment for one business fails, the other businesses continue.

```
scan_job (one per user search)
  └── workflow run per business (independent, own retry lifecycle)
        ├── step: enrichment → write business_enrichments
        ├── step: gap-analysis → write gap_analyses
        ├── step: scoring → write opportunities
        ├── step: solution-recommendation → write solution_recommendations
        ├── step: sales-strategy → write sales_strategies
        └── step: build-prompt → write build_prompts
```

### Credit Check Position

The credit check must happen **before** the Workflow run is triggered, in the scan initiation Route Handler, not inside the Workflow itself. A Workflow step that fails after a credit deduction that happened in a previous step cannot easily refund. Check and deduct atomically before enqueue.

---

## Google Places API

### Pricing (as of March 2025, from official Google docs — HIGH confidence)

**Places API (New) — Text Search:**
- Essentials tier (IDs + basic fields): $32.00 / 1,000 requests, first 10,000/month free
- Pro tier (includes hours, photos, reviews): $32.00 / 1,000 requests, first 5,000/month free
- Enterprise tier: $35.00 / 1,000 requests, first 1,000/month free

**Places API (New) — Place Details:**
- Essentials tier: $5.00 / 1,000 requests, first 10,000/month free
- Pro tier: $17.00 / 1,000 requests, first 5,000/month free
- Enterprise tier: $20.00 / 1,000 requests, first 1,000/month free

Use **field masks** (`X-Goog-FieldMask` header) to request only the fields you need. Requesting only ID-tier fields (name, place_id, location) keeps you in the Essentials SKU at lowest cost.

### MVP Cost Estimate (100-1,000 businesses/month)

For a typical LoexAI scan: 1 Text Search call discovers up to 20 results (API max per page). Fetching 60 results = 3 Text Search calls. For each business, 1 Place Details call fetches phone, website, hours, rating.

| Volume | Text Search calls | Place Details calls | Monthly cost (Pro tier) |
|--------|------------------|---------------------|------------------------|
| 100 businesses | ~15 calls | 100 calls | Free (within free tier) |
| 500 businesses | ~75 calls | 500 calls | Free (within free tier) |
| 1,000 businesses | ~150 calls | 1,000 calls | ~$17 (Place Details Pro) |

MVP scale (under 1,000 businesses/month) fits entirely or nearly entirely within the free tier. Cost only becomes meaningful at 5,000+ businesses/month.

### Hard Limits to Know

- Text Search (New) returns maximum **20 results per page** (use `pageToken` for next page, maximum 3 pages = 60 results per search query)
- No official QPM rate published in docs; the Google Cloud Console Quotas page for the project shows the actual default (typically 600 QPM for Places API in most regions)
- Results are capped at 60 per location+category search — for saturated categories in large cities, use radius narrowing or sub-category splitting

### Recommended Discovery Strategy

```
Text Search (New)  →  returns up to 60 place_ids per query
  →  for each place_id, Place Details (New)  →  returns full business record
  →  dedup on (user_id, place_id) before persisting
```

Request only needed fields in Text Search to stay Essentials tier. Request Pro fields (website, phone, opening_hours, rating, user_ratings_total) in Place Details only.

---

## Build Order Recommendation

Build in this sequence. Each phase's outputs are the inputs to the next.

### Phase 1 — Infrastructure Foundation
- Supabase migrations for all tables (run from CLAUDE.md Section 11 model)
- `AIProvider` interface + `OpenRouterProvider` (free, for development)
- `DiscoveryProvider` interface (stub implementation is fine)
- Upstash Workflow + Redis env setup
- Auth (Supabase Auth) + basic dashboard shell

**Why first:** Everything downstream depends on the DB schema and provider abstractions. Schema changes late in the project are expensive. Provider interfaces prevent lock-in from day one.

### Phase 2 — Discovery
- `GooglePlacesProvider` implementation
- Scan job creation, Workflow trigger, progress tracking
- Business deduplication via `(user_id, place_id)` unique constraint
- Lead table UI

**Why second:** Real business data is needed to develop and test all downstream layers. Without real leads, the pipeline has nothing to process.

### Phase 3 — Deterministic Intelligence (Enrichment + Scoring)
- `lib/enrichment/` — fetch + cheerio HTML analysis, SSL check, mobile viewport check
- `lib/templates/` — industry gap templates (clinic, restaurant, salon)
- `lib/scoring/` — opportunity scoring algorithm (pure code, no AI)
- Upsert pattern for all pipeline tables
- Business Report page (partial data visible as steps complete)

**Why third:** These are the highest-value, lowest-cost pipeline layers. They run without AI credits and validate the core value proposition before any AI spend.

### Phase 4 — AI Output Layers
- `AnthropicProvider` implementation (production AI)
- Sales strategy generation (`lib/prompts/sales-strategy.ts`)
- Build prompt generation (`lib/prompts/build-prompt.ts`)
- QA layer (hallucination check)
- Full Business Report page with AI sections
- `ai_usage` table logging per call

**Why fourth:** AI layers sit on top of deterministic outputs. Building them last means they receive real validated inputs, reducing hallucination risk and making QA meaningful.

### Phase 5 — SaaS Layer
- Credit system enforcement (pre-pipeline credit check)
- Stripe integration + plan tiers
- Admin panel (usage, jobs, templates, users)
- Rate limiting (Upstash Redis)
- Error monitoring

**Why last:** The product must work end-to-end before adding billing complexity. Adding Stripe to a broken pipeline wastes cycles.

---

## Sources

- [Upstash Workflow — Handle Failed Runs](https://upstash.com/docs/workflow/howto/failures)
- [Upstash Workflow SDK — GitHub](https://github.com/upstash/workflow-js)
- [Google Places API Usage and Billing (official)](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Google Maps Platform Pricing (official)](https://developers.google.com/maps/billing-and-pricing/pricing)
- [Google Maps Platform March 2025 Pricing Changes](https://developers.google.com/maps/billing-and-pricing/march-2025)
- [Temporal AI Agent Failures: 11 Production Pitfalls](https://www.xgrid.co/resources/temporal-ai-agent-orchestration-failure-patterns/)
- [Multi-agent orchestration: patterns, pitfalls, and production reality](https://coverge.ai/blog/multi-agent-orchestration)
- [Durable Workflow Platforms for AI Agents](https://render.com/articles/durable-workflow-platforms-ai-agents-llm-workloads)
- [Idempotent Pipelines — DEV Community](https://dev.to/alexmercedcoder/idempotent-pipelines-build-once-run-safely-forever-2o2o)
- [Metascraper — lightweight metadata extraction](https://metascraper.js.org/)
- [ssl-checker npm package](https://www.npmjs.com/package/ssl-checker)
