import { Sparkles } from "lucide-react";

import { ComingSoonShell } from "@/components/dashboard/ComingSoonShell";

export default function PromptStudioComingSoonPage() {
  return (
    <ComingSoonShell
      icon={<Sparkles className="h-12 w-12" aria-hidden="true" />}
      title="Prompt Studio"
      phase="Phase 4"
      body="Generate Claude/Cursor build prompts ready to drop into your IDE."
    />
  );
}
