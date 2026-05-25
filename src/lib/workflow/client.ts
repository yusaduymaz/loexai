import "server-only";

import { serve } from "@upstash/workflow/nextjs";
import { getServerEnv, requireEnvGroup } from "@/lib/config/server";

/**
 * Upstash Workflow wrapper (provisioned in Phase 1, USED in Phase 2+).
 *
 * Phase 1 ships only the placeholder route at `app/api/workflow/pipeline/`.
 * No real workflow definitions exist yet — the wrapper exists so Phase 2 can
 * `import { serve } from '@/lib/workflow/client'` without leaking the raw
 * package boundary across the app.
 *
 * Env vars consumed (validated at request time by `@upstash/workflow`):
 *   - `QSTASH_TOKEN` / `UPSTASH_QSTASH_TOKEN` — publish callbacks
 *   - `QSTASH_CURRENT_SIGNING_KEY` / `QSTASH_NEXT_SIGNING_KEY` — verify incoming
 *   - `UPSTASH_WORKFLOW_URL` — base URL the workflow service calls back to.
 *     In dev this is an ngrok tunnel or Vercel preview; localhost won't work
 *     because QStash can't hit it.
 */
export { serve };

export function getWorkflowRuntimeConfig() {
  const env = getServerEnv();

  return {
    callbackBaseUrl: env.UPSTASH_WORKFLOW_URL ?? null,
    currentSigningKeyConfigured: Boolean(env.QSTASH_CURRENT_SIGNING_KEY),
    nextSigningKeyConfigured: Boolean(env.QSTASH_NEXT_SIGNING_KEY),
    publishTokenConfigured: Boolean(env.QSTASH_TOKEN_NORMALIZED),
  };
}

export function requireWorkflowRuntimeConfig() {
  const required = requireEnvGroup("workflow");

  return {
    callbackBaseUrl: required.UPSTASH_WORKFLOW_URL,
    currentSigningKey: required.QSTASH_CURRENT_SIGNING_KEY,
    nextSigningKey: required.QSTASH_NEXT_SIGNING_KEY,
    publishToken: required.QSTASH_TOKEN,
  };
}
