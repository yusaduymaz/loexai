"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { SignOutButton } from "@clerk/nextjs";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MarketingNavProps = {
  authenticated?: boolean;
};

const navLinks = [
  { href: "#preview", label: "Platform" },
  { href: "#pipeline", label: "Pipeline" },
  { href: "#how", label: "Workflow" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faq", label: "FAQ" },
];

export function MarketingNav({ authenticated = false }: MarketingNavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 12);
    handler();
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-margin-mobile pt-4 md:px-margin-desktop">
      <div
        className={cn(
          "mx-auto flex max-w-container-max items-center justify-between rounded-full px-4 py-3 transition-all duration-300 md:px-6",
          scrolled
            ? "panel-glass border-outline-variant/30 shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
            : "border border-outline-variant/15 bg-[#061425]/55 backdrop-blur-md",
        )}
      >
        <Link href="/" className="group flex items-center gap-3">
          <span
            className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-full border border-outline-variant/20 bg-gradient-to-br from-surface-container-low to-surface-container-high text-base text-on-background [font-family:var(--font-editorial-serif)]"
          >
            <span
              aria-hidden="true"
              className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-secondary/35 to-transparent transition-transform duration-700 group-hover:translate-x-full"
            />
            L
          </span>
          <div className="leading-tight">
            <p className="text-lg text-on-background [font-family:var(--font-editorial-serif)]">
              LoexAI
            </p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-on-surface-variant/70">
              Opportunity Intelligence
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative rounded-full px-4 py-2 text-sm text-on-surface-variant transition-colors hover:text-on-background"
            >
              <span className="relative z-10">{link.label}</span>
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-secondary/0 transition-colors duration-200 hover:bg-secondary/10"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {authenticated ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <SignOutButton redirectUrl="/login">
                <Button variant="secondary" size="sm">
                  Log out
                </Button>
              </SignOutButton>
            </>
          ) : (
            <>
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden md:inline-flex"
              >
                <Link href="/login">Log in</Link>
              </Button>
              <Button asChild variant="primary" size="sm" className="btn-shine">
                <Link href="/register">Start Free</Link>
              </Button>
            </>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen((s) => !s)}
            className="grid h-10 w-10 place-items-center rounded-full border border-outline-variant/20 bg-surface-container-low/70 text-on-surface md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <X className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Menu className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen ? (
        <div className="mx-auto mt-2 max-w-container-max md:hidden">
          <div className="panel-glass rounded-3xl p-3">
            <nav className="flex flex-col">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-4 py-3 text-sm text-on-surface-variant transition-colors hover:bg-secondary/10 hover:text-on-background"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 grid gap-2 border-t border-outline-variant/15 px-2 pt-3">
                {authenticated ? (
                  <Button asChild variant="secondary" size="sm">
                    <Link href="/dashboard">Dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm">
                      <Link href="/login">Log in</Link>
                    </Button>
                    <Button asChild variant="primary" size="sm">
                      <Link href="/register">Start Free</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
