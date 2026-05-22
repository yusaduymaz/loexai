# Pitfalls Research — LoexAI

**Domain:** AI-powered local business opportunity intelligence SaaS
**Researched:** 2026-05-22
**Overall confidence:** HIGH (multiple authoritative sources per claim)

---

## AI Pipeline Pitfalls

### Pitfall 1: Hallucination Accumulation Across Pipeline Stages (CRITICAL)

**What goes wrong:** In an 8-stage pipeline, each stage receives the previous stage's output as context. If Stage 3 (Gap Analysis) hallucinates a gap ("no website found" when the website exists but timed out), Stage 4 scores that gap, Stage 5 recommends a solution for it, Stage 6 writes a sales pitch targeting it, and Stage 7 generates a build prompt for it. By Stage 8, the QA agent is checking consistency of output that was never grounded in real data — it validates internal consistency, not truth.

**Why it happens:** Models produce plausible-sounding outputs. A gap that "should" exist for a pizza restaurant (QR menu missing) will be confidently reported even if the enrichment failed to fetch the website.

**Consequences:** Sales pitches that mention specific problems the business does not have. Freelancers using those pitches get rejected immediately. Product credibility collapses.

**Prevention:**
- Treat enrichment failures as explicit `null` / `"unknown"` — never infer from absence
- Each pipeline stage must refuse to run if upstream required fields are `null` — partial pipeline > hallucinated pipeline
- QA stage (Stage 8) must compare AI output against raw enrichment fields, not just check internal consistency
- Store `observedFact` / `inference` / `opportunity` as separate fields (already in CLAUDE.md) — this creates an auditable chain

**Detection:** QA stage `confidence` score below 0.7 should block report display and flag for re-enrichment.

**Phase:** Phase 3 (Intelligence Pipeline). Design the null-propagation rule before writing any stage.

---

### Pitfall 2: Cost Explosion from Retry Loops (CRITICAL)

**What goes wrong:** A documented production incident burned $4,200 in 63 hours. An API format change caused 200x the baseline token rate in 40 minutes. In LoexAI's pipeline, if a Zod validation fails and the code automatically retries with a larger prompt context, token consumption grows O(n²). A single scan job with 50 businesses could trigger 400 LLM calls if retries are unbounded.

**Why it happens:** Developers add retry logic for resilience without per-job token budgets or circuit breakers.

**Consequences:** A single user running a large scan bankrupts the token budget for all users. No natural stopping point — the queue keeps refilling.

**Prevention:**
- Hard limit: max 2 retries per pipeline stage per business
- Per scan job: set a maximum total token budget at job creation time; abort if exceeded
- `ai_usage` table logging (already required in CLAUDE.md) must be checked mid-job, not just post-job
- Separate circuit breaker: if cost velocity exceeds $X per hour, pause all queued jobs and alert admin

**Detection:** `ai_usage` table — query for cost per `scan_job_id`. Alert if single job exceeds $2.

**Phase:** Phase 1 (set up `ai_usage` logging infrastructure) + Phase 3 (add budget enforcement before any AI call).

---

### Pitfall 3: Treating the QA Stage as Optional

**What goes wrong:** Teams build the QA stage last and treat it as a nice-to-have. It gets skipped under time pressure. The product then ships AI output that cites facts not in the enrichment data.

**Why it happens:** QA appears to add latency without adding features visible in the UI.

**Prevention:** QA stage is not optional — it is the last gate before the Business Report is marked `status = "analyzed"`. If `isValid: false`, the report is shown with a warning banner, not suppressed.

**Phase:** Phase 4 (AI Output). Design the QA schema before writing the sales strategy generator.

---

## Google Places API Gotchas

### Pitfall 1: 60-Result Hard Cap Per Query (CRITICAL)

**What goes wrong:** Google Places API returns a maximum of 60 results per search (3 pages × 20). A user scanning "restaurants" in Istanbul expects hundreds of results. They get 60. They assume the product is broken.

**Why it happens:** Most developers discover this limit only after launch when users complain.

**Consequences:** Users trying dense urban areas get incomplete lead lists. They churn.

