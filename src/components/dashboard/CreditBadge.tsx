import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * CreditBadge — server-rendered credit display (D-08, D-09, D-10).
 *
 * Server Component on purpose: the value comes from `users.credits` which the
 * dashboard layout reads via `getCurrentUser()`. Rendering on the server
 * avoids hydration mismatch (PITFALL §Next.js-3) and removes the need for a
 * client fetch on the initial paint.
 *
 * Threshold colors:
 *   - credits === 0  → red   (D-10) + upgrade CTA (full) / tooltip (compact)
 *   - credits <= 5   → amber (D-09)
 *   - else           → default surface tone
 */
type Props = {
  credits: number;
  variant: "full" | "compact";
  className?: string;
};

function toneClasses(credits: number): string {
  if (credits === 0) {
    return "bg-error-container/20 text-error border-error/40";
  }
  if (credits <= 5) {
    return "bg-amber-500/15 text-amber-300 border-amber-500/40";
  }
  return "bg-surface-container text-on-surface border-outline-variant";
}

export function CreditBadge({ credits, variant, className }: Props) {
  const tone = toneClasses(credits);

  if (variant === "compact") {
    return (
      <div
        aria-label={`${credits} credits remaining`}
        title={credits === 0 ? "No credits — upgrade to continue" : `${credits} credits`}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-medium font-mono",
          tone,
          className,
        )}
      >
        <span data-mono className="font-mono">
          {credits}
        </span>
      </div>
    );
  }

  // full variant
  return (
    <div className={cn("flex flex-col items-stretch gap-stack-xs", className)}>
      <div
        aria-label={`${credits} credits remaining`}
        className={cn(
          "inline-flex items-center justify-between gap-2 rounded-full border px-3 py-1.5",
          tone,
        )}
      >
        <span className="text-sm font-medium">
          <span data-mono className="font-mono">
            {credits}
          </span>{" "}
          credits
        </span>
      </div>
      {credits === 0 ? (
        <Link
          href="/pricing"
          className="text-xs font-medium text-primary underline-offset-2 hover:underline"
        >
          Upgrade plan →
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="cursor-not-allowed text-xs text-on-surface-variant/70"
          title="Available in Phase 5"
        >
          Need more? Upgrade
        </span>
      )}
    </div>
  );
}
