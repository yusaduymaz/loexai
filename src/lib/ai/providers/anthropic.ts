import "server-only";

import type { z } from "zod";

import { parseStructuredJson, structuredJsonInstruction } from "@/lib/ai/json";
import type { AIProviderAdapter, AIProviderResult, GenerateOptions } from "@/lib/ai/types";

type AnthropicResponse = {
  content?: Array<{ type: string; text?: string }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export class AnthropicProvider implements AIProviderAdapter {
  constructor(
    private readonly config: {
      apiKey: string;
      model: string;
      cheapModel: string;
      timeoutMs: number;
    },
  ) {}

  async generateRaw<T>(
    prompt: string,
    schema: z.ZodSchema<T>,
    options?: GenerateOptions,
  ): Promise<AIProviderResult<T>> {
    const model = options?.tier === "cheap" ? this.config.cheapModel : this.config.model;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": this.config.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1200,
        messages: [
          {
            role: "user",
            content: structuredJsonInstruction(prompt),
          },
        ],
      }),
      signal: AbortSignal.timeout(this.config.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Anthropic request failed (${response.status}): ${await response.text()}`);
    }

    const payload = (await response.json()) as AnthropicResponse;
    const content = payload.content?.find((block) => block.type === "text")?.text;
    if (!content) throw new Error("Anthropic response did not include text content.");

    return {
      data: parseStructuredJson(content, schema),
      usage: {
        provider: "anthropic",
        model,
        inputTokens: payload.usage?.input_tokens ?? estimateTokens(prompt),
        outputTokens: payload.usage?.output_tokens ?? estimateTokens(content),
        costUsd: 0,
      },
    };
  }
}

function estimateTokens(value: string) {
  return Math.ceil(value.length / 4);
}
