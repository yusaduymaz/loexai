import { createAdminClient } from "@/lib/supabase/admin";

/**
 * /admin/users — ADM-01 view-only.
 *
 * Uses the service-role admin client (`lib/supabase/admin.ts`, `server-only`)
 * because RLS prevents an admin from SELECTing rows belonging to other users
 * through the normal user-scoped client. This is the legitimate cross-user
 * read path; per SKELETON §1.2 it stays server-side.
 *
 * Phase 1 scope: list rows, no editing. "Update role" / "Grant credits" land
 * in Phase 5 once Stripe + plan tier logic exists.
 */
type UserRow = {
  id: string;
  email: string;
  role: string;
  credits: number;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("id, email, role, credits, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: UserRow[] = error || !data ? [] : (data as UserRow[]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      <div>
        <h1 className="text-2xl font-semibold text-on-background">Users</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          {rows.length} users (showing up to 100, newest first).
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline-variant">
              <th className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Email
              </th>
              <th className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Role
              </th>
              <th className="px-stack-md py-3 text-right text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Credits
              </th>
              <th className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant">
                Created
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-stack-md py-stack-lg text-center text-on-surface-variant">
                  No users yet.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container/50">
                  <td className="px-stack-md py-3 font-medium text-on-surface">{u.email}</td>
                  <td className="px-stack-md py-3">
                    <span
                      className={
                        u.role === "admin"
                          ? "rounded-full border border-error/40 bg-error-container/20 px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-error"
                          : "rounded-full border border-outline-variant bg-surface-container px-2 py-0.5 text-xs font-medium uppercase tracking-wider text-on-surface-variant"
                      }
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>
                    {u.credits}
                  </td>
                  <td className="px-stack-md py-3 text-on-surface-variant">
                    {new Date(u.created_at).toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-on-surface-variant">
        Role and credit editing ships in Phase 5 alongside Stripe.
      </p>
    </div>
  );
}
