# Phase 1: Foundation — Auth, DB, Layout - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-22
**Phase:** 1 — Foundation — Auth, DB, Layout
**Areas discussed:** Admin role detection, Landing page depth, Credit balance placement, Dashboard nav for Phase 1

---

## Admin Role Detection

### Q1: How should admin users be identified?

| Option | Description | Selected |
|--------|-------------|----------|
| DB role column | `role` text column (default 'user') in `users` table. Middleware checks `role = 'admin'`. Simple, auditable, works with RLS. | ✓ |
| Supabase custom JWT claim | `app_metadata.role = 'admin'` set via Supabase Dashboard. JWT carries the claim — no DB join needed. | |
| Hardcoded email allowlist | Env var ADMIN_EMAILS list. Quick for MVP but not scalable. | |

**User's choice:** DB role column
**Notes:** No clarifications needed. Standard approach.

---

### Q2: How should /admin route be protected?

| Option | Description | Selected |
|--------|-------------|----------|
| Same middleware, role check | Existing auth middleware checks `role` column. Not admin → redirect to /dashboard. One middleware file. | ✓ |
| Separate admin middleware | Second middleware chain for /admin/* routes. More isolated, more complex. | |
| Server-side page guard | Each /admin page does server-side role check and redirects. Less secure. | |

**User's choice:** Same middleware, role check

---

### Q3: How will the first admin user be created?

| Option | Description | Selected |
|--------|-------------|----------|
| Supabase Dashboard SQL query | `UPDATE users SET role='admin' WHERE email='...';` One-time setup, no code needed. | ✓ |
| Seeder script in /scripts | `scripts/seed-admin.ts` that promotes a user. Repeatable and documented. | |
| Env var ADMIN_EMAIL at first login | On user creation trigger: if email matches env var, set role='admin'. | |

**User's choice:** Supabase Dashboard SQL query

---

## Landing Page Depth

### Q1: How polished should the landing page be?

| Option | Description | Selected |
|--------|-------------|----------|
| Functional MVP — all sections, minimal animation | All 6 sections, real copy, DESIGN.md colors. No Framer Motion. | |
| Full production quality | All sections + Framer Motion + interactive elements. Landing IS the product face. | ✓ |
| Placeholder-first | Skeleton structure only, content deferred. Ships fastest. | |

**User's choice:** Full production quality
**Notes:** User explicitly mentioned DESIGN.md and `tasarimornegi/` folder with HTML design mockups for landing page and dashboard. These are the primary visual references.

---

### Q2: Dashboard Preview section on landing

| Option | Description | Selected |
|--------|-------------|----------|
| Static screenshot / mockup image | High-quality static image of the dashboard. | |
| Animated code/UI demo | Styled "fake dashboard" component that animates scan running, score appearing. | ✓ |
| Skip in Phase 1 | Dashboard preview section omitted from Phase 1. | |

**User's choice:** Animated code/UI demo

---

### Q3: Hero CTA behavior for logged-out visitor

| Option | Description | Selected |
|--------|-------------|----------|
| Go to /register | Direct to registration page. Shortest path to conversion. | ✓ |
| Scroll to Pricing section | Anchor scroll to pricing before registering. | |
| Open a demo modal | Show interactive demo before asking to register. | |

**User's choice:** Go to /register

---

## Credit Balance Placement

### Q1: Where should credit balance be displayed?

| Option | Description | Selected |
|--------|-------------|----------|
| Sidebar bottom | Credit balance pinned at bottom of sidebar. Always visible, doesn't clutter top bar. | |
| Header / topbar | Credits shown in top navigation bar, right side. | |
| Both — sidebar + header badge | Sidebar shows full label; header shows compact badge. Maximum visibility. | ✓ |

**User's choice:** Both — sidebar + header badge

---

### Q2: Warning display at 5 credits (COST-03 threshold)

| Option | Description | Selected |
|--------|-------------|----------|
| Turn amber/orange color | Credit badge/pill changes from neutral to amber. Subtle visual signal. | ✓ |
| Show a toast/banner notification | Dismissible banner: 'You have 5 credits remaining.' | |
| Both — color change + one-time banner | Amber color always + one-time dismissible banner. | |

**User's choice:** Turn amber/orange color only

---

## Dashboard Nav for Phase 1

### Q1: How should unimplemented nav items appear?

| Option | Description | Selected |
|--------|-------------|----------|
| All items visible, unimplemented ones dimmed | All nav items shown but disabled/muted with lock icon + "Coming soon" tooltip. | ✓ |
| Only Phase 1 items visible | Sidebar shows only Overview + Settings. Other items added later. | |
| All items fully clickable | All nav items link to pages with empty states. | |

**User's choice:** All items visible, unimplemented ones dimmed

---

### Q2: Overview cards empty state

| Option | Description | Selected |
|--------|-------------|----------|
| Zeros with empty state CTA | Cards show '0' values + 'Start a scan' CTA button. Required by DASH-04. | ✓ |
| Skeleton loaders on first load | Cards shimmer while loading, then settle to 0. | |
| You decide | Claude picks cleanest implementation. | |

**User's choice:** Zeros with empty state CTA

---

## Claude's Discretion

- Framer Motion animation variants for scroll reveals (spring/tween, duration, easing)
- shadcn/ui component selection for nav items, cards, tooltips
- Upstash Workflow provisioning scope (env connection + placeholder file; no active steps)

## Deferred Ideas

- **Password reset flow** — Not in Phase 1 requirements; deferred
- **OAuth / Google login** — Email/password only for MVP; future phase
- **Dark/light mode toggle** — Ships dark-only in Phase 1; light mode deferred
- **Advanced admin features** (template editor, scoring rule editor) — Phase 5
