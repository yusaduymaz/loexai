import type { z } from "zod";

/**
 * AIProvider interface skeleton (Phase 3 implements).
 *
 * Two concrete providers will land in Phase 3:
 *   - `OpenRouterProvider` — dev/test, free-tier models (pinned via
 *     `OPENROUTER_FREE_MODEL`). Rate-limited and may drop responses.
 *   - `AnthropicProvider`  — production, `claude-sonnet` reasoning +
 *     `claude-haiku` cheap classification/QA.
 *
 * Provider selection is env-driven (`AI_PROVIDER`). Upstream code must NEVER
 * import a concrete provider — always go through `getAIProvider()` (also
 * Phase 3, `lib/ai/index.ts`). This keeps swapping providers a one-env-var
 * change (CLAUDE.md §9).
 */
export type ModelTier = "reasoning" | "cheap";

export type AIUsageContext = {
  userId?: string;
  businessId?: string | null;
  scanJobId?: string | null;
  stage: string;
};

export type GenerateOptions = {
  tier?: ModelTier;
  usage?: AIUsageContext;
};

export type AIProviderResult<T> = {
  data: T;
  usage: {
    provider: "anthropic" | "openrouter_free";
    model: string;
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
  };
};

export interface AIProvider {
  /**
   * Generate a JSON-validated response.
   *
   * Implementation MUST:
   *   - log token usage to `ai_usage` (CLAUDE.md §9 / FOUND-07)
   *   - validate the parsed response against `schema` (CLAUDE.md §8)
   *   - throw on validation failure (no silent fallbacks)
   */
  generate<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateOptions,
  ): Promise<T>;
}

export interface AIProviderAdapter {
  generateRaw<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateOptions,
  ): Promise<AIProviderResult<T>>;
}
