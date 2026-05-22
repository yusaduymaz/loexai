# STATE.md — LoexAI

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-22)

**Core value:** "Hangi yerel işletmeye ulaşmalıyım, ona ne satmalıyım, neden ihtiyacı var ve nasıl inşa etmeliyim?" sorusunu tek platformda yanıtlamak.

**Current focus:** Phase 1 — Foundation (Auth, DB, Layout)

---

## Current State

**Milestone:** Pre-development (planning complete)
**Active Phase:** None (Phase 1 not started)
**Completed Phases:** —

---

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | 🔜 Ready | Auth + DB + landing + layout |
| Phase 2: Lead Discovery | ⏳ Blocked | Requires Phase 1 |
| Phase 3: Intelligence Pipeline | ⏳ Blocked | Requires Phase 2 |
| Phase 4: AI Output | ⏳ Blocked | Requires Phase 3 |
| Phase 5: SaaS Layer | ⏳ Blocked | Requires Phase 4 |

---

## Key Context

- **Stack:** Next.js 15 App Router, Supabase, TypeScript strict, Tailwind, shadcn/ui
- **AI:** AIProvider interface — OpenRouter free models (dev), Anthropic (prod)
- **Pipeline:** Upstash Workflow (not raw QStash) for 8-step pipeline orchestration
- **Auth:** `@supabase/ssr` + `getClaims()` — never `getSession()` on server
- **Critical rule:** Null-propagation — enrichment failures = explicit `null`, never inferred gaps
- **Cost control:** Max 2 AI retries per stage; mid-job ai_usage check; circuit breaker required

---

## Decisions Log

| Decision | Phase | Rationale |
|----------|-------|-----------|
| Upstash Workflow (not raw QStash) | Phase 1+ | Step-level retry, state preservation, Vercel timeout bypass |
| `openai/gpt-oss-120b` pinned for dev | Phase 3+ | Stable free model with JSON schema support |
| Supabase Edge Functions NOT used for pipeline | Phase 3+ | 2s CPU cap — unsuitable for AI orchestration |
| Geographic subdivision deferred to v2 | Phase 2 | 60-cap shown in UI; subdivision is Phase 2+ |
| Puppeteer/headless deferred to v2 | Phase 3 | JS-only sites marked "unknown" in MVP |

---

## Next Action

```
/gsd-plan-phase 1
```

*Context gathered 2026-05-22. Resume file: `.planning/phases/01-foundation-auth-db-layout/01-CONTEXT.md`*
