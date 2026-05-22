import Link from "next/link";

/**
 * Shared "coming soon" page shell for Phase 1 dim-route pages
 * (D-11). Renders an icon, title, phase rozeti, body text and a back-to-
 * overview link. Used by 8 dim shell routes to keep them visually consistent.
 */
type Props = {
  icon: React.ReactNode;
  title: string;
  phase: string;
  body: string;
};

export function ComingSoonShell({ icon, title, phase, body }: Props) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-stack-md py-stack-xl text-center">
      <div className="grid h-20 w-20 place-items-center rounded-2xl border border-outline-variant bg-surface-container text-primary opacity-60">
        {icon}
      </div>
      <h1 className="text-2xl font-semibold text-on-surface">{title}</h1>
      <span className="rounded-full border border-outline-variant bg-surface-container px-3 py-1 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
        Coming in {phase}
      </span>
      <p className="max-w-prose text-sm text-on-surface-variant">{body}</p>
      <Link
        href="/dashboard"
        className="rounded-lg border border-outline-variant bg-surface-container px-4 py-2 text-sm font-medium text-on-surface transition-colors hover:border-primary hover:text-primary"
      >
        ← Back to Overview
      </Link>
    </div>
  );
}
