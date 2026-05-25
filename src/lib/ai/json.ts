import "server-only";

import type { z } from "zod";

export function parseStructuredJson<T>(content: string, schema: z.ZodSchema<T>): T {
  const parsed = JSON.parse(extractJsonObject(content));
  return schema.parse(parsed);
}

export function structuredJsonInstruction(prompt: string) {
  return `${prompt}

Return only one valid JSON object. Do not wrap it in markdown. Do not include prose outside JSON.`;
}

function extractJsonObject(content: string) {
  const trimmed = content.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;

  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return trimmed.slice(first, last + 1);
  }

  throw new Error("AI response did not contain a JSON object.");
}
