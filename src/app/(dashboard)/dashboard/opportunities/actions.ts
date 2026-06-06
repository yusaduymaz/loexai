"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth/get-user";
import { logger } from "@/lib/observability/logger";
import { createClient } from "@/lib/supabase/server";

export type ActionResult = { status: "ok" } | { status: "error"; message: string };

const NOTE_MAX = 2000;

/**
 * Delete an entire lead (the business row). FKs cascade to enrichment, gap
 * analysis, opportunity, solution, sales strategy and build prompt. scan_job_items
 * point at the business with ON DELETE SET NULL, so scan jobs survive intact.
 *
 * The server client is service-role (RLS bypassed), so ownership is enforced
 * here with an explicit user_id filter.
 */
export async function deleteLead(businessId: string): Promise<ActionResult> {
  const parsed = z.string().uuid().safeParse(businessId);
  if (!parsed.success) return { status: "error", message: "Invalid lead." };

  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .delete()
    .eq("id", parsed.data)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Failed to delete lead", error, { userId: user.id, businessId: parsed.data });
    return { status: "error", message: "Could not delete this lead." };
  }

  revalidatePath("/dashboard/opportunities");
  return { status: "ok" };
}

/**
 * Delete every lead in a scan group in one statement. Each id is re-checked
 * against user_id so a forged id from another user is a no-op.
 */
export async function deleteScanLeads(businessIds: string[]): Promise<ActionResult> {
  const parsed = z.array(z.string().uuid()).min(1).max(500).safeParse(businessIds);
  if (!parsed.success) return { status: "error", message: "Invalid lead selection." };

  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("businesses")
    .delete()
    .in("id", parsed.data)
    .eq("user_id", user.id);

  if (error) {
    logger.error("Failed to delete scan leads", error, {
      userId: user.id,
      count: parsed.data.length,
    });
    return { status: "error", message: "Could not delete these leads." };
  }

  revalidatePath("/dashboard/opportunities");
  return { status: "ok" };
}

const noteSchema = z.object({
  opportunityId: z.string().uuid(),
  note: z.string().max(NOTE_MAX),
});

/**
 * Save (or clear) the freeform note on an opportunity. opportunities has no
 * user_id, so ownership is verified by joining to the parent business.
 */
export async function saveOpportunityNote(
  opportunityId: string,
  note: string,
): Promise<ActionResult> {
  const parsed = noteSchema.safeParse({ opportunityId, note });
  if (!parsed.success) return { status: "error", message: "Invalid note." };

  const user = await getCurrentUser();
  if (!user) return { status: "error", message: "Not signed in." };

  const supabase = await createClient();

  const { data: owned, error: ownerError } = await supabase
    .from("opportunities")
    .select("id, businesses!inner(user_id)")
    .eq("id", parsed.data.opportunityId)
    .eq("businesses.user_id", user.id)
    .maybeSingle();

  if (ownerError || !owned) {
    return { status: "error", message: "Opportunity was not found." };
  }

  const trimmed = parsed.data.note.trim();
  const { error } = await supabase
    .from("opportunities")
    .update({ notes: trimmed.length > 0 ? trimmed : null })
    .eq("id", parsed.data.opportunityId);

  if (error) {
    logger.error("Failed to save opportunity note", error, {
      userId: user.id,
      opportunityId: parsed.data.opportunityId,
    });
    return { status: "error", message: "Could not save the note." };
  }

  revalidatePath("/dashboard/opportunities");
  return { status: "ok" };
}
