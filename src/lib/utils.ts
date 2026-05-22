import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * shadcn/ui `cn` helper — Tailwind class concat + dedupe.
 *
 * Used by every UI primitive that needs to merge variants.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
