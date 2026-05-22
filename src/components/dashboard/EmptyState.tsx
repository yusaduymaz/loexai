import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * Generic empty-state block — used on the Overview page when no scans have
 * been run yet (DASH-04, D-12). Reused later by lead lists and opportunity
 * lists, which is why it stays parameterised.
 */
type Props = {
  icon: LucideIcon;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
};

export function EmptyState({ icon: Icon, title, body, ctaLabel, ctaHref }: Props) {
  return (
    <div className="flex flex-col items-center gap-stack-md rounded-xl border border-dashed border-outline-variant bg-surface-container-low/40 px-stack-lg py-stack-xl text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-outline-variant bg-surface-container text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <p className="max-w-md text-sm text-on-surface-variant">{body}</p>
      <Link
        href={ctaHref}
        className="rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-on-primary shadow-ambient transition-opacity hover:opacity-90"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
