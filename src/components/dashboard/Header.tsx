"use client";

import { LogOut, User as UserIcon } from "lucide-react";

import { CreditBadge } from "./CreditBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open user menu"
            className="grid h-9 w-9 place-items-center rounded-full border border-outline-variant bg-surface-container text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
          >
            <UserIcon className="h-4 w-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action="/logout" method="post" className="w-full">
                <button
                  type="submit"
                  className="flex w-full items-center gap-2 text-sm"
                  aria-label="Log out"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  Log out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
