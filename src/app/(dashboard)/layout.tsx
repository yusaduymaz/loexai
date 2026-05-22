import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { requireRole } from "@/lib/auth/require-role";

/**
 * (dashboard) route-group layout — Server Component.
 *
 * Defense-in-depth: middleware (PLAN-1A) already redirects unauthenticated
 * requests to /login. `requireRole('user')` re-asserts at the layout level so
 * a future matcher misconfiguration cannot leak a protected page.
 *
 * Note on roles: `requireRole('user')` redirects ONLY if the role mismatches
 * to /login (unauth) or /dashboard (admin → user is intentionally allowed).
 * In Phase 1 admins can browse the dashboard too — the helper preserves
 * `user` for layout consumption.
 *
 * Layout grid: desktop sidebar fixed at 280px (matches Dashboard-Overview.html
 * reference). On mobile the sidebar collapses out of the flow; a hamburger
 * drawer is deferred (see plan 1D Open Questions / Phase 2 mobile polish).
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireRole("user");

  return (
    <div className="min-h-screen bg-background text-on-background">
      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <div className="hidden lg:block">
          <div className="sticky top-0 h-screen">
            <Sidebar user={user} />
          </div>
        </div>
        <div className="flex min-h-screen flex-col">
          <Header user={user} />
          <main className="flex-grow px-margin-mobile md:px-margin-desktop py-stack-lg">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
