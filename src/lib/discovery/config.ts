import "server-only";

import { getServerEnv, requireEnvGroup } from "@/lib/config/server";

export function getDiscoveryRuntimeConfig() {
  const env = getServerEnv();

  return {
    provider: env.DISCOVERY_PROVIDER,
    timeoutMs: env.GOOGLE_PLACES_TIMEOUT_MS,
    credentialsConfigured:
      env.DISCOVERY_PROVIDER === "google_places"
        ? Boolean(env.GOOGLE_PLACES_API_KEY)
        : Boolean(env.RAPIDAPI_KEY),
  };
}

export function requireDiscoveryRuntimeConfig() {
  const env = getServerEnv();
  const required = requireEnvGroup("discovery");

  if (env.DISCOVERY_PROVIDER === "google_places") {
    return {
      provider: env.DISCOVERY_PROVIDER,
      timeoutMs: env.GOOGLE_PLACES_TIMEOUT_MS,
      apiKey: required.GOOGLE_PLACES_API_KEY ?? "",
    };
  }

  return {
    provider: env.DISCOVERY_PROVIDER,
    timeoutMs: env.GOOGLE_PLACES_TIMEOUT_MS,
    apiKey: required.RAPIDAPI_KEY ?? "",
  };
}
