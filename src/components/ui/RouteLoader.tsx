import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Branded loading fallback rendered by `loading.tsx` Suspense boundaries while
 * a route's server components fetch data. Sits inside `<main>`, so the sidebar
 * and header stay visible during the transition.
 */
export function RouteLoader({
  label = "Yükleniyor…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex min-h-[40vh] w-full flex-col items-center justify-center gap-stack-md text-on-surface-variant",
        className,
      )}
    >
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full border border-outline-variant/40" />
        <span className="absolute inset-0 animate-ping-soft rounded-full bg-primary/10" />
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
      </div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
