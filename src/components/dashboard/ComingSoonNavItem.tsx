"use client";

import {
  BarChart3,
  Bookmark,
  FileText,
  Lock,
  Megaphone,
  Search,
  Settings,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Dimmed/locked nav item — Phase 1 placeholder for routes that exist as
 * coming-soon shells (D-11). Rendered as a non-link so screen readers
 * announce it as disabled rather than navigable.
 *
 * Visual: same row layout as `<NavItem>` but `opacity-50`, lock icon on the
 * right, "Coming soon" tooltip on hover/focus.
 */
type Props = {
  icon:
    | "search"
    | "target"
    | "file-text"
    | "megaphone"
    | "sparkles"
    | "bookmark"
    | "users"
    | "bar-chart-3"
    | "settings";
  label: string;
  /**
   * Optional tooltip override — used for "Available in Phase 2" style hints.
   */
  tooltip?: string;
};

const ICONS = {
  search: Search,
  target: Target,
  "file-text": FileText,
  megaphone: Megaphone,
  sparkles: Sparkles,
  bookmark: Bookmark,
  users: Users,
  "bar-chart-3": BarChart3,
  settings: Settings,
} as const;

export function ComingSoonNavItem({ icon, label, tooltip = "Coming soon" }: Props) {
  const Icon = ICONS[icon];

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-disabled="true"
            tabIndex={-1}
            onClick={(e) => e.preventDefault()}
            className={cn(
              "flex w-full items-center gap-stack-md rounded-r-lg border-l-4 border-transparent px-stack-md py-2.5 text-left text-sm font-medium",
              "cursor-not-allowed opacity-50 text-on-surface-variant",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="truncate">{label}</span>
            <Lock className="ml-auto h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
