import Link from "next/link";
import { Sparkles } from "lucide-react";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

type PromptRow = {
  id: string;
  business_id: string;
  prompt_body: string;
  target_tool: "claude" | "cursor" | null;
  updated_at: string;
  businesses: {
    name: string;
    category: string | null;
    city: string | null;
  } | null;
};

async function loadBuildPrompts(): Promise<PromptRow[]> {
  const user = await getCurrentUser();
  if (!user) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("build_prompts")
    .select(
      "id, business_id, prompt_body, target_tool, updated_at, businesses!inner(name, category, city, user_id)",
    )
    .eq("businesses.user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error || !data) return [];
  return data as unknown as PromptRow[];
}

export default async function PromptStudioPage() {
  const prompts = await loadBuildPrompts();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-stack-lg">
      <div className="flex flex-col gap-stack-xs">
        <Badge variant="primary" className="w-fit">
          Build Prompts
        </Badge>
        <h1 className="text-3xl font-semibold text-on-surface">Prompt Studio</h1>
        <p className="max-w-2xl text-body-md text-on-surface-variant">
          IDE-ready build prompts generated per opportunity. Open a business report and run the
          pipeline to populate this page.
        </p>
      </div>

      {prompts.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No build prompts yet"
          body="Run the AI pipeline on an opportunity to generate a Claude/Cursor build prompt."
          ctaLabel="Browse opportunities"
          ctaHref="/dashboard/opportunities"
        />
      ) : (
        <div className="grid gap-gutter">
          {prompts.map((row) => (
            <Card key={row.id}>
              <CardHeader className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
                <div>
                  <CardTitle>{row.businesses?.name ?? "Unknown business"}</CardTitle>
                  <CardDescription>
                    {[row.businesses?.category, row.businesses?.city]
                      .filter(Boolean)
                      .join(" · ") || "Local business"}
                  </CardDescription>
                </div>
                <Badge variant="secondary">{row.target_tool ?? "claude"}</Badge>
              </CardHeader>
              <CardContent className="grid gap-stack-sm">
                <p className="line-clamp-3 whitespace-pre-wrap text-body-sm text-on-surface-variant">
                  {row.prompt_body}
                </p>
                <Link
                  href={`/dashboard/business/${row.business_id}`}
                  className="w-fit text-body-sm font-medium text-primary hover:underline"
                >
                  Open business report →
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
