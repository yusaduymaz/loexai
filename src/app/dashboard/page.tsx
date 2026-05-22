import { requireRole } from "@/lib/auth/require-role";

/**
 * Dashboard placeholder.
 *
 * Real dashboard (sidebar, overview cards, credit badge) lands in PLAN-1D.
 * This stub exists so PLAN-1A's middleware can be verified end-to-end:
 *   - Unauth → redirected to /login (middleware)
 *   - Auth   → reaches this page; sees role + credits from DB
 */
export default async function DashboardPage() {
  const user = await requireRole("user");

  return (
    <main className="min-h-screen px-margin-mobile md:px-margin-desktop py-stack-xl">
      <div className="max-w-3xl mx-auto space-y-stack-md">
        <p className="font-label-caps text-xs uppercase tracking-wider text-primary">
          Dashboard · Phase 1 placeholder
        </p>
        <h1 className="font-headline-lg text-3xl font-semibold text-on-surface">
          Hoş geldin, {user.email}
        </h1>
        <div className="rounded-lg border-hairline bg-surface-container p-stack-lg shadow-ambient">
          <dl className="grid grid-cols-2 gap-stack-md">
            <div>
              <dt className="font-label-caps text-xs uppercase text-on-surface-variant">
                Role
              </dt>
              <dd className="font-data-mono text-lg text-on-surface">
                {user.role}
              </dd>
            </div>
            <div>
              <dt className="font-label-caps text-xs uppercase text-on-surface-variant">
                Credits
              </dt>
              <dd className="font-data-mono text-lg text-on-surface">
                {user.credits}
              </dd>
            </div>
          </dl>
        </div>
        <p className="font-body-sm text-on-surface-variant">
          Tam dashboard (sidebar + overview kartları + credit badge) PLAN-1D&apos;de
          gelecek.
        </p>
      </div>
    </main>
  );
}
