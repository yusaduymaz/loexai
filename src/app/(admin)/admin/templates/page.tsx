import {
  CATEGORY_SIGNAL_MAP,
  DEFAULT_SIGNALS,
  TEMPLATE_VERSION,
} from "@/lib/intelligence/templates";
import { FORMULA_VERSION, SCORE_WEIGHTS } from "@/lib/intelligence/scoring";

export default function AdminTemplatesPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-stack-lg">
      {/* Section A — Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-on-background">Industry Templates</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Live view from lib/intelligence/templates.ts · version: {TEMPLATE_VERSION}
        </p>
        <p className="mt-0.5 text-xs text-on-surface-variant">
          Gap detection signals expected per category. Read-only. Edit lib/intelligence/templates.ts to update.
        </p>
      </div>

      {/* Section B — Category signal cards */}
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 xl:grid-cols-3">
        {Object.entries(CATEGORY_SIGNAL_MAP).map(([category, signals]) => (
          <article
            key={category}
            className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg"
          >
            <h2 className="text-lg font-semibold text-on-surface">
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </h2>
            <ul className="mt-stack-md flex flex-col gap-1.5">
              {signals.map((signal) => (
                <li key={signal} className="flex items-start gap-2 text-sm text-on-surface">
                  <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {signal}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      {/* Section C — Default signals card */}
      <div>
        <article className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
          <h2 className="text-lg font-semibold text-on-surface">Default (unmatched categories)</h2>
          <ul className="mt-stack-md flex flex-col gap-1.5">
            {DEFAULT_SIGNALS.map((signal) => (
              <li key={signal} className="flex items-start gap-2 text-sm text-on-surface">
                <span aria-hidden="true" className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                {signal}
              </li>
            ))}
          </ul>
        </article>
      </div>

      {/* Section D — Scoring formula section */}
      <div className="rounded-xl border border-outline-variant bg-surface-container-low p-stack-lg">
        <h2 className="text-lg font-semibold text-on-surface">Scoring Formula</h2>
        <p className="mt-1 text-sm text-on-surface-variant">Formula version: {FORMULA_VERSION}</p>
        <div className="mt-stack-md overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline-variant text-left text-on-surface-variant">
                <th className="pb-2 pr-4 font-medium">Component</th>
                <th className="pb-2 pr-4 font-medium">Formula</th>
                <th className="pb-2 text-right font-medium">Max Points</th>
              </tr>
            </thead>
            <tbody>
              {(Object.entries(SCORE_WEIGHTS) as [string, { formula: string; max: number }][]).map(
                ([key, { formula, max }]) => {
                  const displayName =
                    (key.charAt(0).toUpperCase() + key.slice(1))
                      .replace(/([A-Z])/g, " $1")
                      .trim();
                  return (
                    <tr key={key} className="border-b border-outline-variant last:border-0">
                      <td className="py-2 pr-4 text-on-surface">{displayName}</td>
                      <td className="py-2 pr-4 font-mono text-sm text-on-surface">{formula}</td>
                      <td className="py-2 text-right font-mono text-on-surface">{max}</td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
