import { Bookmark } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function SavedLeadsComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<Bookmark className="h-12 w-12" aria-hidden="true" />}
      title="Saved Leads"
      phase="Phase 2"
      body="Pin businesses you want to come back to — review later or push to a campaign."
    />
  );
}
