import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type ProviderReadiness = {
  provider: string;
  credentialsConfigured: boolean;
  timeoutMs: number;
};

export function ProviderReadinessCard({ provider }: { provider: ProviderReadiness }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Provider readiness</CardTitle>
        <CardDescription>
          Discovery fails closed if required credentials are not configured.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-stack-sm text-body-sm">
        <Row label="Provider">
          <Badge variant="neutral">{provider.provider}</Badge>
        </Row>
        <Row label="Credentials">
          <Badge variant={provider.credentialsConfigured ? "success" : "warning"}>
            {provider.credentialsConfigured ? "configured" : "missing"}
          </Badge>
        </Row>
        <Row label="Timeout">
          <span className="font-medium text-on-surface">{provider.timeoutMs}ms</span>
        </Row>
      </CardContent>
    </Card>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-outline-variant/40 bg-surface-container-low p-3">
      <span className="text-on-surface-variant">{label}</span>
      {children}
    </div>
  );
}
