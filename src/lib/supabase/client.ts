import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/config/public";

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
  const { NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: key, NEXT_PUBLIC_SUPABASE_URL: url } =
    getPublicEnv();

  return createBrowserClient(url, key);
}
