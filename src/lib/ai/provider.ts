import "server-only";

import type { z } from "zod";

import { requireAIRuntimeConfig } from "@/lib/ai/config";
import { AnthropicProvider } from "@/lib/ai/providers/anthropic";
import { OpenRouterProvider } from "@/lib/ai/providers/openrouter";
import { logAIUsage } from "@/lib/ai/usage";
import type { AIProvider, AIProviderAdapter, GenerateOptions } from "@/lib/ai/types";
import { getServerEnv } from "@/lib/config/server";

class InstrumentedAIProvider implements AIProvider {
  constructor(private readonly adapter: AIProviderAdapter) {}

  async generate<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateOptions,
  ): Promise<T> {
    const retries = getServerEnv().PIPELINE_MAX_RETRIES;
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt += 1) {
      try {
        const result = await this.adapter.generateRaw(prompt, schema, options);
        await logAIUsage(result, options?.usage);
        return result.data;
      } catch (error) {
        lastError = error;
        if (attempt === retries) break;
      }
    }

    throw lastError instanceof Error ? lastError : new Error("AI generation failed.");
  }
}

export function getAIProvider(): AIProvider {
  const config = requireAIRuntimeConfig();

  if (config.provider === "anthropic") {
    return new InstrumentedAIProvider(new AnthropicProvider(config));
  }

  return new InstrumentedAIProvider(new OpenRouterProvider(config));
}
