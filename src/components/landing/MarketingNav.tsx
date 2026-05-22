import Link from "next/link";

import { Button } from "@/components/ui/button";

/**
 * Marketing-section top navigation.
 *
 * Auth-aware variant: when an authenticated user lands on a marketing page,
 * the CTA pair flips from "Log in / Get Started" to "Dashboard / Log out".
 * Auth state is resolved by the parent Server Component and passed as a prop
 * — Client Components must NEVER read auth state at initial render
 * (hydration mismatch; see PITFALLS §Next.js-3).
 */
type MarketingNavProps = {
  authenticated?: boolean;
};

export function MarketingNav({ authenticated = false }: MarketingNavProps) {
  return (
    <header className="fixed top-0 z-50 h-16 w-full border-b border-outline-variant/30 bg-surface/80 px-margin-mobile backdrop-blur-md md:px-margin-desktop">
      <div className="mx-auto flex h-full max-w-container-max items-center justify-between">
        <Link
          href="/"
          className="font-headline-lg text-2xl font-semibold tracking-tight text-primary"
        >
          LoexAI
        </Link>

        <nav className="hidden gap-stack-lg md:flex">
          <a
            href="#how"
            className="font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            Product
          </a>
          <Link
            href="/pricing"
            className="font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            Pricing
          </Link>
          <a
            href="#faq"
            className="font-medium text-on-surface-variant transition-colors hover:text-primary"
          >
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-stack-sm">
          {authenticated ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <form action="/logout" method="post">
                <Button type="submit" variant="secondary" size="sm">
                  Log out
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
