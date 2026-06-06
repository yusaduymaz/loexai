"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bookmark,
  FileText,
  LayoutDashboard,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Single sidebar nav row. Active state is derived from the live pathname so
 * that route changes update the highlight without a server round-trip.
 *
 * A 4px primary left-bar marks the active item (DESIGN.md §Sidebar).
 */
type Props = {
  href: string;
  icon:
    | "layout-dashboard"
    | "search"
    | "target"
    | "file-text"
    | "sparkles"
    | "bookmark"
    | "users"
    | "settings";
  label: string;
};

const ICONS = {
  "layout-dashboard": LayoutDashboard,
  "search": Search,
  "target": Target,
  "file-text": FileText,
  "sparkles": Sparkles,
  "bookmark": Bookmark,
  "users": Users,
  "settings": Settings,
} as const;

export function NavItem({ href, icon, label }: Props) {
  const pathname = usePathname();
  const Icon = ICONS[icon];
  const active =
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`));

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex items-center gap-stack-md rounded-r-lg border-l-4 px-stack-md py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-primary bg-surface-container-low text-primary"
          : "border-transparent text-on-surface-variant hover:bg-surface-container hover:text-primary",
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          active ? "text-primary" : "text-on-surface-variant group-hover:text-primary",
        )}
        aria-hidden="true"
      />
      <span className="truncate">{label}</span>
    </Link>
  );
}
