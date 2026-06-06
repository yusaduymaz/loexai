---
phase: 01-foundation-auth-db-layout
plan: 1D
subsystem: dashboard-admin-shells
tags: [dashboard, admin, credit-badge, upstash-workflow, redis, navigation, coming-soon]
dependency-graph:
  requires:
    - 01-1A
    - 01-1B
  provides:
    - "Dashboard layout and navigation (10 items)"
    - "Coming soon navigation shells (9 items)"
    - "CreditBadge component (compact and full variants with thresholds)"
    - "Admin layout and navigation"
    - "Admin pages: Users, Usage, Jobs, Templates"
    - "Upstash Workflow & Redis client initialization"
    - "Empty workflow route endpoint"
  affects:
    - "Phase 2 Lead Discovery scan forms and listings"
    - "Phase 3 Intelligence Pipeline background workers"
    - "Phase 4 Business Report rendering"
    - "Phase 5 Stripe credit purchase integration"
tech-stack:
  added:
    - "@upstash/workflow"
    - "@upstash/redis"
    - "@upstash/qstash"
  patterns:
    - "Server Component layouts rendering role-gated UI"
    - "Zoned layouts: (dashboard) and (admin) with separate layout.tsx helpers"
    - "Credit badges updating live from Supabase user context without client-side hydration mismatch"
    - "Lazy-loaded Redis and Workflow singletons with server-only gate"
key-files:
  created:
    - src/app/(dashboard)/layout.tsx
    - src/app/(dashboard)/dashboard/page.tsx
    - src/app/(dashboard)/dashboard/discovery/page.tsx
    - src/app/(dashboard)/dashboard/opportunities/page.tsx
    - src/app/(dashboard)/dashboard/business/[id]/page.tsx
    - src/app/(dashboard)/dashboard/campaigns/page.tsx
    - src/app/(dashboard)/dashboard/prompt-studio/page.tsx
    - src/app/(dashboard)/dashboard/saved/page.tsx
    - src/app/(dashboard)/dashboard/crm/page.tsx
    - src/app/(dashboard)/dashboard/analytics/page.tsx
    - src/app/(dashboard)/dashboard/settings/page.tsx
    - src/components/dashboard/Sidebar.tsx
    - src/components/dashboard/Header.tsx
    - src/components/dashboard/CreditBadge.tsx
    - src/components/dashboard/NavItem.tsx
    - src/components/dashboard/ComingSoonNavItem.tsx
    - src/components/dashboard/ComingSoonShell.tsx
    - src/components/dashboard/OverviewCard.tsx
    - src/components/dashboard/EmptyState.tsx
    - src/app/(admin)/layout.tsx
    - src/app/(admin)/admin/page.tsx
    - src/app/(admin)/admin/users/page.tsx
    - src/app/(admin)/admin/usage/page.tsx
    - src/app/(admin)/admin/jobs/page.tsx
    - src/app/(admin)/admin/templates/page.tsx
    - src/components/admin/AdminSidebar.tsx
    - src/components/admin/AdminHeader.tsx
    - src/lib/workflow/client.ts
    - src/lib/redis/client.ts
    - src/app/api/workflow/pipeline/route.ts
    - src/components/ui/tooltip.tsx
    - src/components/ui/dropdown-menu.tsx
  modified:
    - package.json
    - package-lock.json
    - tsconfig.json
decisions:
  - "Split dashboard and admin shells into Next.js Route Groups `(dashboard)` and `(admin)` for clean middleware and role gating"
  - "Implemented pure server-component rendering for credit badges to avoid hydration mismatch, passing data from Server layout to child Server components"
  - "Used ComingSoonShell to display blurred or placeholder layouts for upcoming phases without coding unnecessary UI forms in Phase 1"
  - "Routed 'Start a scan' empty state button directly to the discovery dim shell, which shows a friendly 'Coming soon' prompt"
metrics:
  duration: "~30 minutes"
  completed: "2026-05-22"
  tasks_completed: 3
  files_created: 32
---

# Phase 1 Plan 1D: Dashboard layout + admin layout + credit badges + Upstash Workflow/Redis provisioning Summary

Delivered the fully authenticated dashboard and admin layouts, credit badge controls, coming-soon route shells, and initialized Upstash Redis/Workflow wrappers.

## What Was Done

### Task 1: Dashboard layout + Navigation (commit: b98fdd9)
- Structured the `(dashboard)` route group layout to fetch the user session, check roles, and render navigation and credit balance.
- Built the `Sidebar` with all 10 required routes. The inactive upcoming ones (e.g. Discovery, Opportunities, Campaigns) are dimmed and show "Coming soon" tooltips.
- Implemented `CreditBadge` with variants: compact for headers, full for sidebar. Designed color thresholds: default (blue/gray), <= 5 (amber), 0 (red).
- Added `ComingSoonShell` to serve visual placeholders for routes planned in future phases.

### Task 2: Overview Page + Admin Page + Usage Reader (commit: d0c5e36)
- Implemented the main `/dashboard` page querying the database tables (`businesses`, `opportunities`, `sales_strategies`, `build_prompts`) to count metric values.
- Built `<OverviewCard>` and a shared `<EmptyState>` component with a CTA directing users to start a scan.
- Created the `/admin` shell with a gated layout checking `role === 'admin'`.
- Developed `/admin/users` to display all registered accounts and `/admin/usage` as a reader for the `ai_usage` table.

### Task 3: Upstash Provisioning + API skeletons (commit: d0c5e36)
- Installed `@upstash/workflow`, `@upstash/redis`, and `@upstash/qstash`.
- Configured wrapper clients under `src/lib/workflow/client.ts` and `src/lib/redis/client.ts` as lazy-loaded singletons.
- Implemented `src/app/api/workflow/pipeline/route.ts` as an empty endpoint serving Upstash Workflow callbacks.
- Wrote type definitions for `AIProvider` and `DiscoveryProvider` to establish abstract contracts for future phases.

## Verification
- Clean build via `npm run build` and strict typechecking with `npx tsc --noEmit`.
- Role gates properly redirect unauthorized users.
- Credit badges render dynamically without hydration mismatches.
