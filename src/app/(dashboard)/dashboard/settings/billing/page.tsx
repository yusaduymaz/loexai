import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/get-user";
import { BillingSettingsClient } from "@/components/dashboard/BillingSettingsClient";

export const metadata = {
  title: "Billing & Credits — LoexAI",
  description: "Manage your subscription, credits, and billing settings.",
};

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="px-margin-mobile py-stack-lg md:px-margin-desktop md:py-10">
      <BillingSettingsClient user={user} />
    </div>
  );
}
