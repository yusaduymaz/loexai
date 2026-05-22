import Link from "next/link";
import {
  BarChart3,
  Bookmark,
  Code2,
  FileText,
  LayoutDashboard,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { CreditBadge } from "./CreditBadge";
import { ComingSoonNavItem } from "./ComingSoonNavItem";
import { NavItem } from "./NavItem";
import type { AuthUser } from "@/types/domain";

/**
 * Dashboard sidebar (Server Component).
 *
 * Phase 1 nav model (D-11):
 *   - 1 active item: Overview → `/dashboard`
 *   - 9 dimmed items: discovery, opportunities, business reports, campaigns,
 *     prompt studio, saved, crm, analytics, settings. Each shows a lock icon
 *     and "Coming soon" tooltip.
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
            <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" />
          </li>
          <li>
            <ComingSoonNavItem icon={Search} label="Lead Discovery" tooltip="Coming in Phase 2" />
          </li>
          <li>
            <ComingSoonNavItem icon={Target} label="Opportunities" tooltip="Coming in Phase 3" />
          </li>
          <li>
            <ComingSoonNavItem icon={FileText} label="Business Reports" tooltip="Coming in Phase 4" />
          </li>
          <li>
            <ComingSoonNavItem icon={Megaphone} label="Campaigns" tooltip="Coming in Phase 4" />
          </li>
          <li>
            <ComingSoonNavItem icon={Sparkles} label="Prompt Studio" tooltip="Coming in Phase 4" />
          </li>
          <li>
            <ComingSoonNavItem icon={Bookmark} label="Saved Leads" tooltip="Coming in Phase 2" />
          </li>
          <li>
            <ComingSoonNavItem icon={Users} label="CRM" tooltip="Coming in Phase 5" />
          </li>
          <li>
            <ComingSoonNavItem icon={BarChart3} label="Analytics" tooltip="Coming in Phase 5" />
          </li>
          <li>
            <ComingSoonNavItem icon={Settings} label="Settings" tooltip="Coming in Phase 5" />
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
