"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type ReportExportActionsProps = {
  filename: string;
  shareTitle: string;
  text: string;
};

export function ReportExportActions({ filename, shareTitle, text }: ReportExportActionsProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "shared" | "downloaded" | "failed">("idle");
  const [isPending, startTransition] = useTransition();

  function resetStatus(nextStatus: typeof status) {
    setStatus(nextStatus);
    window.setTimeout(() => setStatus("idle"), 2200);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(text);
      resetStatus("copied");
    } catch {
      resetStatus("failed");
    }
  }

  async function shareReport() {
    if (!navigator.share) {
      await copyReport();
      return;
    }

    try {
      await navigator.share({ title: shareTitle, text });
      resetStatus("shared");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      resetStatus("failed");
    }
  }

  function downloadReport() {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    resetStatus("downloaded");
  }

  const statusLabel = {
    idle: "",
    copied: "Copied",
    shared: "Shared",
    downloaded: "Downloaded",
    failed: "Could not complete action",
  }[status];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => startTransition(copyReport)}
          disabled={isPending}
        >
          {status === "copied" ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
          Copy brief
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => startTransition(shareReport)}
          disabled={isPending}
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          Share
        </Button>
        <Button type="button" variant="outline" onClick={downloadReport}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Download .txt
        </Button>
      </div>
      <p className="min-h-5 text-body-sm text-on-surface-variant" aria-live="polite">
        {statusLabel}
      </p>
    </div>
  );
}
