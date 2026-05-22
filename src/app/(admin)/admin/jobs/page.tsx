import { createAdminClient } from "@/lib/supabase/admin";

/**
 * /admin/jobs — scan_jobs reader.
 *
 * Phase 1 placeholder: the scan worker doesn't run yet. The page exists so
 * once Phase 2 starts inserting `scan_jobs` rows the admin can monitor them
 * without an additional plan iteration.
 */
type JobRow = {
  id: string;
  created_at: string;
  user_id: string;
  location: string | null;
  category: string | null;
  status: string | null;
  found_count: number | null;
  analyzed_count: number | null;
  error_message: string | null;
  users: { email: string } | null;
};

export const dynamic = "force-dynamic";

export default async function AdminJobsPage() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("scan_jobs")
    .select(
      "id, created_at, user_id, location, category, status, found_count, analyzed_count, error_message, users:user_id(email)",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: JobRow[] = error || !data ? [] : (data as unknown as JobRow[]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      <div>
        <h1 className="text-2xl font-semibold text-on-background">Scan Jobs</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Discovery + pipeline runs. Active in Phase 2+.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-outline-variant bg-surface-container-low">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-surface-container">
            <tr className="border-b border-outline-variant">
              {["Date", "User", "Category", "Location", "Status", "Found", "Analyzed"].map((h) => (
                <th
                  key={h}
                  className="px-stack-md py-3 text-xs font-medium uppercase tracking-wider text-on-surface-variant"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/50">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-stack-md py-stack-xl text-center text-on-surface-variant"
                >
                  No scan jobs yet. Phase 2 activates lead discovery.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="hover:bg-surface-container/50">
                  <td className="px-stack-md py-3 text-on-surface-variant">
                    {new Date(r.created_at).toISOString().slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="px-stack-md py-3 text-on-surface">{r.users?.email ?? "—"}</td>
                  <td className="px-stack-md py-3 text-on-surface">{r.category ?? "—"}</td>
                  <td className="px-stack-md py-3 text-on-surface-variant">{r.location ?? "—"}</td>
                  <td className="px-stack-md py-3 text-on-surface">{r.status ?? "—"}</td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>
                    {r.found_count ?? 0}
                  </td>
                  <td className="px-stack-md py-3 text-right font-mono text-on-surface" data-mono>
                    {r.analyzed_count ?? 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