**Prevention:**
- Subdivision strategy: split large radius searches into smaller geographic cells (grid or cluster approach)
- Expose result count honestly in the UI: "Found 60 leads (Google Places limit). Narrow your radius or category for more targeted results."
- Do not promise "unlimited leads" in marketing copy

**Detection:** If result count equals exactly 20, 40, or 60 — the cap was hit. Log this and surface it in the scan job status.

**Phase:** Phase 2 (Lead Discovery). Build the subdivision strategy before the first scan job.

---

### Pitfall 2: 30-Day Data Storage ToS Restriction

**What goes wrong:** Google Places ToS prohibits caching place data for more than 30 days. Storing `address`, `phone`, `place_id`, `rating`, `reviewCount` indefinitely violates terms. A policy violation can result in API key termination.

**Why it happens:** Developers store everything for convenience and never re-read the ToS.

**Consequences:** API key banned = product stops working immediately for all users.

**Prevention:**
- The `businesses` table stores `place_id` as the canonical identifier, not copied address/phone as the source of truth
- For display: fetch fresh data on demand for any field with compliance risk (phone, address, hours)
- Alternatively: consult Google Maps Platform ToS directly — the "Places Details" result has different retention rules than "Places Search" results. Cache only what is explicitly permitted.
- Document the retention policy in code comments, not just in documentation

**Phase:** Phase 2 (Lead Discovery). Establish data retention policy in the migration, not as a post-launch cleanup.

---

### Pitfall 3: Billing Shock from Field Masks

**What goes wrong:** Google Places API (New) bills per field requested, not per request. Requesting `photos`, `reviews`, `opening_hours` together can cost 3-5x more than requesting only `name`, `place_id`, `website`.

**Why it happens:** Tutorial code requests all fields. Developers copy it.

**Prevention:**
- Define a minimum field mask for discovery (just what is needed for the `BusinessLead` type)
- Fetch expensive fields (photos, hours) lazily — only when a user opens a specific business detail
- Set a billing alert at $10 and a hard quota cap on the Google Cloud console before any test with real data

**Phase:** Phase 2. Set billing caps before running the first real query.

---

## Supabase RLS Security Holes

### Pitfall 1: RLS Enabled but No Policies Written = Silently Empty Results

**What goes wrong:** A developer enables RLS on a table (`ALTER TABLE businesses ENABLE ROW LEVEL SECURITY`) but forgets to write a SELECT policy. Every query returns zero rows. No error is thrown — empty results are valid SQL. The developer assumes no data was inserted and starts debugging the wrong thing.

**Why it happens:** RLS default-deny behavior is correct by design but unintuitive. It silently denies rather than erroring.

**Prevention:**
- Every migration that creates a table must include RLS enable + at minimum a SELECT policy in the same migration file
- Integration tests must assert that a user can read their own data (not just that an insert succeeded)
- Add a health-check query on startup: `SELECT COUNT(*) FROM businesses WHERE user_id = current_user_id()` — if this returns 0 when data exists, RLS policy is missing

**Phase:** Phase 1 (Foundation). Write policies alongside migrations.

---

### Pitfall 2: Service Role Key Exposed via NEXT_PUBLIC_ Prefix

**What goes wrong:** A developer names an environment variable `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`. The `NEXT_PUBLIC_` prefix bakes it into the browser JavaScript bundle. Every user who opens DevTools has god-mode access — RLS is completely bypassed.

**Why it happens:** The developer needed the service role key for admin operations and the quickest fix was to make it available client-side.

**Consequences:** Total database compromise. Any user (or automated scanner) can read, modify, or delete every row in every table.

**Prevention:**
- Service role key NEVER has `NEXT_PUBLIC_` prefix — enforce with a pre-commit hook or CI check
- All admin operations go through a Route Handler or Server Action with `import "server-only"` at the top
- The anon key is the only Supabase key ever present in client-side code

**Phase:** Phase 1 (Foundation). Establish this rule before writing a single Route Handler.

---

### Pitfall 3: Views Bypass RLS by Default

**What goes wrong:** A developer creates a SQL view to simplify a complex join (e.g., `business_with_score` joining `businesses`, `opportunities`, `gap_analyses`). Views in Postgres run as the creator role by default — they bypass the RLS policies of the underlying tables. Any authenticated user can query the view and see other users' data.

