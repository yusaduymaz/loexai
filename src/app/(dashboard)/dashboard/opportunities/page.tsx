import { Target } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function OpportunitiesComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<Target className="h-12 w-12" aria-hidden="true" />}
      title="Opportunities"
      phase="Phase 3"
      body="Ranked, scored business opportunities with priority, deal value and close probability."
    />
  );
}
