import { FileText } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

/**
 * Phase 4 placeholder for the business detail report.
 *
 * The dynamic `[id]` segment is preserved so the route exists and deep-linked
 * IDs from later phases will land here cleanly. Phase 1 intentionally does
 * NOT query the database — there is no `businesses` row yet.
 */
export default function BusinessReportPlaceholderPage({
  params: _params,
}: {
  params: { id: string };
}) {
  return (
    <ComingSoonShell
      icon={<FileText className="h-12 w-12" aria-hidden="true" />}
      title="Business Report"
      phase="Phase 4"
      body="Detailed business report with digital presence, gap analysis, opportunity score, recommended solution, sales strategy, and build prompt."
    />
  );
}