**Why it happens:** RLS bypass via views is a Postgres-level behavior that Supabase does not warn about at creation time.

**Prevention:**
- All views must be created with `WITH (security_invoker = true)` (Postgres 15+, which Supabase uses)
- Prefer Supabase RPC functions over views for complex queries — easier to audit
- Add view RLS testing to the integration test suite

**Phase:** Phase 1-2. Any view created must immediately be audited for `security_invoker`.

---

### Pitfall 4: Missing Policies for INSERT/UPDATE/DELETE

**What goes wrong:** Teams test that users cannot read other users' data but forget that write policies are separate. An attacker cannot read your businesses table but can DELETE every row in it. Or an INSERT policy is missing and the frontend silently fails to save leads.

**Prevention:**
- Every table needs all four policies: SELECT, INSERT, UPDATE, DELETE
- Test suite must include: "User A cannot update User B's business", "User A cannot delete User B's scan job"

**Phase:** Phase 1. Write all four policy templates before any table goes into production.

---

## Credit System Mistakes

### Pitfall 1: Race Condition Allows Over-Consumption (CRITICAL)

**What goes wrong:** User has 1 credit. They click "Analyze" twice quickly. Both requests check `credits >= 1` simultaneously, both pass, both decrement — user ends up with -1 credits and two pipeline runs they didn't pay for.

**Why it happens:** Credit checks and decrements are two separate operations. Without a database-level lock, concurrent requests race.

**Prevention:**
- Use a Postgres atomic decrement with a conditional: `UPDATE users SET credits = credits - 1 WHERE id = $1 AND credits >= 1 RETURNING credits` — if no row returned, the decrement failed (insufficient credits)
- This single atomic operation replaces the check-then-decrement pattern entirely
- Never check credits in the frontend and skip the backend check

**Phase:** Phase 1 (set up the atomic decrement RPC). Use it from day one — retrofitting is painful.

---

### Pitfall 2: User Runs Out of Credits with No Warning

**What goes wrong:** A user with 5 credits starts a scan for 10 businesses. After 5 businesses are processed, the job stops silently. The user sees 5 analyzed businesses and 5 with no data. They don't know why. They assume the product is broken.

**Prevention:**
- Before enqueueing a scan job, calculate estimated credit cost: `estimated_cost = business_count * CREDITS_PER_BUSINESS`
- If `estimated_cost > current_credits`, show a warning: "This scan will cost 10 credits. You have 5. Reduce to 5 businesses or add credits."
- Mid-job: if credits run out, mark remaining businesses with `status = "credit_exhausted"` and surface a clear message
- Credit balance should be visible on the dashboard overview at all times, not buried in settings

**Phase:** Phase 2 (Lead Discovery, when scan jobs are first introduced).

---

### Pitfall 3: Crediting the Pipeline Atomically vs. Per-Stage

**What goes wrong:** Teams charge 1 credit for the full 8-stage pipeline. If Stage 5 fails, should the user be refunded? If teams refund on any failure, users abuse it by triggering failures. If teams never refund, users feel cheated when the AI output is incomplete.

**Prevention:**
- Charge 1 credit when the job is accepted (before Stage 1 runs) — this is the correct UX
- If a partial result is delivered (Stages 1-4 succeeded, 5-8 failed), mark the business with a clear status and do NOT charge again for a retry of the failed stages
- Implement stage-level checkpointing: store which stages completed so retries resume from the failure point, not from Stage 1

**Phase:** Phase 3 (Intelligence Pipeline). Design checkpointing before the queue is built.

---

## Website Analysis Failures

### Pitfall 1: Bot Detection Blocks Enrichment (CRITICAL)

**What goes wrong:** A significant portion of local business websites (those on Wix, Squarespace, or behind Cloudflare) will return 403 or serve a CAPTCHA page to server-side fetch requests. The enrichment layer detects "no website" when the website exists but blocked the crawler.

**Why it happens:** Headless HTTP requests have obvious signatures (missing headers, no JS execution, datacenter IPs).

