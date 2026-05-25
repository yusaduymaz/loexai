import "server-only";

import type { z } from "zod";

import { parseStructuredJson, structuredJsonInstruction } from "@/lib/ai/json";
import type { AIProviderAdapter, AIProviderResult, GenerateOptions } from "@/lib/ai/types";

type OpenRouterResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
};

export class OpenRouterProvider implements AIProviderAdapter {
  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
      timeoutMs: number;
    },
  ) {}

  async generateRaw<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateOptions,
  ): Promise<AIProviderResult<T>> {
    void options;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.apiKey}`,
        "HTTP-Referer": "https://loex.ai",
        "X-Title": "LoexAI",
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: [
          {
            role: "user",
            content: structuredJsonInstruction(prompt),
          },
        ],
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed (${response.status}): ${await response.text()}`);
    }

    const payload = (await response.json()) as OpenRouterResponse;
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("OpenRouter response did not include message content.");

    return {
      data: parseStructuredJson(content, schema),
      usage: {
        provider: "openrouter_free",
        model: this.config.model,
        inputTokens: payload.usage?.prompt_tokens ?? estimateTokens(prompt),
        outputTokens: payload.usage?.completion_tokens ?? estimateTokens(content),
        costUsd: 0,
      },
    };
  }
}

function estimateTokens(value: string) {
  return Math.ceil(value.length / 4);
}
