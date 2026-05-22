import { Users } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function CrmComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<Users className="h-12 w-12" aria-hidden="true" />}
      title="CRM"
      phase="Phase 5"
      body="Track outreach status — contacted, proposal sent, won, lost — across every business in your pipeline."
    />
  );
}
