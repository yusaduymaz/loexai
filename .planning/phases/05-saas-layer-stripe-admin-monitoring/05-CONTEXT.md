# Phase 5: SaaS Layer — Stripe, Admin, Monitoring - Context

**Gathered:** 2026-05-26
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the core Monetization (SaaS) layer for LoexAI. This includes Stripe billing integration (subscriptions and credit purchases), signature-verified webhook ingestion, credit synchronizations, database event tracking, and pricing/billing UI wiring.

It does NOT cover team sharing, advanced CRM features, or automatic outbound mailing (which are deferred to v2/backlog).

</domain>

<decisions>
## Implementation Decisions

### Pricing & Plan Structure
- **D-01 (Hybrid Model):** Users subscribe to monthly plans (Pro: $49/mo for 500 credits, Agency: $199/mo) which reset to the plan's quota at the start of each billing cycle. If they run out of credits mid-month, they can purchase one-time "top-up" credit packs (e.g. 50 credits for $10).
- **D-02 (Credit Consumption Order):** Monthly subscription credits are consumed first. One-time top-up credits are consumed second and do not expire.

### Checkout Integration Style
- **D-03 (Stripe Checkout Redirect):** Payment flows are handled by redirecting the user to Stripe Checkout sessions generated on the server.
- **D-04 (Stripe Customer Portal):** Users manage active subscriptions, download invoices, and update billing methods through the official Stripe-hosted Customer Portal rather than native UI pages.

### Webhook Processing & Credit Sync
- **D-05 (Idempotent Webhook Events):** Create a `stripe_webhook_events` table in Supabase. Every incoming event is logged and signature-verified. Event IDs are checked with `ON CONFLICT DO NOTHING` to prevent duplicate processing on retries.
- **D-06 (Atomic Credit Updates):** Perform user credit updates inside a database transaction concurrently with marking the webhook event as processed.

### The Agent's Discretion
- **D-07:** The specific pricing/conversion ratios for credit packs (e.g. exact pricing tiers for top-ups) and the visual styling of the upgrade checkout links are left to the agent's discretion.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Configuration & Backlog
- `.planning/ROADMAP.md` §Phase 5 — [Goal and success criteria of SaaS Layer]
- `.planning/STATE.md` — [Completed phases and monetization scope references]
- `.planning/prioritized-backlog.md` §P7 — [Monetization item requirements]

### Stripe Environment Config
- `.env.example` — [Stripe environment variable specifications: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET]

### Pricing Tiers
- `src/components/landing/Pricing.tsx` — [Starter, Pro, and Agency plan definitions]

### Credit Display
- `src/components/dashboard/CreditBadge.tsx` — [CreditBadge logic, threshold levels, and upgrade link placements]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/dashboard/CreditBadge.tsx`: Displays credit balances with visual thresholds (amber <= 5, red = 0) and includes placeholder upgrade links.
- `src/lib/config/server.ts`: Standardized config loaders for server-side environments; should be extended to support Stripe variables securely.

### Established Patterns
- **Next.js Route Groups:** Separation of dashboard, admin, and marketing layers via `(dashboard)`, `(admin)`, and `(marketing)` layout route groups.
- **Signature Verification:** The Upstash Workflow handler at `src/app/api/workflow/pipeline/route.ts` verifies signatures. Stripe webhook handlers should implement a similar cryptographic signature check.

### Integration Points
- `src/app/api/webhooks/stripe/route.ts`: Webhook event listener target.
- `src/app/api/checkout/stripe/route.ts`: Checkout session initialization server route or action.
- `src/components/dashboard/CreditBadge.tsx`: Route the "Upgrade plan →" link to redirect users to Stripe Checkout or billing portals.

</code_context>

<specifics>
## Specific Ideas

No specific design requirements — standard Stripe Checkout and Customer Portal integration layouts are preferred.

</specifics>

<deferred>
## Deferred Ideas

- **Team/Multi-seat billing:** Deferred to v2 (Agency seats management).
- **White-label export options:** Deferred to v2.

</deferred>

---

*Phase: 05-SaaS Layer — Stripe, Admin, Monitoring*
*Context gathered: 2026-05-26*
