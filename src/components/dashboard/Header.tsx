"use client";

import { UserButton } from "@clerk/nextjs";

import { CreditBadge } from "./CreditBadge";
import type { AuthUser } from "@/types/domain";

/**
 * Dashboard header.
 *
 * Client Component because the user menu uses Radix `<DropdownMenu>` (state
 * lives in the browser). The `CreditBadge` it renders is still a pure
 * value-driven component — the live credits come from props the server layout
 * resolved, NOT a client fetch.
 *
 * Right cluster: compact `<CreditBadge>` (D-08) + user dropdown with logout.
 * Logout is a POST form so middleware can run signOut without GET preempt.
 */
type Props = {
  user: AuthUser;
  title?: string;
};

export function Header({ user, title = "Dashboard" }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-margin-mobile md:px-margin-desktop">
      <div>
        <h1 className="text-base font-semibold text-on-surface md:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-stack-md">
        <CreditBadge credits={user.credits} variant="compact" />

        <UserButton afterSignOutUrl="/login" />
      </div>
    </header>
  );
}
