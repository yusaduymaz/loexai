import "server-only";

import { getAIProvider } from "@/lib/ai/provider";
import {
  buildPromptSchema,
  qaResultSchema,
  salesStrategySchema,
  type BuildPromptOutput,
  type QAResultOutput,
  type SalesStrategyOutput,
} from "@/lib/ai/schemas";
import type { AIUsageContext } from "@/lib/ai/types";

export async function generateSalesStrategy(prompt: string, usage: AIUsageContext) {
  return getAIProvider().generate<SalesStrategyOutput>(prompt, salesStrategySchema, {
    tier: "reasoning",
    usage,
  });
}

export async function generateBuildPrompt(prompt: string, usage: AIUsageContext) {
  return getAIProvider().generate<BuildPromptOutput>(prompt, buildPromptSchema, {
    tier: "reasoning",
    usage,
  });
}

export async function generateQAResult(prompt: string, usage: AIUsageContext) {
  return getAIProvider().generate<QAResultOutput>(prompt, qaResultSchema, {
    tier: "cheap",
    usage,
  });
}
