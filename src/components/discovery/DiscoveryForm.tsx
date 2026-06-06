"use client";

import { Loader2, Search } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { toast } from "sonner";

import {
  launchDiscoveryScan,
  type DiscoveryFormState,
} from "@/app/(dashboard)/dashboard/discovery/actions";

const INITIAL_DISCOVERY_FORM_STATE: DiscoveryFormState = { status: "idle" };
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ScanQuota } from "@/lib/billing/plan";
import { cn } from "@/lib/utils";

const PRESETS = [
  { label: "Restaurants · 5km", category: "restaurant", radiusM: 5000 },
  { label: "Dentists · 5km", category: "dentist", radiusM: 5000 },
  { label: "Hair salons · 3km", category: "hair salon", radiusM: 3000 },
  { label: "Gyms · 5km", category: "gym", radiusM: 5000 },
] as const;

export function DiscoveryForm({
  defaultLocation,
  scanQuota,
  maxLeadsPerScan,
  isAdmin,
}: {
  defaultLocation?: string;
  scanQuota: ScanQuota;
  maxLeadsPerScan: number;
  isAdmin: boolean;
}) {
  // Admins bypass the cap in the RPC; reflect that in the UI so the message
  // doesn't lie about "0 remaining" when admins can still scan.
  const capExhausted = !isAdmin && scanQuota.remaining <= 0;
  const [state, formAction] = useFormState<DiscoveryFormState, FormData>(
    launchDiscoveryScan,
    INITIAL_DISCOVERY_FORM_STATE,
  );

  const formRef = useRef<HTMLFormElement | null>(null);
  const categoryRef = useRef<HTMLInputElement | null>(null);
  const radiusRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (state.status === "error") {
      toast.error(state.message);
    }
  }, [state]);

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    if (categoryRef.current) categoryRef.current.value = preset.category;
    if (radiusRef.current) radiusRef.current.value = String(preset.radiusM);
  };

  const fieldErrors = state.status === "error" ? state.fieldErrors ?? {} : {};

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
            <Search className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <CardTitle>Start a scan</CardTitle>
            <CardDescription>
              Pick a preset or fill in your own — results stream into the pipeline live.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              className="rounded-full border border-outline-variant/40 bg-surface-container-low px-3 py-1 text-body-sm text-on-surface-variant transition-colors hover:border-primary/40 hover:text-primary"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <form ref={formRef} action={formAction} className="grid gap-stack-md">
          <div className="grid gap-stack-xs">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              placeholder="Kadıköy, İstanbul"
              defaultValue={defaultLocation}
              required
              minLength={2}
              maxLength={120}
              aria-invalid={Boolean(fieldErrors.location)}
              className={cn(fieldErrors.location && "border-error focus-visible:border-error")}
            />
            {fieldErrors.location ? (
              <p className="text-body-sm text-error">{fieldErrors.location}</p>
            ) : null}
          </div>

          <div className="grid gap-stack-xs">
            <Label htmlFor="category">Business category</Label>
            <Input
              id="category"
              ref={categoryRef}
              name="category"
              placeholder="restaurants, dentists, gyms"
              required
              minLength={2}
              maxLength={80}
              aria-invalid={Boolean(fieldErrors.category)}
              className={cn(fieldErrors.category && "border-error focus-visible:border-error")}
            />
            {fieldErrors.category ? (
              <p className="text-body-sm text-error">{fieldErrors.category}</p>
            ) : null}
          </div>

          <div className="grid gap-stack-xs">
            <Label htmlFor="radiusM">Radius, meters</Label>
            <Input
              id="radiusM"
              ref={radiusRef}
              name="radiusM"
              type="number"
              min={500}
              max={50000}
              step={500}
              defaultValue={5000}
              required
              aria-invalid={Boolean(fieldErrors.radiusM)}
              className={cn(fieldErrors.radiusM && "border-error focus-visible:border-error")}
            />
            {fieldErrors.radiusM ? (
              <p className="text-body-sm text-error">{fieldErrors.radiusM}</p>
            ) : null}
          </div>

          <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-3 text-body-sm text-on-surface-variant">
            {isAdmin ? (
              <p>
                <span className="font-medium text-on-surface">Admin</span> · scan cap bypassed.
                Up to <span className="font-medium text-on-surface">{maxLeadsPerScan}</span> leads
                per scan.
              </p>
            ) : (
              <p>
                Free plan ·{" "}
                <span className="font-medium text-on-surface">
                  {scanQuota.remaining}/{scanQuota.cap}
                </span>{" "}
                scans left this month · up to{" "}
                <span className="font-medium text-on-surface">{maxLeadsPerScan}</span> leads per
                scan
              </p>
            )}
          </div>

          {capExhausted ? (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-body-sm text-amber-200">
              You have used all {scanQuota.cap} free scans this month. Quota resets on the 1st.
            </p>
          ) : null}

          <SubmitButton disabled={capExhausted} />
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  const isBusy = pending;
  return (
    <Button type="submit" disabled={disabled || isBusy} className="w-fit">
      {isBusy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Launching scan…
        </>
      ) : (
        <>
          <Search className="h-4 w-4" aria-hidden="true" />
          Launch discovery scan
        </>
      )}
    </Button>
  );
}
