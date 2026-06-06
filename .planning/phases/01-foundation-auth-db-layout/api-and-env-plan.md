# LoexAI API And Environment Plan

## Objective

Provision the external service surface LoexAI actually needs, in the order that supports the architecture in `CLAUDE.md`.

## Service Inventory

## Core Platform APIs

### Supabase

- Role: database, auth, storage, RLS, optional edge functions
- Status: already integrated
- Must provision:
  - project URL
  - publishable key
  - service role key
  - local/dev migration workflow
  - admin bootstrap runbook

### Vercel

- Role: app hosting, preview environments, logs
- Status: deployment target defined, not fully wired
- Must provision:
  - project link
  - preview/prod env separation
  - log access

### Upstash Redis

- Role: cache, idempotency, rate limiting
- Status: wrapper exists, not fully activated
- Must provision:
  - Redis REST URL
  - Redis REST token

### Upstash QStash / Workflow

- Role: async orchestration
- Status: placeholder route exists
- Must provision:
  - QStash token
  - Workflow callback URL
  - signing keys

## Intelligence APIs

### Google Places API

- Role: primary discovery provider
- Status: planned, not implemented
- Must provision:
  - API key
  - billing alerts
  - quota monitoring

### RapidAPI Fallback

- Role: backup discovery provider
- Status: planned only
- Must provision only after Google provider is stable.

### Anthropic API

- Role: production reasoning/generation
- Status: planned only
- Must provision:
  - API key
  - model policy by stage
  - cost ceiling alerts

### OpenRouter

- Role: lower-cost dev/test provider
- Status: planned only
- Must provision:
  - API key
  - pinned free/test model
  - fallback behavior when free models rate-limit

## Phase-Later APIs

### Stripe

- Role: subscriptions and billing
- Phase: after product value loop is proven

### Sentry

- Role: server/client error monitoring
- Recommendation: add in the next infrastructure-hardening phase

### Product Analytics

- Role: activation funnel, report usage, scan completion, export usage
- Recommendation: PostHog or equivalent

### Email/Notifications

- Role: transactional email, future alerts
- Recommendation: Resend when notification workflows begin

## Environment Contract

## Existing Environment Keys

Already documented in `.env.example`:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `AI_PROVIDER`
- `ANTHROPIC_API_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_FREE_MODEL`
- `DISCOVERY_PROVIDER`
- `GOOGLE_PLACES_API_KEY`
- `RAPIDAPI_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `UPSTASH_QSTASH_TOKEN`
- `UPSTASH_WORKFLOW_URL`
- `QSTASH_CURRENT_SIGNING_KEY`
- `QSTASH_NEXT_SIGNING_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Recommended Additions

- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `NEXT_PUBLIC_SENTRY_DSN`
- `POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_KEY`
- `POSTHOG_HOST`
- `RESEND_API_KEY`
- `GOOGLE_PLACES_TIMEOUT_MS`
- `PIPELINE_CONCURRENCY`
- `PIPELINE_MAX_RETRIES`
- `AI_DEFAULT_TIMEOUT_MS`

## Environment Separation

Maintain three distinct environments:

1. Local development
2. Vercel preview / staging
3. Production

Rules:

- Never share production write credentials with exploratory local tooling.
- Use separate Redis/QStash resources for non-production if possible.
- Stripe must stay on test keys until billing rollout.

## Provisioning Sequence

1. Supabase
2. Vercel
3. Upstash Redis
4. Upstash Workflow/QStash
5. Google Places
6. Anthropic
7. OpenRouter
8. Sentry
9. Product analytics
10. Stripe

## Immediate Implementation Requirements

Before major coding continues:

- Add a typed server config module
- Validate all env vars on startup
- Separate required-now vs required-later envs
- Document dev/staging/prod value ownership
- Rotate any secrets that may have already lived in shared local files

## Runbook Requirements

For each external service, document:

- owner
- purpose
- env vars
- dashboard URL
- rate limits / cost concern
- incident response action
