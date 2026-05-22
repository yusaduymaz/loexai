"use client";

import { LogOut, User as UserIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/types/domain";

type Props = {
  user: AuthUser;
  title?: string;
};

export function AdminHeader({ user, title = "Admin" }: Props) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-outline-variant bg-surface-container-lowest px-margin-mobile md:px-margin-desktop">
      <h1 className="text-base font-semibold text-on-surface md:text-lg">{title}</h1>
      <div className="flex items-center gap-stack-md">
        <span className="hidden rounded-full border border-error/40 bg-error-container/20 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-error md:inline">
          Admin mode
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Open admin user menu"
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
