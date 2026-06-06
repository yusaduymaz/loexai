"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

const updateCreditsSchema = z.object({
  userId: z.string().uuid(),
  credits: z.coerce.number().int().min(0).max(100000),
});

export async function updateUserCredits(formData: FormData) {
  await requireRole("admin");

  const parsed = updateCreditsSchema.safeParse({
    userId: formData.get("userId"),
    credits: formData.get("credits"),
  });

  if (!parsed.success) {
    redirect("/admin/users?error=Invalid credit update");
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("users")
    .update({ credits: parsed.data.credits })
    .eq("id", parsed.data.userId);

  if (error) {
    redirect(`/admin/users?error=${encodeURIComponent("Could not update credits")}`);
  }

  revalidatePath("/admin/users");
  redirect("/admin/users?updated=credits");
}
