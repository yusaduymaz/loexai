import { Search } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function DiscoveryComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<Search className="h-12 w-12" aria-hidden="true" />}
      title="Lead Discovery"
      phase="Phase 2"
      body="Find local businesses by category and city. Results land directly in your opportunities pipeline."
    />
  );
}
