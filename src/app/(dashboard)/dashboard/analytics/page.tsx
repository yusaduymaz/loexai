import { BarChart3 } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function AnalyticsComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<BarChart3 className="h-12 w-12" aria-hidden="true" />}
      title="Analytics"
      phase="Phase 5"
      body="Funnel analytics — conversion from discovery to closed deal."
    />
  );
}
