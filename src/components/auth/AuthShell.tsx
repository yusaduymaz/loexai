import Link from "next/link";

import { Card } from "@/components/ui/card";

/**
 * Centered auth shell — logo + card. Used by /login and /register.
 *
 * Background: subtle dot pattern + soft primary glow to keep continuity with
 * the marketing aesthetic without competing with the form itself.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-margin-mobile py-stack-xl md:px-margin-desktop">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(0,217,255,0.08),_transparent_55%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #d3e4fe 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <Link
        href="/"
        className="relative z-10 mb-stack-xl font-headline-lg text-2xl font-semibold tracking-tight text-primary"
      >
        LoexAI
      </Link>

      <Card className="relative z-10 w-full max-w-md p-stack-xl">
        <div className="mb-stack-lg text-center">
          <h1 className="font-headline-lg text-2xl font-semibold text-on-surface">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-stack-xs text-body-sm text-on-surface-variant">
              {subtitle}
            </p>
          ) : null}
        </div>
        {children}
        {footer ? (
          <div className="mt-stack-lg border-t border-outline-variant/30 pt-stack-md text-center text-body-sm text-on-surface-variant">
            {footer}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
