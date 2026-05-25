"use client";

import { UserButton } from "@clerk/nextjs";

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
        <span className="sr-only">{user.email}</span>
        <UserButton afterSignOutUrl="/login" />
      </div>
    </header>
  );
}