**Consequences:** False gaps reported ("no website detected" → recommends building one → pitch is wrong).

**Prevention:**
- Use a proper User-Agent header mimicking a real browser
- Set realistic request timeouts (5-8 seconds, not 30)
- On non-200 response or connection error: store `websiteStatus = "fetch_failed"` not `hasWebsite = false`
- Distinguish: `hasWebsite: null` (not checked), `hasWebsite: true` (confirmed), `hasWebsite: false` (confirmed 404/no domain), `websiteStatus: "blocked"` (got 403/CAPTCHA)
- The AI reasoning layer must account for `websiteStatus: "blocked"` — do not generate gap analysis for unverified fields

**Phase:** Phase 3 (Enrichment). Design the status enum before writing the first fetch call.

---

### Pitfall 2: Slow Website Timeouts Kill Queue Performance

**What goes wrong:** Some local business websites are hosted on shared hosting with 15-30 second response times. With 50 businesses in a scan and a 30-second timeout per website, a single scan job takes 25 minutes. The queue backs up.

**Prevention:**
- Hard timeout: 8 seconds per website fetch
- If timeout: status = `"timeout"` — do not retry in the same job
- Run website fetches in parallel (Promise.allSettled, not sequential await)
- Process enrichment in batches of 5-10 concurrently

**Phase:** Phase 3.

---

### Pitfall 3: International Encoding and Multi-Language Business Names

**What goes wrong:** Local businesses in Turkey, Spain, Germany, etc., have names with non-ASCII characters. Stored incorrectly, they display as mojibake (`Köfteci Yusuf` → `K�fteci Yusuf`). Website URLs with international characters fail when passed to URL parsers without normalization.

**Prevention:**
- Enforce UTF-8 throughout: database (`TEXT` columns with UTF-8 collation), API responses (`Content-Type: application/json; charset=utf-8`), URL normalization with `URL` constructor or `encodeURI`
- Test with Turkish, Greek, and Arabic business names before shipping Phase 2

**Phase:** Phase 2.

---

### Pitfall 4: PageSpeed API Quota and Latency

**What goes wrong:** If PageSpeed Insights API is used to measure mobile performance, it is slow (5-15 seconds per request) and has its own quota limits. Including it synchronously in the enrichment step makes every scan job dramatically slower.

**Prevention:**
- PageSpeed data is "nice to have" enrichment — run it as a separate async step after the main enrichment completes
- Cache PageSpeed results aggressively (score changes rarely) — 7-day TTL in Redis

**Phase:** Phase 3.

---

## OpenRouter Free Model Production Risks

### Pitfall 1: 50 Requests Per Day Without Purchased Credits (CRITICAL)

**What goes wrong:** The default OpenRouter free tier allows only 50 API requests per day. A single LoexAI scan of 10 businesses through all 8 pipeline stages = up to 80 AI calls (some stages run per-field). One scan job can exhaust the entire daily free quota. In development with multiple developers, the quota is gone by 9am.

**Why it happens:** Developers treat "free tier" as "unlimited for testing."

**Consequences:** All AI calls fail with 429 errors. Zod validation fails because the response is an error object, not JSON. The pipeline partially completes and corrupts the pipeline state.

**Prevention:**
- Purchase at least $10 of OpenRouter credits in dev — this raises the limit to 1,000 requests/day
- The `AIProvider` abstraction (required by CLAUDE.md) must handle 429 responses with exponential backoff, not immediate retry
- In test environments: mock the AI provider entirely — do not hit real APIs in unit/integration tests

**Phase:** Phase 3. Set up the mock provider before writing any pipeline test.

---

### Pitfall 2: Free Models Deprecate Without Warning

**What goes wrong:** A free model available today (e.g., `google/gemma-3-27b-it:free`) may be removed from OpenRouter's free tier next month with no advance notice. If the model ID is hardcoded anywhere outside the provider abstraction, the entire pipeline breaks.

**Why it happens:** Developers hardcode model IDs "temporarily."

