# Phase 1: Foundation — Auth, DB, Layout - Context

**Gathered:** 2026-05-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Working auth flow (register / login / logout / protected-route redirect) + all 10 DB tables with RLS policies + full production-quality landing page + protected dashboard skeleton with sidebar + admin layout entry point.

Phase 1 does NOT include: any scan/discovery logic, enrichment, scoring, AI calls, Stripe, or outreach. The pipeline infra (Upstash Workflow) is provisioned and environment-connected but has no active workflow definitions yet.

</domain>

<decisions>
## Implementation Decisions

### Admin Role Detection
- **D-01:** Admin users are identified by a `role` column (text, default `'user'`) in the `users` table. No Supabase custom claims; no hardcoded email lists.
- **D-02:** A single auth middleware handles both dashboard and admin route protection. If `role !== 'admin'`, `/admin/*` requests redirect to `/dashboard`. One middleware file, one role check.
- **D-03:** First admin is promoted manually via Supabase Dashboard SQL: `UPDATE users SET role='admin' WHERE email='...';`. No seeder script or env-var trigger needed in Phase 1.

### Landing Page
- **D-04:** Full production quality — all 6 sections (Hero, Problem, How It Works, Pricing, FAQ, CTA) built with real copy, DESIGN.md design tokens, Geist font, and Framer Motion scroll animations.
- **D-05:** Dashboard Preview section uses an **animated UI demo component** — a styled "fake dashboard" that animates a scan running and a score appearing. No static screenshot.
- **D-06:** Hero "Get Started" CTA navigates directly to `/register` for non-authenticated visitors.
- **D-07:** Design implementation MUST follow `DESIGN.md` (color tokens, typography) and use `tasarimornegi/LandingPage.html` as the primary visual reference.

### Credit Balance Display
- **D-08:** Credit balance is shown in **two places**: sidebar bottom (full label: "20 credits") + header/topbar (compact badge). Both must always reflect the live DB value.
- **D-09:** When credits drop to ≤ 5 (COST-03 warning threshold), the credit display turns **amber/orange**. No banner or toast — color change only.
- **D-10:** When credits reach 0 (COST-04), scanning is blocked and an upgrade CTA is shown. Credit display turns red.

### Dashboard Navigation (Phase 1 shell)
- **D-11:** All sidebar nav items are rendered (Overview, Lead Discovery, Opportunities, Business Reports, Campaigns, Prompt Studio, Saved Leads, CRM, Analytics, Settings). Items not yet implemented in Phase 1 are **visually dimmed** with a lock icon and a "Coming soon" tooltip.
- **D-12:** Overview cards (DASH-02) show **zero values with an empty state "Start a scan" CTA** when no data exists (DASH-04). No skeleton loaders on first load in Phase 1.
- **D-13:** Dashboard design implementation MUST follow `tasarimornegi/Dashboard-Overview.html` as the primary visual reference.

### Claude's Discretion
- Exact Framer Motion animation variants for scroll reveals (spring vs. tween, duration, easing) — standard scroll-fade-up pattern is fine.
- shadcn/ui component selection for nav items, cards, tooltips — pick components that match the design reference.
- Upstash Workflow provisioning scope: environment connection + placeholder workflow file; no active workflow steps needed in Phase 1.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Architecture & Requirements
- `CLAUDE.md` — Full architecture spec: hybrid system rules, data model (Section 11), tech stack (Section 10), security rules (Section 16), env vars (Section 17). BINDING.
- `.planning/REQUIREMENTS.md` — All Phase 1 requirements: FOUND-01..08, LAND-01..03, DASH-01..04, ADM-01..03
- `.planning/ROADMAP.md` §Phase 1 — Phase goal, success criteria, 4 plans (1A..1D)

### Design References (MANDATORY for UI implementation)
- `DESIGN.md` — Complete design token system: color palette (dark theme, #031427 background, #b3c5ff primary), typography (Geist font scale), component style tokens. Apply to all UI.
- `tasarimornegi/LandingPage.html` — **Primary visual reference** for the landing page. Build to match this design.
- `tasarimornegi/Dashboard-Overview.html` — **Primary visual reference** for the dashboard overview and sidebar layout.
- `tasarimornegi/Dashboard-Lead-Discovery.html` — Reference for the Lead Discovery page shell (Phase 1 renders it as dimmed/coming-soon in nav).
- `tasarimornegi/Dashboard-Opportunities-List.html` — Reference for the Opportunities page shell.

### Database
- `supabase/migrations/` — Single source of truth for schema. CONTEXT.md Section 11 of CLAUDE.md defines the conceptual model; migrations define the actual schema.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None yet — project is pre-development. Phase 1 establishes all patterns.

### Established Patterns (to establish in Phase 1)
- `@supabase/ssr` + `getClaims()` for all server-side auth — never `getSession()`
- `supabase/migrations/` as single source of truth — no schema drift from direct edits
- `lib/` directory isolation: all external service wrappers live under `lib/`, never inline in components or route handlers
- Upstash Workflow (not raw QStash) — step-level retry, state preservation, Vercel timeout bypass

### Integration Points
- Auth middleware → all `/dashboard/*` and `/admin/*` routes
- `users` table → all other tables via `user_id` FK + RLS (cascade on delete)
- `ai_usage` table → established in Phase 1 for token logging; actively written in Phase 3+

</code_context>

<specifics>
## Specific Ideas

- The dashboard preview on the landing page should animate a "scan in progress" — showing business names appearing, a score counter incrementing, and a priority label appearing. Think "live intelligence feed" visual.
- The `role` column on `users` should be set to `'admin'` for the first user via Supabase Dashboard SQL — document this in a `docs/admin-setup.md` or README note so it's not lost.
- DESIGN.md has a full Material Design 3 color system mapped to navy/blue theme. Don't override or guess colors — map directly from the token names in DESIGN.md.

</specifics>

<deferred>
## Deferred Ideas

- **Password reset flow** — Not in Phase 1 requirements (FOUND-01..03 cover register/login/logout only). Add to Phase 1 scope only if Supabase makes it trivially cheap; otherwise Phase 2+.
- **OAuth / Google login** — Not in requirements; email/password only for MVP. Future phase if needed.
- **Dark/light mode toggle** — DESIGN.md defines a dark theme; light mode variant is deferred. Phase 1 ships dark-only.
- **Advanced admin features** (template management, scoring rule editor) — ADM-03 is "görüntüleme en azından" (viewing minimum). Full editor is Phase 5.

</deferred>

---

*Phase: 1 — Foundation — Auth, DB, Layout*
*Context gathered: 2026-05-22*
