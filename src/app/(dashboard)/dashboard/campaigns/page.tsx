import { Megaphone } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function CampaignsComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<Megaphone className="h-12 w-12" aria-hidden="true" />}
      title="Campaigns"
      phase="Phase 4"
      body="Outreach campaigns built from generated sales strategies — cold email, DM, WhatsApp."
    />
  );
}