**Prevention:**
- Model selection is exclusively in `lib/ai/` — zero model IDs appear in pipeline stage files
- Config-driven: `OPENROUTER_FREE_MODEL=google/gemma-3-27b-it:free` in env — change one env var to swap models
- Fallback chain: if primary model returns 404/410, the provider tries the secondary model before throwing

**Phase:** Phase 1. Establish the provider abstraction before writing a single AI call.

---

### Pitfall 3: Free Models Produce Invalid JSON More Often Than Paid Models

**What goes wrong:** OpenRouter's Response Healing fixes JSON syntax errors (trailing commas, missing brackets) but does NOT fix schema violations (wrong field names, missing required properties, wrong types). A free model might return `{ "score": "high" }` when the Zod schema expects `{ "score": 85 }`. Zod throws. The pipeline stage fails. If the retry uses the same prompt, it fails again.

**Why it happens:** Smaller free models have weaker instruction-following for complex JSON schemas.

**Prevention:**
- Keep AI prompt JSON schemas as simple as possible — fewer fields, simpler types
- For structured output, use OpenRouter's native `response_format: { type: "json_schema" }` parameter when the model supports it
- Zod validation failure must log the raw response for debugging, not silently swallow it
- On schema validation failure: retry once with an explicit "fix this JSON" correction prompt; if still fails, store `null` for that stage and continue

**Phase:** Phase 3. Test every Zod schema against a free model before shipping.

---

### Pitfall 4: Free Model Tone and Quality Inconsistency

**What goes wrong:** The sales pitch generated in development (with a capable free model) is professional and compelling. In production (different free model due to deprecation), it sounds generic and robotic. Users don't complain about JSON errors — they just stop using the product.

**Prevention:**
- Evaluate output quality with a fixed set of test businesses before switching models
- The `AIProvider` abstraction must expose `model_id` in the `ai_usage` log — so you can correlate model version to output quality
- Do not rely on subjective "feels good" testing — create a scoring rubric for sales pitch quality and run it against each candidate model

**Phase:** Phase 4 (AI Output). Quality gate before shipping to any user.

---

## Next.js 15 + Supabase SSR Issues

### Pitfall 1: Using `@supabase/auth-helpers` (Deprecated)

**What goes wrong:** Tutorials from 2023-2024 use `@supabase/auth-helpers-nextjs`. This package is deprecated. New projects using it get no bug fixes, compatibility breaks with Next.js 15 server actions, and confusing behavior around cookie handling.

**Prevention:**
- Use `@supabase/ssr` exclusively — it is the current official package
- Create two Supabase clients: one for Server Components/Actions/Route Handlers, one for Client Components
- The middleware pattern from `@supabase/ssr` docs is required for session refresh — without it, sessions expire mid-session without redirect

**Phase:** Phase 1. Use the correct package from project initialization.

---

### Pitfall 2: Middleware Not Refreshing Sessions = Silent Auth Failures

**What goes wrong:** A user's JWT expires while they are working in the dashboard. Without a middleware that refreshes the session token on every request, the next server-side data fetch returns null (RLS denies because the token is expired). The UI shows empty data with no error message. The user thinks data was lost.

**Why it happens:** Developers skip the middleware setup because the app "works" during short test sessions.

**Prevention:**
- Implement the `@supabase/ssr` middleware from day one: it refreshes the auth token on every request and sets fresh cookies
- The middleware must match all routes that require auth — use a matcher that explicitly excludes only public routes
- Test with a short JWT expiry in development to catch this early

**Phase:** Phase 1.

---

### Pitfall 3: Hydration Mismatch from Auth State

**What goes wrong:** A Server Component renders the dashboard assuming the user is authenticated (based on server-side session). A Client Component reads auth state from a client-side store that initializes as `null` before the first `onAuthStateChange` fires. The server renders "Welcome, Ahmet" and the client renders "Welcome, ..." — React throws a hydration error.

**Prevention:**
- Do not read user state in Client Components during the initial render — pass it as a prop from the Server Component, or use a loading state
- For auth-dependent UI: render a skeleton on the server and hydrate the client state without mismatch
- `use client` components that need auth should use `useEffect` + `useState` for user data, not direct reads from global auth state during render

**Phase:** Phase 1-2.

---

