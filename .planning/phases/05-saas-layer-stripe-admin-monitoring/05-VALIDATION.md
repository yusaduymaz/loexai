---
phase: 05
slug: saas-layer-stripe-admin-monitoring
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-26
---

# Phase 05 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | manual-playbook / Stripe CLI |
| **Config file** | none |
| **Quick run command** | `stripe trigger checkout.session.completed` |
| **Full suite command** | `stripe trigger checkout.session.completed` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run manual validation playbook
- **After every plan wave:** Verify webhook ingestion via Stripe CLI
- **Before `/gsd-verify-work`:** Webhook and redirection verified in development env
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 05A | 1 | MON-01 | — | Create Checkout Redirect Url | manual | Click upgrade button | — | ⬜ pending |
| 05-01-02 | 05A | 1 | MON-02 | T-05-01 | Signature verification check | manual | `stripe trigger ...` | — | ⬜ pending |
| 05-01-03 | 05A | 1 | MON-03 | T-05-01 | Idempotent event check | manual | Resend identical event | — | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing manual framework is ready.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe Checkout Redirect | MON-01 | Requires UI redirect and sandbox checkout | 1. Click "Upgrade Plan" in `/dashboard` (or from CreditBadge)<br>2. Confirm redirect to `checkout.stripe.com`<br>3. Pay with Stripe test card<br>4. Confirm return redirection to `/dashboard?session_id=...` |
| Stripe Webhook Ingestion | MON-02 | Triggered by Stripe's asynchronous events | 1. Configure Stripe CLI: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`<br>2. Trigger checkout session: `stripe trigger checkout.session.completed`<br>3. Verify terminal output logs 200 OK signature validation. |
| Webhook Idempotency Check | MON-03 | Requires sending identical event ID twice | 1. Send checkout webhook event via Stripe CLI<br>2. Confirm credits update in Supabase `public.users` table<br>3. Send same webhook payload with same event ID again<br>4. Confirm DB unique constraint catches it and returns 200 OK with no duplicate credit assignment. |

---

## Validation Sign-Off

- [x] All tasks have manual verify or Wave 0 dependencies
- [x] Sampling continuity: verified after tasks
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
