---
phase: 05-saas-layer-stripe-admin-monitoring
plan: 5B
type: execute
wave: 2
depends_on:
  - 05-5A
files_modified:
  - src/components/dashboard/CreditBadge.tsx
  - src/app/(marketing)/pricing/page.tsx
  - src/app/(dashboard)/dashboard/settings/billing/page.tsx
  - src/app/api/portal/stripe/route.ts
autonomous: false
requirements:
  - MON-04 # upgrade UX

must_haves:
  truths:
    - "User can view active subscription tier and billing info in `/dashboard/settings/billing`"
    - "Clicking upgrade options on /pricing redirects logged-in users to Stripe Checkout"
    - "Clicking Manage Billing redirects users to Stripe Customer Portal"
    - "CreditBadge link redirects zero-credit users to Upgrade options"
  artifacts:
    - path: "src/app/(dashboard)/dashboard/settings/billing/page.tsx"
      provides: "Billing summary settings tab"
    - path: "src/app/api/portal/stripe/route.ts"
      provides: "POST customer portal redirect URL"
---

<objective>
Implements the user-facing billing and checkout UI, including price list integrations on the pricing page, billing summary layout, customer portal redirects, and the final manual validation playbook.

Purpose: Deliver the complete end-to-end payment and upgrade experience.
Output: Billing dashboard page, Customer Portal API, pricing redirection updates.
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
@.planning/phases/05-saas-layer-stripe-admin-monitoring/05-5A-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement Customer Portal Redirect API & Settings Billing page</name>
  <files>src/app/api/portal/stripe/route.ts, src/app/(dashboard)/dashboard/settings/billing/page.tsx</files>
  <action>
    1. Implement Route Handler `POST /api/portal/stripe`:
       - Authenticate session using Clerk (`getCurrentUser()`).
       - Retrieve the Stripe customer ID mapped to the user (e.g. from `users.stripe_customer_id` database field).
       - Create a Stripe Billing Portal session using `stripe.billingPortal.sessions.create` with return URL pointing back to `/dashboard/settings/billing`.
       - Return the generated redirect portal URL.
    2. Create `src/app/(dashboard)/dashboard/settings/billing/page.tsx` displaying:
       - User's current subscription tier (Starter, Pro, or Agency).
       - User's credit balance (D-02: showing monthly vs top-up balance breakdown if tracked, or total).
       - A "Manage Billing & Invoices" button calling the portal redirect API.
       - A list of one-time credit top-up pack options (e.g. "Buy 50 credits for $10") linking directly to the Checkout Redirect API from 5A.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>Stripe Customer Portal redirect endpoint compiles, and the dashboard billing settings tab renders plan summaries and checkout links.</done>
</task>

<task type="auto">
  <name>Task 2: Wire Pricing tiers & CreditBadge upgrade hooks</name>
  <files>src/app/(marketing)/pricing/page.tsx, src/components/dashboard/CreditBadge.tsx</files>
  <action>
    1. Update the `/pricing` page and `Pricing.tsx` component:
       - If the user is logged in, replace "Coming Q1" / "Locked" buttons for Pro/Agency with active "Subscribe Now" actions.
       - The button triggers a POST request to `/api/checkout/stripe` with the corresponding price ID, and redirects the browser to the returned Stripe Checkout URL.
    2. Update `src/components/dashboard/CreditBadge.tsx` (full variant):
       - Enable the "Need more? Upgrade" link (currently cursor-not-allowed) to direct the user to `/dashboard/settings/billing` or the `/pricing` page to let them purchase top-ups or plans.
  </action>
  <verify>
    <automated>npx tsc --noEmit && npm run build</automated>
  </verify>
  <done>pricing buttons dynamically redirect logged-in accounts to checkout flows, and credit badges wire active links on low balance states.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>End-to-end Stripe Checkout redirection, Customer Portal redirection, and Webhook processing loops.</what-built>
  <how-to-verify>
    1. Open `http://localhost:3000/dashboard` with a test user account.
    2. Click on the CreditBadge upgrade link (or visit `/dashboard/settings/billing` directly).
    3. Click on a credit top-up pack (or subscription package). Confirm redirect to `checkout.stripe.com`.
    4. Fill card info with Stripe test cards, complete checkout.
    5. Start Stripe CLI webhook listener: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`.
    6. Confirm webhook processes, inserting into `stripe_webhook_events` and adding credits atomically to the database.
    7. Return to the dashboard and confirm the CreditBadge balance updates immediately.
    8. Click on "Manage Billing & Invoices" and confirm redirect to Stripe Customer Portal.
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Client -> Portal Route | Clerk auth session is validated before Stripe Portal Session creation |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-05-04 | Information Disclosure | Customer Portal | mitigate | Gated by Server side Clerk check, prevents loading billing info of other customers |
| T-05-SC | Tampering | npm installs | mitigate | slopcheck checks package legitimacy before execution |
</threat_model>

<verification>
Verify build success and lint checks:
- `npx tsc --noEmit` returns 0 errors.
- `npm run build` succeeds.
</verification>

<success_criteria>
- Pricing tiers dynamically bind checkout redirection hooks.
- Stripe Portal Session redirects successfully open billing profiles.
- End-to-end payment and webhook loops pass manual human-verify.
</success_criteria>

<output>
Create `.planning/phases/05-saas-layer-stripe-admin-monitoring/05-5B-SUMMARY.md` when done
</output>
