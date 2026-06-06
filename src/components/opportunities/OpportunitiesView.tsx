"use client";

import { ChevronDown, ChevronRight, Loader2, Trash2, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";

import { deleteScanLeads } from "@/app/(dashboard)/dashboard/opportunities/actions";
import { OpportunityCard, type OpportunityCardData } from "@/components/opportunities/OpportunityCard";
import { Button } from "@/components/ui/button";

type Mode = "flat" | "by-scan";

type ScanGroup = {
  scanId: string;
  location: string | null;
  category: string | null;
  items: OpportunityCardData[];
};

const UNGROUPED_KEY = "__ungrouped__";

export function OpportunitiesView({ opportunities }: { opportunities: OpportunityCardData[] }) {
  const [mode, setMode] = useState<Mode>("flat");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupByScan(opportunities), [opportunities]);

  function toggleCollapsed(scanId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(scanId)) next.delete(scanId);
      else next.add(scanId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-stack-md">
      <div className="flex items-center gap-2">
        <span className="text-body-sm text-on-surface-variant">View:</span>
        <ToggleButton active={mode === "flat"} onClick={() => setMode("flat")}>
          Flat
        </ToggleButton>
        <ToggleButton active={mode === "by-scan"} onClick={() => setMode("by-scan")}>
          By scan ({groups.length})
        </ToggleButton>
      </div>

      {mode === "flat" ? (
        <div className="grid gap-gutter">
          {opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-stack-lg">
          {groups.map((group) => (
            <ScanSection
              key={group.scanId}
              group={group}
              isCollapsed={collapsed.has(group.scanId)}
              onToggle={() => toggleCollapsed(group.scanId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ScanSection({
  group,
  isCollapsed,
  onToggle,
}: {
  group: ScanGroup;
  isCollapsed: boolean;
  onToggle: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const title =
    group.scanId === UNGROUPED_KEY
      ? "Unscanned / manual"
      : `${group.category ?? "Scan"}${group.location ? ` · ${group.location}` : ""}`;

  function handleDeleteAll() {
    setError(null);
    startTransition(async () => {
      const result = await deleteScanLeads(group.items.map((i) => i.business_id));
      if (result.status === "error") {
        setError(result.message);
        setConfirming(false);
      }
      // On success the page revalidates and this group disappears.
    });
  }

  return (
    <section className="flex flex-col gap-stack-sm">
      <header className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!isCollapsed}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4 shrink-0 text-on-surface-variant" />
          ) : (
            <ChevronDown className="h-4 w-4 shrink-0 text-on-surface-variant" />
          )}
          <span className="flex flex-col">
            <span className="text-lg font-semibold text-on-surface">{title}</span>
            <span className="text-body-sm text-on-surface-variant">
              {group.items.length} opportunit{group.items.length === 1 ? "y" : "ies"}
            </span>
          </span>
        </button>

        {confirming ? (
          <div className="flex items-center gap-2">
            <span className="text-body-sm text-on-surface-variant">Tümünü silmek üzeresiniz</span>
            <Button size="sm" variant="destructive" onClick={handleDeleteAll} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Evet, tümünü sil
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirming(false)} disabled={isPending}>
              <X className="h-4 w-4" />
              Vazgeç
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirming(true)}
            className="shrink-0 text-error hover:text-error"
          >
            <Trash2 className="h-4 w-4" />
            Tümünü sil
          </Button>
        )}
      </header>

      {error ? <p className="px-1 text-body-sm text-error">{error}</p> : null}

      {!isCollapsed ? (
        <div className="grid gap-gutter">
          {group.items.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} showScanRozeti={false} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function groupByScan(items: OpportunityCardData[]): ScanGroup[] {
  const map = new Map<string, ScanGroup>();

  for (const item of items) {
    const key = item.scan?.id ?? UNGROUPED_KEY;
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      map.set(key, {
        scanId: key,
        location: item.scan?.location ?? null,
        category: item.scan?.category ?? null,
        items: [item],
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-primary/15 px-3 py-1 text-body-sm font-medium text-primary"
          : "rounded-full border border-outline-variant/40 px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
      }
    >
      {children}
    </button>
  );
}
