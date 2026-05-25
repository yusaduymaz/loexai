import "server-only";

import { getServerEnv, requireEnvGroup } from "@/lib/config/server";

export function getAIRuntimeConfig() {
  const env = getServerEnv();

  return {
    provider: env.AI_PROVIDER,
    defaultTimeoutMs: env.AI_DEFAULT_TIMEOUT_MS,
    openRouterFreeModel:
      env.AI_PROVIDER === "openrouter_free" ? env.OPENROUTER_FREE_MODEL : null,
    credentialsConfigured:
      env.AI_PROVIDER === "anthropic"
        ? Boolean(env.ANTHROPIC_API_KEY)
        : Boolean(env.OPENROUTER_API_KEY),
  };
}

export function requireAIRuntimeConfig() {
  const env = getServerEnv();
  const required = requireEnvGroup("ai");

  if (env.AI_PROVIDER === "anthropic") {
    return {
      provider: env.AI_PROVIDER,
      timeoutMs: env.AI_DEFAULT_TIMEOUT_MS,
      apiKey: required.ANTHROPIC_API_KEY ?? "",
      model: env.ANTHROPIC_REASONING_MODEL,
      cheapModel: env.ANTHROPIC_CHEAP_MODEL,
    };
  }

  return {
    provider: env.AI_PROVIDER,
    timeoutMs: env.AI_DEFAULT_TIMEOUT_MS,
    apiKey: required.OPENROUTER_API_KEY ?? "",
    model: required.OPENROUTER_FREE_MODEL ?? env.OPENROUTER_FREE_MODEL,
  };
}