### Pitfall 4: Server Actions and RLS — Missing User Context

**What goes wrong:** A Server Action creates a Supabase client using the service role key "for convenience" because the developer couldn't figure out how to pass the session context. This bypasses RLS. Every user's data is now accessible from that action.

**Prevention:**
- Server Actions must use the SSR client (cookie-based), not the service role client, for user-scoped operations
- The service role client is used ONLY for admin operations in `/app/admin/` routes
- Enforce this with a lint rule or file-level comment in `lib/supabase/`

**Phase:** Phase 1.

---

## SaaS Onboarding Drop-Off Points

### Pitfall 1: No "Aha! Moment" in the First Session (CRITICAL)

**What goes wrong:** Up to 75% of users abandon in the first week. 62.5% drop off before activation. For LoexAI, the "aha moment" is seeing a real business's opportunity score and sales pitch. If users must: (1) register, (2) verify email, (3) read documentation, (4) configure settings, (5) run a scan, (6) wait for results — the gap between signup and value is too large.

**Prevention:**
- The first screen after registration must be the scan form — not a dashboard with empty state
- Pre-populate the scan form with a realistic example (city: "Istanbul", category: "kafe", radius: "1km")
- Show estimated time to results: "Analysis takes 2-3 minutes"
- Users who experience value within 5-15 minutes are 3x more likely to retain

**Phase:** Phase 2 (Lead Discovery, when the scan flow first exists). UX must be designed before building — not bolted on after.

---

### Pitfall 2: Empty State Kills New Users

**What goes wrong:** A new user who hasn't run a scan sees an empty dashboard with no guidance. They don't know what to do. They close the tab.

**Prevention:**
- Empty dashboard state must show: a prominent "Run your first scan" CTA, a short description of what they'll get, a sample/demo report to set expectations
- The demo report is a fixed dataset — not a real API call — showing exactly what the product produces

**Phase:** Phase 2.

---

### Pitfall 3: Scan Results Take Too Long Without Feedback

**What goes wrong:** A scan job for 20 businesses takes 3-5 minutes. If the UI shows nothing but a spinner, users assume it broke and refresh the page — which may interrupt the job.

**Prevention:**
- Real-time progress: show which stage each business is in (e.g., "Enriching website data... 8/20")
- Use Supabase Realtime subscriptions on `scan_jobs` and `businesses` table — push progress updates to the UI without polling
- If the user navigates away, the job continues in the background; they see progress when they return

**Phase:** Phase 2.

---

### Pitfall 4: Free Credits Exhausted Before User Understands the Product

**What goes wrong:** The default is 20 credits. One full scan of 20 businesses = 20 credits. A new user runs one scan, sees results they don't fully understand, and their credits are gone. They hit a paywall before they've felt value.

**Prevention:**
- Structure the credit system so users can see a sample analysis on 1-2 businesses for free before the full scan
- Show a "preview" of the Business Report for free, with full details requiring credits
- First-run experience: guide the user through one business analysis step by step so they understand what each section means

**Phase:** Phase 2-5 (credit UX in Phase 2; Stripe paywall in Phase 5).

---

## Priority Risk Matrix

