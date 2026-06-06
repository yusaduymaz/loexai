import Link from "next/link";

import { CreditBadge } from "./CreditBadge";
import { ComingSoonNavItem } from "./ComingSoonNavItem";
import { NavItem } from "./NavItem";
import type { AuthUser } from "@/types/domain";

/**
 * Dashboard sidebar (Server Component).
 *
 * Active items: Overview, Lead Discovery, Opportunities, Business Reports,
 *   Prompt Studio, Saved Leads, CRM, Settings.
 * Dimmed (intentionally MVP-out per CLAUDE.md §18): Campaigns (no automated
 *   outreach in MVP), Analytics (advanced analytics deferred to v2).
 *
 * The bottom area shows the full-variant `<CreditBadge>` (D-08). Both the
 * sidebar credit pill and the header compact badge read the SAME server-
 * resolved `user.credits` value, so they cannot drift.
 */
type Props = {
  user: AuthUser;
};

export function Sidebar({ user }: Props) {
  return (
    <aside className="flex h-screen w-full flex-col bg-surface-container-lowest border-r border-outline-variant">
      {/* Brand */}
      <div className="flex items-center gap-stack-sm px-margin-desktop pt-stack-lg pb-stack-md">
        <div
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-secondary text-on-primary font-bold"
        >
          L
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight text-primary">LoexAI</p>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
            Business Intelligence
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-stack-sm pt-stack-sm">
        <ul className="flex flex-col gap-1">
          <li>
            <NavItem href="/dashboard" icon="layout-dashboard" label="Overview" />
          </li>
          <li>
            <NavItem href="/dashboard/discovery" icon="search" label="Lead Discovery" />
          </li>
          <li>
            <NavItem href="/dashboard/opportunities" icon="target" label="Opportunities" />
          </li>
          <li>
            <NavItem href="/dashboard/business" icon="file-text" label="Business Reports" />
          </li>
          <li>
            <ComingSoonNavItem
              icon="megaphone"
              label="Campaigns"
              tooltip="Automated outreach is out of MVP scope"
            />
          </li>
          <li>
            <NavItem href="/dashboard/prompt-studio" icon="sparkles" label="Prompt Studio" />
          </li>
          <li>
            <NavItem href="/dashboard/saved" icon="bookmark" label="Saved Leads" />
          </li>
          <li>
            <NavItem href="/dashboard/crm" icon="users" label="CRM" />
          </li>
          <li>
            <ComingSoonNavItem
              icon="bar-chart-3"
              label="Analytics"
              tooltip="Advanced analytics deferred to v2"
            />
          </li>
          <li>
            <NavItem href="/dashboard/settings/billing" icon="settings" label="Settings" />
          </li>
        </ul>
      </nav>

      {/* Credit footer */}
      <div className="border-t border-outline-variant px-stack-md py-stack-md">
        <CreditBadge credits={user.credits} variant="full" />
        <p className="mt-stack-md truncate text-[11px] text-on-surface-variant" title={user.email}>
          {user.email}
        </p>
        {user.role === "admin" ? (
          <Link
            href="/admin"
            className="mt-1 inline-block text-xs font-medium text-secondary hover:underline"
          >
            Admin panel →
          </Link>
        ) : null}
      </div>
    </aside>
  );
}
