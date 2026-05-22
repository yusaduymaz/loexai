import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for **Client Components** (browser).
 *
 * Reads from `NEXT_PUBLIC_*` env vars — these are public by design.
 * Do NOT import the service role key here; that lives in `admin.ts` and is
 * marked `server-only`.
 *
 * Usage:
 *   "use client";
 *   import { createClient } from "@/lib/supabase/client";
 *   const supabase = createClient();
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env",
    );
  }

  return createBrowserClient(url, key);
}
