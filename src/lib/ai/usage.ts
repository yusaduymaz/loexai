import "server-only";

import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import type { AIProviderResult, AIUsageContext } from "@/lib/ai/types";

export async function logAIUsage<T>(
  result: AIProviderResult<T>,
  usage?: AIUsageContext,
) {
  if (!usage?.userId) return;

  const supabase = await createClient();
  const { error } = await supabase.from("ai_usage").insert({
    user_id: usage.userId,
    business_id: usage.businessId ?? null,
    scan_job_id: usage.scanJobId ?? null,
    stage: usage.stage,
    provider: result.usage.provider,
    model: result.usage.model,
    input_tokens: result.usage.inputTokens,
    output_tokens: result.usage.outputTokens,
    cost_usd: result.usage.costUsd,
  });

  if (error) {
    logger.warn("Failed to log AI usage", { error, stage: usage.stage });
  }
}
