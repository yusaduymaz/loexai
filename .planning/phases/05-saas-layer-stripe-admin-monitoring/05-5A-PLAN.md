---
phase: 05-saas-layer-stripe-admin-monitoring
plan: 5A
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/config/server.ts
  - src/lib/payments/stripe.ts
  - src/app/api/checkout/stripe/route.ts
  - src/app/api/webhooks/stripe/route.ts
autonomous: true
requirements:
  - MON-01 # Stripe products/prices
  - MON-02 # webhook ingestion
  - MON-03 # plan/credit sync
user_setup:
  - service: stripe
    why: "Payment processing & webhooks"
    env_vars:
      - name: STRIPE_SECRET_KEY
        source: "Stripe Dashboard -> Developers -> API keys"
      - name: STRIPE_WEBHOOK_SECRET
        source: "Stripe Dashboard -> Developers -> Webhooks (after registering listener)"
    dashboard_config:
      - task: "Create webhook endpoint pointing to /api/webhooks/stripe"
        location: "Stripe Dashboard -> Developers -> Webhooks"

must_haves:
  truths:
    - "Server Action/API creates a Checkout redirect URL when requested"
    - "Webhook endpoint cryptographically verifies Stripe signatures"
    - "Duplicated webhook events are safely ignored without double-crediting"
  artifacts:
    - path: "src/lib/payments/stripe.ts"
      provides: "Stripe client wrapper"
    - path: "src/app/api/checkout/stripe/route.ts"
      provides: "POST checkout session creation"
    - path: "src/app/api/webhooks/stripe/route.ts"
      provides: "POST webhook signature check & event handler"
  key_links:
    - from: "src/app/api/webhooks/stripe/route.ts"
      to: "stripe_webhook_events"
      via: "deduplication insert"
      pattern: "stripe_webhook_events"
---

<objective>
Sets up the Stripe backend infrastructure, including standard stack initialization, database migrations for the idempotent webhook event log, checkout redirects, and signature-verified webhook endpoints.

Purpose: Solve asynchronous payment notifications safely before building payment UIs.
Output: Supabase migrations, Stripe factory client, checkout route, webhook route.
</objective>

<execution_context>
@~/.gemini/antigravity/get-shit-done/workflows/execute-plan.md
@~/.gemini/antigravity/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/05-saas-layer-stripe-admin-monitoring/05-CONTEXT.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add stripe_webhook_events database migration and credit update rpc</name>
  <files>supabase/migrations/20260526140000_stripe_webhook_events.sql</files>
  <action>
    Create a new Supabase migration creating:
    1. `stripe_webhook_events` table:
       - `id` text PRIMARY KEY (corresponds to stripe event id `evt_xxx`)
       - `type` text not null
       - `processed` boolean default false not null
       - `created_at` timestamp with time zone default timezone('utc'::text, now()) not null
    2. Enable Row Level Security (RLS) on `stripe_webhook_events`, allowing only `service_role` full access (SELECT, INSERT, UPDATE).
    3. PostgreSQL function `handle_stripe_event(p_event_id text, p_event_type text, p_data jsonb)` with SECURITY DEFINER:
       - Update user credits atomically based on incoming metadata (e.g. `clerk_user_id` and top-up quantity).
       - Mark the webhook event as processed (`processed = true`).
       - Ensure concurrency safety and atomicity within the function.
  </action>
  <verify>
    <automated>npx supabase db push</automated>
  </verify>
  <done>Database table and functions are successfully created and pushed to the local Supabase instance.</done>
</task>

<schema_push_requirement>
**[BLOCKING] Schema Push Required**

This phase modifies schema-relevant files (migrations). The planner MUST include
a `[BLOCKING]` task that runs the database schema push command AFTER all schema file
modifications are complete but BEFORE verification.

- ORM detected: Supabase
- Push command: npx supabase db push
- Non-TTY workaround: Set SUPABASE_ACCESS_TOKEN env var
- If push requires interactive prompts that cannot be suppressed, flag the task for
  manual intervention with `autonomous: false`

This task is mandatory — the phase CANNOT pass verification without it. Build and
type checks will pass without the push (types come from config, not the live database),
creating a false-positive verification state.
</schema_push_requirement>

<task type="auto">
  <name>Task 2: Initialize Stripe client & Checkout session API route</name>
  <files>src/lib/config/server.ts, src/lib/payments/stripe.ts, src/app/api/checkout/stripe/route.ts</files>
  <action>
    1. Update `src/lib/config/server.ts` to include `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` in the configuration schema loaders.
    2. Create `src/lib/payments/stripe.ts` (with "server-only" import) initializing the Stripe SDK using the private secret key and pinned apiVersion.
    3. Implement `src/app/api/checkout/stripe/route.ts` as a POST handler. It must:
       - Authenticate the request via Clerk user context (`getCurrentUser()`).
       - Parse request payload containing the chosen Stripe `priceId` and transaction `mode` ('subscription' or 'payment').
       - Create a Stripe Checkout Session, attaching the `clerk_user_id` inside `metadata`.
       - Return the generated Stripe Checkout URL.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>Stripe configuration is validated on server startup, client factory is initialized, and checkout API route returns session redirect URLs.</done>
</task>

<task type="auto">
  <name>Task 3: Implement signature-verified, idempotent Webhook route</name>
  <files>src/app/api/webhooks/stripe/route.ts</files>
  <action>
    Implement `src/app/api/webhooks/stripe/route.ts` as a POST route.
    1. Read the raw request body payload.
    2. Extract the `stripe-signature` header.
    3. Verify the payload cryptographically using `stripe.webhooks.constructEvent()` and the environment's `STRIPE_WEBHOOK_SECRET`.
    4. Call the idempotent handler logic (D-05):
       - Insert the event ID into `stripe_webhook_events` (`ON CONFLICT DO NOTHING`).
       - If it already exists, return `200 OK` immediately.
       - If it's new, execute `handle_stripe_event` RPC function, incrementing credits (D-01) or updating subscription status.
    5. Handle events:
       - `checkout.session.completed` for payment/credits setup.
       - `invoice.payment_succeeded` for subscriptions.
    6. Return `200 OK` response to Stripe.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>Webhook endpoint verifies payloads cryptographically, filters duplicate events via the log database table, and triggers user credit updates.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Stripe -> Webhook Route | Cryptographic boundary: incoming payload verified using stripe-signature and local webhook secret key |
| Client -> Checkout Route | Authenticated Clerk session is verified before Stripe Checkout Session creation |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-01 | Spoofing | Webhook API Handler | mitigate | Cryptographically verify headers with stripe.webhooks.constructEvent |
| T-05-02 | Tampering | Webhook Deduplication | mitigate | DB unique constraint on stripe_webhook_events table blocks duplicate processing |
| T-05-03 | Elevation of Privilege | Checkout Session | mitigate | Map Clerk UID directly in server-side metadata, never trust client-passed UID |
| T-05-SC | Tampering | npm installs | mitigate | slopcheck checks package legitimacy before execution |
</threat_model>

<verification>
Verify build success and migration execution:
- `npx supabase db push` successfully syncs tables.
- `npx tsc --noEmit` returns 0 errors.
- `npm run build` succeeds.
</verification>

<success_criteria>
- Supabase migrations successfully deploy.
- Stripe API route resolves Checkout Redirect URLs.
- Stripe signature verification successfully gates the webhook route.
- Idempotency is enforced by the event log database constraints.
</success_criteria>

<output>
Create `.planning/phases/05-saas-layer-stripe-admin-monitoring/05-5A-SUMMARY.md` when done
</output>
