import "server-only";

import { getPublicEnv } from "@/lib/config/public";
import { getEnvDiagnostics } from "@/lib/config/server";
import { logger } from "@/lib/observability/logger";

declare global {
  // eslint-disable-next-line no-var
  var __loexStartupDiagnosticsLogged: boolean | undefined;
}

export function reportStartupDiagnostics() {
  if (process.env.NODE_ENV === "test") return;
  if (globalThis.__loexStartupDiagnosticsLogged) return;

  const publicEnv = getPublicEnv();
  const diagnostics = getEnvDiagnostics();

  const degradedChecks = Object.entries(diagnostics.checks)
    .filter(([, check]) => !check.ok)
    .map(([name, check]) => ({ name, missing: check.missing, required: check.required }));

  logger.info("startup_diagnostics", {
    appUrl: publicEnv.NEXT_PUBLIC_APP_URL,
    nodeEnv: diagnostics.nodeEnv,
    providers: diagnostics.providers,
    degradedChecks,
  });

  globalThis.__loexStartupDiagnosticsLogged = true;
}

