import { serve } from "@upstash/workflow/nextjs";

/**
 * Placeholder pipeline workflow.
 *
 * Phase 2+ will add real steps: discovery → enrichment → gap analysis →
 * scoring → recommendation → sales strategy → build prompt → QA. Each step
 * gets its own `context.run("name", async () => ...)` block so Upstash
 * Workflow can checkpoint state and resume after Vercel timeouts.
 *
 * Phase 1 ships an empty workflow so the route is reachable and signature
 * verification is wired. Calling this endpoint in Phase 1 returns the
 * `noop` payload below — it does NOT consume credits or touch the DB.
 */
export const { POST } = serve(async (context) => {
  await context.run("noop", async () => {
    return {
      phase: "1-foundation",
      message: "Pipeline placeholder; no active steps until Phase 2.",
    };
  });
});
