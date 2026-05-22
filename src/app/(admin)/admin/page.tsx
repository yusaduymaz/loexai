import Link from "next/link";
import { Briefcase, FileBarChart, ScrollText, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * /admin landing — admin overview. Phase 1 keeps this minimal: a welcome and
 * four quick-link cards to the operational views.
 */
const TILES: Array<{
  href: string;
  icon: LucideIcon;
  title: string;
  body: string;
}> = [
  {
    href: "/admin/users",
    icon: Users,
    title: "Users",
    body: "View accounts, roles, credit balances.",
  },
  {
    href: "/admin/usage",
    icon: FileBarChart,
    title: "AI Usage",
    body: "Token spend per user, per stage, per model.",
  },
  {
    href: "/admin/jobs",
    icon: Briefcase,
    title: "Scan Jobs",
    body: "Discovery + pipeline job status (Phase 2+).",
  },
  {
    href: "/admin/templates",
    icon: ScrollText,
    title: "Templates",
    body: "Industry gap templates (view-only in Phase 1).",
  },
];

export default function AdminOverviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-xl">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-error">
          Admin · Phase 1
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-on-background md:text-3xl">
          Operations overview
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Read-only operational views. Editing capabilities (role updates, credit grants,
          template authoring) ship in Phase 5.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-4">
        {TILES.map(({ href, icon: Icon, title, body }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg transition-colors hover:border-primary"
          >
            <div className="mb-stack-md grid h-10 w-10 place-items-center rounded-lg border border-outline-variant bg-surface-container text-secondary-fixed-dim transition-colors group-hover:border-primary/50">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="text-base font-semibold text-on-surface group-hover:text-primary">
              {title}
            </h2>
            <p className="mt-1 text-sm text-on-surface-variant">{body}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
