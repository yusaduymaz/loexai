import "server-only";

import { Redis } from "@upstash/redis";
import { requireEnvGroup } from "@/lib/config/server";

/**
 * Lazy Upstash Redis client (provisioned in Phase 1, USED in Phase 2+).
 *
 * Why lazy: env vars are only required when a caller actually issues a Redis
 * command. Phase 1 doesn't read Redis anywhere; if `.env.local` is missing
 * the Upstash keys, the dev build should still come up cleanly. The throw
 * happens only when a caller misuses the wrapper without configuring env.
 *
 * Phase 2 will use this for: AI response cache (CLAUDE.md §9), per-user
 * rate limiting, dedup locks for scan jobs.
 */
let _redis: Redis | null = null;

export function getRedis(): Redis {
  if (_redis) return _redis;

  const { UPSTASH_REDIS_REST_TOKEN: token, UPSTASH_REDIS_REST_URL: url } =
    requireEnvGroup("redis");

  _redis = new Redis({ url, token });
  return _redis;
}
