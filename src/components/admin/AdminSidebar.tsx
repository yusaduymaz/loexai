"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  FileBarChart,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Admin sidebar — same structural pattern as the dashboard sidebar but tinted
 * with an "ADMIN" rozet at the top so the operator never confuses which
 * surface they are on. The "Back to Dashboard" link sits at the bottom.
 */
const NAV: Array<{ href: string; icon: LucideIcon; label: string }> = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/usage", icon: FileBarChart, label: "AI Usage" },
  { href: "/admin/jobs", icon: Briefcase, label: "Scan Jobs" },
  { href: "/admin/failures", icon: AlertTriangle, label: "Failures" },
  { href: "/admin/templates", icon: ScrollText, label: "Templates" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-full flex-col border-r border-outline-variant bg-surface-container-lowest">
      <div className="flex items-center gap-stack-sm px-margin-desktop pt-stack-lg pb-stack-md">
        <div
          aria-hidden="true"
          className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-error to-error/70 text-on-error font-bold"
        >
          A
        </div>
        <div className="leading-tight">
          <p className="text-base font-semibold tracking-tight text-primary">LoexAI</p>
          <p className="text-[10px] uppercase tracking-widest text-error">Admin</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-stack-sm pt-stack-sm">
        <ul className="flex flex-col gap-1">
          {NAV.map(({ href, icon: Icon, label }) => {
            const active =
              pathname === href || (href !== "/admin" && pathname.startsWith(`${href}/`));
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-stack-md rounded-r-lg border-l-4 px-stack-md py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "border-primary bg-surface-container-low text-primary"
                      : "border-transparent text-on-surface-variant hover:bg-surface-container hover:text-primary",
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-outline-variant px-stack-md py-stack-md">
        <Link
          href="/dashboard"
          className="flex items-center gap-stack-sm text-xs font-medium text-on-surface-variant transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
