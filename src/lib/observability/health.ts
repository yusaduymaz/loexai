import "server-only";

import { getAIRuntimeConfig } from "@/lib/ai/config";
import { getPublicEnv } from "@/lib/config/public";
import { getEnvDiagnostics } from "@/lib/config/server";
import { getDiscoveryRuntimeConfig } from "@/lib/discovery/config";
import { getWorkflowRuntimeConfig } from "@/lib/workflow/client";

export function getHealthSnapshot() {
  const publicEnv = getPublicEnv();
  const diagnostics = getEnvDiagnostics();
  const workflow = getWorkflowRuntimeConfig();
  const ai = getAIRuntimeConfig();
  const discovery = getDiscoveryRuntimeConfig();

  const hasRequiredFailures = Object.values(diagnostics.checks).some(
    (check) => check.required && !check.ok,
  );

  return {
    status: hasRequiredFailures ? "degraded" : "ok",
    service: "loexai",
    timestamp: new Date().toISOString(),
    appUrl: publicEnv.NEXT_PUBLIC_APP_URL,
    nodeEnv: diagnostics.nodeEnv,
    providers: diagnostics.providers,
    checks: diagnostics.checks,
    readiness: {
      workflow,
      ai,
      discovery,
    },
    version: process.env.npm_package_version ?? "0.1.0",
    commitSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
  };
}
