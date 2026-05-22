import { Settings } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function SettingsComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<Settings className="h-12 w-12" aria-hidden="true" />}
      title="Settings"
      phase="Phase 5"
      body="Account preferences, API keys, and notification settings."
    />
  );
}