| Risk | Likelihood | Impact | Phase to Address |
|------|------------|--------|------------------|
| Hallucination accumulation across pipeline stages | HIGH | CRITICAL — wrong pitches lose users immediately | Phase 3: build null-propagation rule before any AI stage |
| Cost explosion from retry loops | MEDIUM | CRITICAL — can bankrupt token budget overnight | Phase 1: set up `ai_usage` table; Phase 3: add budget circuit breaker |
| Google Places 60-result cap disappoints users | HIGH | HIGH — core product promise undermined | Phase 2: geographic subdivision + honest UI messaging |
| Race condition in credit decrement | MEDIUM | HIGH — financial loss + abuse vector | Phase 1: implement atomic decrement RPC |
| Service role key leaked via NEXT_PUBLIC_ | LOW | CRITICAL — total database compromise | Phase 1: pre-commit hook, server-only import |
| Bot detection blocks website enrichment | HIGH | HIGH — false "no website" gaps corrupt all downstream AI | Phase 3: status enum, never infer from fetch failure |
| OpenRouter free tier 50 req/day exhaustion | HIGH | MEDIUM — blocks all development | Phase 3: purchase dev credits, mock AI in tests |
| RLS enabled but no policies (silent empty results) | MEDIUM | HIGH — appears as data loss bug, wastes hours of debugging | Phase 1: policy-per-migration rule |
| Google Places 30-day ToS data retention | MEDIUM | CRITICAL — API key banned = product offline | Phase 2: data retention audit in migration |
| Session refresh middleware missing | MEDIUM | MEDIUM — silent auth failures mid-session | Phase 1: implement middleware from day one |
| No aha moment in first session | HIGH | HIGH — 75% week-1 abandonment | Phase 2: UX design before scan form implementation |
| Scan job progress not visible (user refreshes) | HIGH | MEDIUM — job interruption, wasted credits | Phase 2: Supabase Realtime progress updates |
| Views bypass RLS | LOW | HIGH — cross-user data leak | Phase 1-2: `security_invoker = true` on all views |
| Free model JSON schema violations | MEDIUM | MEDIUM — pipeline stage failures | Phase 3: test every Zod schema against free model |
| Free credits exhausted before aha moment | HIGH | HIGH — paywall before value = churn | Phase 2 (credit UX), Phase 5 (pricing design) |
| Idempotency violation: same business analyzed twice | MEDIUM | MEDIUM — wasted credits, duplicate data | Phase 2: unique constraint on `(user_id, place_id)` |

---

## Sources

- [VeriTrail: Detecting hallucination in multi-step AI workflows — Microsoft Research](https://www.microsoft.com/en-us/research/blog/veritrail-detecting-hallucination-and-tracing-provenance-in-multi-step-ai-workflows/)
- [Multi-Agent AI Gone Wrong: Coordination Failure — Galileo](https://galileo.ai/blog/multi-agent-coordination-failure-mitigation)
- [The Agent That Burned $4,200 in 63 Hours — Medium](https://medium.com/@sattyamjain96/the-agent-that-burned-4-200-in-63-hours-a-production-ai-postmortem-d38fd9586a85)
- [Google Places API limits — Apify Blog](https://blog.apify.com/google-places-api-limits/)
- [Google Places API Usage and Billing — Google Developers](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- [Considerations for Using Google Places API — dataplor](https://www.dataplor.com/resources/blog/why-google-places-api-may-not-be-right-for-your-business/)
- [Supabase Security Flaw: 170+ Apps Exposed by Missing RLS — byteiota](https://byteiota.com/supabase-security-flaw-170-apps-exposed-by-missing-rls/)
- [Supabase RLS Best Practices — makerkit.dev](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [API Key Exposure in Supabase Apps — vibeappscanner](https://vibeappscanner.com/vulnerability-in/api-key-exposure-supabase-apps)
- [OpenRouter Free Models — lilting.ch](https://lilting.ch/en/articles/openrouter-free-models)
- [OpenRouter Response Healing Announcement](https://openrouter.ai/announcements/response-healing-reduce-json-defects-by-80percent)
- [OpenRouter API Rate Limits Docs](https://openrouter.ai/docs/api/reference/limits)
- [Creating a Supabase Client for SSR — Supabase Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Next.js Hydration Errors 2026 — Medium](https://medium.com/@blogs-world/next-js-hydration-errors-in-2026-the-real-causes-fixes-and-prevention-checklist-4a8304d53702)
- [Stop the Churn: 5 AI SaaS Onboarding Mistakes — SaaS Factor](https://www.saasfactor.co/blogs/stop-the-churn-avoid-these-5-ai-saas-onboarding-mistakes-that-drive-users-away)
- [Rate Limiting AI Agents — TrueFoundry](https://www.truefoundry.com/blog/rate-limiting-ai-agents-preventing-llm-api-exhaustion)
- [Stop Getting Blocked: Web Scraping Mistakes — Firecrawl](https://www.firecrawl.dev/blog/web-scraping-mistakes-and-fixes)
- [Idempotency in Data Pipelines — Airbyte](https://airbyte.com/data-engineering-resources/idempotency-in-data-pipelines)
