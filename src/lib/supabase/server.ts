import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Supabase client for **Server Components / Server Actions / Route Handlers**.
 *
 * Uses cookie-based auth via `next/headers`. The `setAll` callback is wrapped
 * in a try/catch because Server Components are not allowed to mutate cookies —
 * the actual refresh happens in middleware (`lib/supabase/middleware.ts`).
 *
 * For server-side auth checks always prefer `supabase.auth.getClaims()` over
 * `getSession()` (validates JWT vs. just reading cookie). This is enforced
 * project-wide; see RESEARCH STACK §1 + PITFALL N15-1.
 */
export async function createClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in env",
    );
  }

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }: CookieToSet) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // setAll called from a Server Component — token refresh handled by
          // middleware. Swallow per @supabase/ssr docs.
        }
      },
    },
  });
}
