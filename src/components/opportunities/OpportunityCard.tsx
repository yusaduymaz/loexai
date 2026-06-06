"use client";

import { Check, Loader2, StickyNote, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { deleteLead, saveOpportunityNote } from "@/app/(dashboard)/dashboard/opportunities/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export type OpportunityCardData = {
  id: string;
  business_id: string;
  opportunity_score: number | null;
  priority: "low" | "medium" | "high" | "urgent" | null;
  close_probability: number | null;
  estimated_deal_value_min: number | null;
  estimated_deal_value_max: number | null;
  estimated_deal_value_currency: "USD" | "EUR" | "TRY" | null;
  reasoning: string | null;
  notes: string | null;
  business_name: string | null;
  business_category: string | null;
  business_city: string | null;
  /** Scan that produced this opportunity (most recent if business was rediscovered). */
  scan?: {
    id: string;
    location: string | null;
    category: string | null;
  } | null;
};

export function OpportunityCard({
  opportunity,
  showScanRozeti = true,
}: {
  opportunity: OpportunityCardData;
  showScanRozeti?: boolean;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState(opportunity.notes ?? "");
  const [savedNote, setSavedNote] = useState(opportunity.notes ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    setError(null);
    startTransition(async () => {
      const result = await deleteLead(opportunity.business_id);
      if (result.status === "error") {
        setError(result.message);
        setConfirmingDelete(false);
      }
      // On success the page revalidates and this card disappears.
    });
  }

  function handleSaveNote() {
    setError(null);
    startTransition(async () => {
      const result = await saveOpportunityNote(opportunity.id, noteDraft);
      if (result.status === "error") {
        setError(result.message);
        return;
      }
      setSavedNote(noteDraft.trim());
      setNoteOpen(false);
    });
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-stack-sm md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-stack-xs">
          <CardTitle>{opportunity.business_name ?? "Unknown business"}</CardTitle>
          <CardDescription>
            {[opportunity.business_category, opportunity.business_city].filter(Boolean).join(" · ") ||
              "Local business"}
          </CardDescription>
          {showScanRozeti && opportunity.scan ? (
            <Link
              href={`/dashboard/discovery/${opportunity.scan.id}`}
              className="w-fit rounded-full border border-outline-variant/40 bg-surface-container-low px-2 py-0.5 text-[11px] uppercase tracking-wide text-on-surface-variant hover:border-primary/40 hover:text-primary"
            >
              from: {opportunity.scan.category ?? "scan"}
              {opportunity.scan.location ? ` · ${opportunity.scan.location}` : ""}
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={priorityVariant(opportunity.priority)}>
            {opportunity.priority ?? "unscored"}
          </Badge>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">
            {opportunity.opportunity_score ?? 0}/100
          </span>
        </div>
      </CardHeader>
      <CardContent className="grid gap-stack-sm">
        <p className="text-body-sm text-on-surface-variant">
          {opportunity.reasoning ?? "No reasoning recorded."}
        </p>
        <div className="flex flex-wrap gap-3 text-body-sm text-on-surface-variant">
          <span>
            Close probability:{" "}
            <strong className="text-on-surface">
              {Math.round((opportunity.close_probability ?? 0) * 100)}%
            </strong>
          </span>
          <span>
            Est. value:{" "}
            <strong className="text-on-surface">
              {opportunity.estimated_deal_value_currency ?? "USD"}{" "}
              {opportunity.estimated_deal_value_min ?? 0}-
              {opportunity.estimated_deal_value_max ?? 0}
            </strong>
          </span>
        </div>

        {savedNote && !noteOpen ? (
          <p className="rounded-lg border border-outline-variant/30 bg-surface-container-low px-3 py-2 text-body-sm text-on-surface-variant">
            <span className="mr-1 font-medium text-on-surface">Note:</span>
            {savedNote}
          </p>
        ) : null}

        {noteOpen ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              maxLength={2000}
              rows={3}
              placeholder="Add a note about this lead…"
              className="w-full resize-y rounded-lg border border-outline-variant/40 bg-surface-container-low px-3 py-2 text-body-sm text-on-surface placeholder:text-on-surface-variant/60 focus:border-primary/60 focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <Button size="sm" variant="primary" onClick={handleSaveNote} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Kaydet
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setNoteOpen(false);
                  setNoteDraft(savedNote);
                }}
                disabled={isPending}
              >
                Vazgeç
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-body-sm text-error">{error}</p> : null}

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/dashboard/business/${opportunity.business_id}`}
            className="text-body-sm font-medium text-primary hover:underline"
          >
            Open business report →
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {!noteOpen ? (
              <Button size="sm" variant="ghost" onClick={() => setNoteOpen(true)} disabled={isPending}>
                <StickyNote className="h-4 w-4" />
                {savedNote ? "Notu düzenle" : "Not al"}
              </Button>
            ) : null}

            {confirmingDelete ? (
              <div className="flex items-center gap-2">
                <span className="text-body-sm text-on-surface-variant">Emin misiniz?</span>
                <Button size="sm" variant="destructive" onClick={handleDelete} disabled={isPending}>
                  {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Evet, sil
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmingDelete(false)}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                  Vazgeç
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmingDelete(true)}
                disabled={isPending}
                className="text-error hover:text-error"
              >
                <Trash2 className="h-4 w-4" />
                Sil
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function priorityVariant(priority: OpportunityCardData["priority"]) {
  if (priority === "urgent" || priority === "high") return "danger";
  if (priority === "medium") return "warning";
  if (priority === "low") return "neutral";
  return "neutral";
}
