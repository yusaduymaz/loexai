import { getHealthSnapshot } from "@/lib/observability/health";

export const dynamic = "force-dynamic";

export default async function AdminHealthPage() {
  const health = getHealthSnapshot();

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-error">
          Admin · P0
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-on-background md:text-3xl">
          Runtime health
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
          This page shows environment readiness and provider configuration state for
          the current runtime. It is intended as a P0 operator surface before deeper
          job telemetry lands.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        <StatCard label="Status" value={health.status} />
        <StatCard label="AI Provider" value={health.providers.ai} />
        <StatCard label="Discovery Provider" value={health.providers.discovery} />
      </div>

      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
        <h2 className="text-base font-semibold text-on-surface">Service checks</h2>
        <div className="mt-stack-md grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
          {Object.entries(health.checks).map(([name, check]) => (
            <div
              key={name}
              className="rounded-lg border border-outline-variant bg-surface-container p-stack-md"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold capitalize text-on-surface">{name}</h3>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    check.ok
                      ? "bg-green-500/15 text-green-300"
                      : "bg-amber-500/15 text-amber-300"
                  }`}
                >
                  {check.ok ? "configured" : "missing"}
                </span>
              </div>
              <p className="mt-2 text-xs text-on-surface-variant">
                {check.required ? "Required now" : "Optional at current phase"}
              </p>
              {check.missing.length > 0 ? (
                <ul className="mt-3 space-y-1 text-xs text-on-surface-variant">
                  {check.missing.map((item) => (
                    <li key={item} className="font-mono">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs text-on-surface-variant">No missing keys.</p>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-gutter xl:grid-cols-3">
        <ReadinessCard
          title="Workflow"
          rows={[
            ["callbackBaseUrl", health.readiness.workflow.callbackBaseUrl ?? "unset"],
            [
              "publishTokenConfigured",
              String(health.readiness.workflow.publishTokenConfigured),
            ],
            [
              "currentSigningKeyConfigured",
              String(health.readiness.workflow.currentSigningKeyConfigured),
            ],
            [
              "nextSigningKeyConfigured",
              String(health.readiness.workflow.nextSigningKeyConfigured),
            ],
          ]}
        />
        <ReadinessCard
          title="AI"
          rows={[
            ["provider", health.readiness.ai.provider],
            ["credentialsConfigured", String(health.readiness.ai.credentialsConfigured)],
            ["defaultTimeoutMs", String(health.readiness.ai.defaultTimeoutMs)],
            ["model", health.readiness.ai.openRouterFreeModel ?? "runtime-default"],
          ]}
        />
        <ReadinessCard
          title="Discovery"
          rows={[
            ["provider", health.readiness.discovery.provider],
            [
              "credentialsConfigured",
              String(health.readiness.discovery.credentialsConfigured),
            ],
            ["timeoutMs", String(health.readiness.discovery.timeoutMs)],
          ]}
        />
      </section>

      <section className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
        <h2 className="text-base font-semibold text-on-surface">Snapshot</h2>
        <pre className="mt-stack-md overflow-x-auto rounded-lg border border-outline-variant bg-background p-stack-md text-xs text-on-surface-variant">
          {JSON.stringify(health, null, 2)}
        </pre>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
      <p className="text-xs uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-semibold text-on-surface">{value}</p>
    </div>
  );
}

function ReadinessCard({
  title,
  rows,
}: {
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
      <h2 className="text-base font-semibold text-on-surface">{title}</h2>
      <dl className="mt-stack-md space-y-3">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs uppercase tracking-wider text-on-surface-variant">
              {label}
            </dt>
            <dd className="mt-1 break-all font-mono text-sm text-on-surface">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
