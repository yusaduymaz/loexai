"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import {
  generateBuildPrompt,
  generateQAResult,
  generateSalesStrategy,
} from "@/lib/ai/generation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

const formSchema = z.object({
  businessId: z.string().uuid(),
});

export async function generateAiAssetsForBusiness(formData: FormData) {
  const parsed = formSchema.safeParse({
    businessId: formData.get("businessId"),
  });

  if (!parsed.success) {
    redirect("/dashboard/opportunities");
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", parsed.data.businessId)
    .eq("user_id", user.id)
    .single();

  if (!business) {
    redirect("/dashboard/opportunities");
  }

  const [{ data: enrichment }, { data: gapAnalysis }, { data: opportunity }] =
    await Promise.all([
      supabase.from("business_enrichments").select("*").eq("business_id", business.id).maybeSingle(),
      supabase.from("gap_analyses").select("*").eq("business_id", business.id).maybeSingle(),
      supabase.from("opportunities").select("*").eq("business_id", business.id).maybeSingle(),
    ]);

  if (!opportunity) {
    redirect(`/dashboard/business/${business.id}?error=Run deterministic analysis first.`);
  }

  const factPack = JSON.stringify(
    {
      business: {
        name: business.name,
        category: business.category,
        city: business.city,
        country: business.country,
        website: business.website,
        rating: business.rating,
        reviewCount: business.review_count,
      },
      enrichment,
      gaps: gapAnalysis,
      opportunity,
    },
    null,
    2,
  );

  const sales = await generateSalesStrategy(
    `Create sales assets for this local business using only the facts below. Do not invent claims.

${factPack}`,
    {
      userId: user.id,
      businessId: business.id,
      stage: "sales_strategy",
    },
  );

  const { data: salesRow, error: salesError } = await supabase
    .from("sales_strategies")
    .upsert(
      {
        business_id: business.id,
        opportunity_id: opportunity.id,
        short_pitch: sales.shortPitch,
        cold_email: sales.coldEmail,
        instagram_dm: sales.instagramDm,
        whatsapp_message: sales.whatsappMessage,
        discovery_call_opener: sales.discoveryCallOpener,
        objection_handling: sales.objectionHandling as unknown as Json,
        proposal_summary: sales.proposalSummary,
        value_proposition: sales.valueProposition,
      },
      { onConflict: "opportunity_id" },
    )
    .select("id")
    .single();

  if (salesError) throw salesError;

  const buildPrompt = await generateBuildPrompt(
    `Create an implementation-ready build prompt for an agency/developer to solve this business's digital gaps.
Use the facts below only. Include concrete scope, pages/features, acceptance criteria, and constraints.

${factPack}`,
    {
      userId: user.id,
      businessId: business.id,
      stage: "build_prompt",
    },
  );

  const { data: buildPromptRow, error: buildPromptError } = await supabase
    .from("build_prompts")
    .upsert(
      {
        business_id: business.id,
        opportunity_id: opportunity.id,
        prompt_body: buildPrompt.promptBody,
        target_tool: buildPrompt.targetTool,
        tech_stack: buildPrompt.techStack as unknown as Json,
      },
      { onConflict: "opportunity_id" },
    )
    .select("id")
    .single();

  if (buildPromptError) throw buildPromptError;

  const qa = await generateQAResult(
    `Validate whether the generated sales strategy and build prompt are grounded in the deterministic facts.
Return warnings for any unsupported claim.

Facts:
${factPack}

Sales strategy:
${JSON.stringify(sales, null, 2)}

Build prompt:
${JSON.stringify(buildPrompt, null, 2)}`,
    {
      userId: user.id,
      businessId: business.id,
      stage: "qa",
    },
  );

  await supabase.from("qa_results").insert({
    business_id: business.id,
    opportunity_id: opportunity.id,
    validator_version: "qa-ai-v1",
    status: qa.status,
    confidence: qa.confidence,
    checks: qa.checks as unknown as Json,
    issues: qa.issues as unknown as Json,
    evidence: [
      { type: "sales_strategy", id: salesRow.id },
      { type: "build_prompt", id: buildPromptRow.id },
    ] as Json,
  });

  redirect(`/dashboard/business/${business.id}?generated=1`);
}
