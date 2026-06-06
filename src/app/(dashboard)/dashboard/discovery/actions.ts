"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/get-user";
import { getPlanLimits } from "@/lib/billing/plan";
import { createDiscoveryProvider } from "@/lib/discovery/provider";
import type { RawBusiness } from "@/lib/discovery/types";
import { runDeterministicIntelligenceForBusiness } from "@/lib/intelligence/pipeline";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";
import type { Json, TablesInsert } from "@/types/database";

export type DiscoveryFormState =
  | { status: "idle" }
  | {
      status: "error";
      message: string;
      fieldErrors?: Partial<Record<"location" | "category" | "radiusM", string>>;
    };

const discoveryFormSchema = z.object({
  location: z.string().trim().min(2, "Location must be at least 2 characters").max(120),
  category: z.string().trim().min(2, "Category must be at least 2 characters").max(80),
  radiusM: z.coerce
    .number()
    .int("Radius must be a whole number")
    .min(500, "Minimum 500 meters")
    .max(50000, "Maximum 50000 meters"),
});

export async function launchDiscoveryScan(
  _prev: DiscoveryFormState,
  formData: FormData,
): Promise<DiscoveryFormState> {
  const parsed = discoveryFormSchema.safeParse({
    location: formData.get("location"),
    category: formData.get("category"),
    radiusM: formData.get("radiusM"),
  });

  if (!parsed.success) {
    const fieldErrors: DiscoveryFormState extends { fieldErrors?: infer F } ? F : never =
      {} as never;
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (key === "location" || key === "category" || key === "radiusM") {
        (fieldErrors as Record<string, string>)[key] = issue.message;
      }
    }
    return {
      status: "error",
      message: "Scan request is invalid. Check location, category, and radius.",
      fieldErrors,
    };
  }

  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const supabase = await createClient();
  const input = parsed.data;
  const limits = getPlanLimits();

  // Atomically reserve a scan slot for the current calendar month. The RPC
  // lazily resets the counter on month rollover; admins bypass the cap.
  // Reserving BEFORE the scan job row keeps the cap honest under concurrency.
  const { data: reservedCount, error: reserveError } = await supabase.rpc(
    "reserve_scan_slot",
    { p_user_id: user.id, p_cap: limits.monthlyScans },
  );

  if (reserveError) {
    logger.error("reserve_scan_slot failed", reserveError, { userId: user.id });
    return { status: "error", message: "Could not check your scan quota." };
  }

  if (reservedCount === -1) {
    return {
      status: "error",
      message: `Free plan limit reached: ${limits.monthlyScans} scans per month. Resets on the 1st.`,
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("scan_jobs")
    .insert({
      user_id: user.id,
      location: input.location,
      category: input.category,
      radius_m: input.radiusM,
      status: "running",
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobError || !job) {
    // The reservation went through but the job row failed. Refund so the user
    // doesn't lose a scan slot to an infrastructure error.
    await supabase.rpc("release_scan_slot", { p_user_id: user.id });
    logger.error("Failed to create scan job", jobError, { userId: user.id });
    return { status: "error", message: "Could not create the scan job." };
  }

  try {
    const provider = createDiscoveryProvider();
    const results = await provider.search({
      ...input,
      maxResults: limits.maxLeadsPerScan,
    });
    const outcome = await persistDiscoveryResults({
      userId: user.id,
      scanJobId: job.id,
      results,
    });

    await supabase
      .from("scan_jobs")
      .update({
        status: outcome.errorCount > 0 ? "partial" : "completed",
        found_count: outcome.foundCount,
        analyzed_count: 0,
        error_count: outcome.errorCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);
  } catch (error) {
    logger.error("Discovery scan failed", error, { userId: user.id, scanJobId: job.id });

    // Refund the reserved slot: the provider failed before producing leads,
    // so the user shouldn't lose a monthly quota to a transient infra error.
    await supabase.rpc("release_scan_slot", { p_user_id: user.id });

    await supabase
      .from("scan_jobs")
      .update({
        status: "failed",
        error_count: 1,
        error_message: error instanceof Error ? error.message : "Unknown discovery error",
        completed_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return {
      status: "error",
      message: error instanceof Error ? error.message : "Discovery provider failed.",
    };
  }

  revalidatePath("/dashboard/discovery");
  redirect(`/dashboard/discovery/${job.id}`);
}

export type AnalyzeJobResult =
  | { status: "ok"; analyzed: number; failed: number }
  | { status: "error"; message: string };

export async function analyzeScanJob(scanJobId: string): Promise<AnalyzeJobResult> {
  const parsed = z.string().uuid().safeParse(scanJobId);
  if (!parsed.success) {
    return { status: "error", message: "Invalid scan job." };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { status: "error", message: "Not signed in." };
  }

  const supabase = await createClient();
  const { data: job, error: jobError } = await supabase
    .from("scan_jobs")
    .select("id")
    .eq("id", parsed.data)
    .eq("user_id", user.id)
    .maybeSingle();

  if (jobError || !job) {
    return { status: "error", message: "Scan job was not found." };
  }

  const { data: items, error: itemsError } = await supabase
    .from("scan_job_items")
    .select("id, business_id, scan_job_id")
    .eq("scan_job_id", parsed.data)
    .in("status", ["queued", "discovered", "failed"])
    .not("business_id", "is", null)
    .limit(10);

  if (itemsError) {
    logger.error("Failed to load scan job items for analysis", itemsError, {
      userId: user.id,
      scanJobId: parsed.data,
    });
    return { status: "error", message: "Could not load scan items for analysis." };
  }

  let analyzed = 0;
  let failed = 0;

  for (const item of items ?? []) {
    if (!item.business_id) continue;

    try {
      await supabase
        .from("scan_job_items")
        .update({ status: "analyzing" })
        .eq("id", item.id);

      await runDeterministicIntelligenceForBusiness({
        userId: user.id,
        businessId: item.business_id,
        scanJobId: item.scan_job_id,
        scanJobItemId: item.id,
      });

      analyzed += 1;
    } catch (error) {
      failed += 1;
      logger.error("Deterministic analysis failed", error, {
        userId: user.id,
        scanJobId: parsed.data,
        scanJobItemId: item.id,
        businessId: item.business_id,
      });

      await supabase
        .from("scan_job_items")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown analysis error",
        })
        .eq("id", item.id);
    }
  }

  const { count: completedCount } = await supabase
    .from("scan_job_items")
    .select("*", { count: "exact", head: true })
    .eq("scan_job_id", parsed.data)
    .eq("status", "completed");

  const { count: failedCount } = await supabase
    .from("scan_job_items")
    .select("*", { count: "exact", head: true })
    .eq("scan_job_id", parsed.data)
    .eq("status", "failed");

  await supabase
    .from("scan_jobs")
    .update({
      analyzed_count: completedCount ?? analyzed,
      error_count: failedCount ?? failed,
      status: failed > 0 ? "partial" : "completed",
    })
    .eq("id", parsed.data);

  revalidatePath("/dashboard/discovery");
  revalidatePath(`/dashboard/discovery/${parsed.data}`);

  return { status: "ok", analyzed, failed };
}

async function persistDiscoveryResults({
  userId,
  scanJobId,
  results,
}: {
  userId: string;
  scanJobId: string;
  results: RawBusiness[];
}) {
  const supabase = await createClient();
  let foundCount = 0;
  let errorCount = 0;

  for (const [index, result] of results.entries()) {
    try {
      const businessId = await upsertBusiness(userId, result);

      const item: TablesInsert<"scan_job_items"> = {
        scan_job_id: scanJobId,
        business_id: businessId,
        provider: "google_places",
        provider_place_id: result.placeId,
        discovery_rank: index + 1,
        status: "queued",
        raw_result: toJson(result),
      };

      const { error: itemError } = await supabase.from("scan_job_items").insert(item);
      if (itemError) throw itemError;

      foundCount += 1;
    } catch (error) {
      errorCount += 1;
      logger.error("Failed to persist discovery result", error, {
        userId,
        scanJobId,
        placeId: result.placeId,
      });
    }
  }

  return { foundCount, errorCount };
}

async function upsertBusiness(userId: string, result: RawBusiness) {
  const supabase = await createClient();

  const { data: existing, error: existingError } = await supabase
    .from("businesses")
    .select("id")
    .eq("user_id", userId)
    .eq("place_id", result.placeId)
    .maybeSingle();

  if (existingError) throw existingError;

  const payload = {
    user_id: userId,
    place_id: result.placeId,
    source: "google_maps" as const,
    name: result.name,
    category: result.category ?? null,
    address: result.address ?? null,
    city: result.city ?? null,
    country: result.country ?? null,
    phone: result.phone ?? null,
    website: result.website ?? null,
    google_maps_url: result.googleMapsUrl ?? null,
    rating: result.rating ?? null,
    review_count: result.reviewCount ?? null,
    opening_hours: toJson(result.openingHours ?? null),
    photos: toJson(result.photos ?? null),
    social_links: toJson(result.socialLinks ?? null),
    raw_data: toJson(result),
  };

  if (existing) {
    const { data, error } = await supabase
      .from("businesses")
      .update(payload)
      .eq("id", existing.id)
      .select("id")
      .single();

    if (error) throw error;
    return data.id;
  }

  const { data, error } = await supabase
    .from("businesses")
    .insert(payload)
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}
