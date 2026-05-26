# Phase 5: SaaS Layer — Stripe, Admin, Monitoring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-26
**Phase:** 05-SaaS Layer — Stripe, Admin, Monitoring
**Areas discussed:** Pricing & Plan Structure, Checkout Integration Style, Webhook Processing & Credit Sync

---

## Pricing & Plan Structure

| Option | Description | Selected |
|--------|-------------|----------|
| Subscription Only | Monthly tiers (Pro/Agency) where credits reset every month (no top-ups, no rollover). | |
| Pay-As-You-Go Only | Purchase one-time credit packs directly (no monthly subscriptions). | |
| Hybrid Model | Monthly subscriptions (with monthly reset) + one-time credit top-up packs. | ✓ |

**User's choice:** Hybrid Model
**Notes:** Subscription monthly quota resets each month; top-up credit packs never expire and are consumed after monthly subscription credits.

---

## Checkout Integration Style

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe Checkout Redirect | Redirect the user to a secure, Stripe-hosted checkout page. Subscription cancellation/card updates are managed via a link to the out-of-the-box Stripe Customer Portal. | ✓ |
| Embedded Stripe Elements | Payment forms are embedded directly within our Next.js pages. Keeps user on-site but requires custom front-end development, custom error handling, and billing history UI. | |

**User's choice:** Stripe Checkout Redirect & Customer Portal
**Notes:** Chosen for ease of implementation, security, and low maintenance overhead.

---

## Webhook Processing & Credit Sync

| Option | Description | Selected |
|--------|-------------|----------|
| Idempotent Event Log Table | Create a tracking table to prevent duplicate webhook processing. Webhook event is logged and signature-verified. Event IDs are checked with `ON CONFLICT DO NOTHING`. | ✓ |
| Direct Database Update | Perform updates directly on the user record without log verification. Slightly less code, but risks double-crediting users if Stripe retries a webhook event. | |

**User's choice:** Idempotent Event Log Table
**Notes:** Critical for guaranteeing database integrity and avoiding duplicate credit assignments on retried webhooks.

---

## The Agent's Discretion
- Specific credit pack pricing, conversion ratios, and upgrade link UX details are left to the agent's discretion during implementation.

## Deferred Ideas
- Multi-seat / team seat subscription billing (deferred to v2).
- White-label invoice and report branding (deferred to v2).
