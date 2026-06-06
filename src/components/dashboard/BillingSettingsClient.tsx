"use client";

import { useState } from "react";
import { CreditCard, Coins, Check, AlertCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/types/domain";

type Props = {
  user: AuthUser;
};

const PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || "price_pro_mock";
const PRICE_AGENCY = process.env.NEXT_PUBLIC_STRIPE_PRICE_AGENCY || "price_agency_mock";
const PRICE_TOPUP_50 = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_50 || "price_topup_50_mock";
const PRICE_TOPUP_150 = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_150 || "price_topup_150_mock";
const PRICE_TOPUP_500 = process.env.NEXT_PUBLIC_STRIPE_PRICE_TOPUP_500 || "price_topup_500_mock";

export function BillingSettingsClient({ user }: Props) {
  const [loadingPriceId, setLoadingPriceId] = useState<string | null>(null);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (priceId: string, mode: "subscription" | "payment", plan?: string, creditsToAdd?: number) => {
    try {
      setLoadingPriceId(priceId);
      setError(null);
      
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, mode, plan, creditsToAdd }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to initiate checkout");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoadingPriceId(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      setLoadingPortal(true);
      setError(null);

      const res = await fetch("/api/portal/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to open customer portal");
      }

      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to connect to billing portal. Make sure you have an active customer profile.");
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="font-display-lg text-3xl font-bold text-on-background">Billing & Credits</h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          Manage your subscription plan, check credit usage, and buy top-ups.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-lg bg-error-container/20 border border-error/30 p-4 text-error text-sm">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Credit Summary Card */}
      <div className="relative overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low p-6 shadow-sm">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-sm font-semibold tracking-wider text-secondary uppercase">Your Balance</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-on-surface font-mono">{user.credits}</span>
              <span className="text-body-sm text-on-surface-variant font-medium">total credits remaining</span>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-xs text-on-surface-variant">
              <div>
                <span className="font-semibold text-on-surface font-mono">{user.subscriptionCredits}</span> monthly plan credits
              </div>
              <div className="border-l border-outline-variant pl-6">
                <span className="font-semibold text-on-surface font-mono">{user.topupCredits}</span> purchased top-ups
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {user.plan !== "free" ? (
              <Button
                variant="outline"
                onClick={handleManageBilling}
                disabled={loadingPortal}
                className="flex items-center justify-center gap-2 border-outline-variant text-on-surface hover:bg-surface-container"
              >
                {loadingPortal ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Manage Billing & Invoices
              </Button>
            ) : (
              <p className="text-xs text-on-surface-variant/80 max-w-xs self-center">
                Upgrade to a Pro or Agency subscription below to gain access to Stripe&apos;s Customer Portal.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subscriptions Grid */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-on-background">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan */}
          <div className={`flex flex-col rounded-xl border p-6 bg-surface-container-lowest ${user.plan === "free" ? "border-secondary ring-1 ring-secondary" : "border-outline-variant/30"}`}>
            <h3 className="text-lg font-bold text-on-surface">Starter</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-on-surface">$0</span>
              <span className="text-xs text-on-surface-variant">/mo</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 min-h-8">Free tier — explore the engine with 20 credits.</p>
            <ul className="mt-6 flex-1 space-y-2 text-xs text-on-surface">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-outline" /> 20 initial credits
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-outline" /> Lead discovery & enrichment
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-outline" /> Gap analysis & scoring
              </li>
            </ul>
            <div className="mt-6">
              {user.plan === "free" ? (
                <Button disabled className="w-full bg-secondary/20 text-secondary border border-secondary/30">Active Plan</Button>
              ) : (
                <Button variant="outline" onClick={handleManageBilling} disabled={loadingPortal} className="w-full">Downgrade (via Portal)</Button>
              )}
            </div>
          </div>

          {/* Pro Plan */}
          <div className={`relative flex flex-col rounded-xl border p-6 bg-surface-container-lowest ${user.plan === "pro" ? "border-primary ring-2 ring-primary" : "border-outline-variant/30"}`}>
            <div className="absolute -top-3 right-4 rounded-full bg-primary px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-on-primary">
              Popular
            </div>
            <h3 className="text-lg font-bold text-primary">Pro</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-on-surface">$49</span>
              <span className="text-xs text-on-surface-variant">/mo</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 min-h-8">For freelancers running outreach at volume.</p>
            <ul className="mt-6 flex-1 space-y-2 text-xs text-on-surface">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> <strong>500 credits</strong> / month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Unlimited build prompts
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> Sales strategy generator
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" /> CRM-ready exports
              </li>
            </ul>
            <div className="mt-6">
              {user.plan === "pro" ? (
                <Button disabled className="w-full bg-primary/20 text-primary border border-primary/30">Active Plan</Button>
              ) : user.plan === "agency" ? (
                <Button variant="outline" onClick={handleManageBilling} disabled={loadingPortal} className="w-full">Downgrade (via Portal)</Button>
              ) : (
                <Button
                  onClick={() => handleCheckout(PRICE_PRO, "subscription", "pro")}
                  disabled={loadingPriceId !== null}
                  className="w-full bg-primary text-on-primary hover:bg-primary/90"
                >
                  {loadingPriceId === PRICE_PRO ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subscribe Pro"}
                </Button>
              )}
            </div>
          </div>

          {/* Agency Plan */}
          <div className={`flex flex-col rounded-xl border p-6 bg-surface-container-lowest ${user.plan === "agency" ? "border-secondary ring-2 ring-secondary" : "border-outline-variant/30"}`}>
            <h3 className="text-lg font-bold text-secondary">Agency</h3>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-on-surface">$199</span>
              <span className="text-xs text-on-surface-variant">/mo</span>
            </div>
            <p className="text-xs text-on-surface-variant mt-2 min-h-8">Teams, white-label, and custom workflows.</p>
            <ul className="mt-6 flex-1 space-y-2 text-xs text-on-surface">
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-secondary" /> Everything in Pro
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-secondary" /> <strong>2000 credits</strong> / month
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-secondary" /> 5 team seats (coming soon)
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-4 w-4 text-secondary" /> White-label exports
              </li>
            </ul>
            <div className="mt-6">
              {user.plan === "agency" ? (
                <Button disabled className="w-full bg-secondary/20 text-secondary border border-secondary/30">Active Plan</Button>
              ) : (
                <Button
                  onClick={() => handleCheckout(PRICE_AGENCY, "subscription", "agency")}
                  disabled={loadingPriceId !== null}
                  className="w-full bg-secondary text-on-secondary hover:bg-secondary/90"
                >
                  {loadingPriceId === PRICE_AGENCY ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upgrade Agency"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Credit Top-up Packs */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-on-background">Need More Credits?</h2>
        <p className="text-xs text-on-surface-variant">
          Purchase one-time top-up packs. These credits never expire and are consumed only after your monthly subscription quota runs out.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 50 Credits Pack */}
          <div className="flex flex-col justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 transition-all hover:border-outline-variant">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-on-surface-variant" />
                <h4 className="font-bold text-on-surface">50 Credits</h4>
              </div>
              <p className="text-xs text-on-surface-variant">Best for quick exploratory scans.</p>
              <div className="mt-2 text-2xl font-extrabold text-on-surface">$10</div>
              <p className="text-[10px] text-on-surface-variant/80">20¢ per credit</p>
            </div>
            <Button
              onClick={() => handleCheckout(PRICE_TOPUP_50, "payment", undefined, 50)}
              disabled={loadingPriceId !== null}
              variant="outline"
              className="mt-6 w-full flex items-center justify-center gap-2"
            >
              {loadingPriceId === PRICE_TOPUP_50 ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buy Pack <ArrowRight className="h-3 w-3" /></>}
            </Button>
          </div>

          {/* 150 Credits Pack */}
          <div className="relative flex flex-col justify-between rounded-xl border-2 border-secondary bg-surface-container-low p-6 transition-all shadow-[0_0_20px_rgba(0,217,255,0.05)]">
            <div className="absolute -top-3 right-4 rounded-full bg-secondary px-3 py-0.5 text-[9px] font-bold uppercase tracking-wider text-on-secondary">
              Best Value
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-secondary" />
                <h4 className="font-bold text-on-surface">150 Credits</h4>
              </div>
              <p className="text-xs text-on-surface-variant">Perfect for growing freelancer pipelines.</p>
              <div className="mt-2 text-2xl font-extrabold text-on-surface">$25</div>
              <p className="text-[10px] text-on-surface-variant/80">16.6¢ per credit</p>
            </div>
            <Button
              onClick={() => handleCheckout(PRICE_TOPUP_150, "payment", undefined, 150)}
              disabled={loadingPriceId !== null}
              className="mt-6 w-full bg-secondary text-on-secondary hover:bg-secondary/90 flex items-center justify-center gap-2"
            >
              {loadingPriceId === PRICE_TOPUP_150 ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buy Pack <ArrowRight className="h-3 w-3" /></>}
            </Button>
          </div>

          {/* 500 Credits Pack */}
          <div className="flex flex-col justify-between rounded-xl border border-outline-variant/30 bg-surface-container-low p-6 transition-all hover:border-outline-variant">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-on-surface-variant" />
                <h4 className="font-bold text-on-surface">500 Credits</h4>
              </div>
              <p className="text-xs text-on-surface-variant">For large campaigns and active lead scoring.</p>
              <div className="mt-2 text-2xl font-extrabold text-on-surface">$75</div>
              <p className="text-[10px] text-on-surface-variant/80">15¢ per credit</p>
            </div>
            <Button
              onClick={() => handleCheckout(PRICE_TOPUP_500, "payment", undefined, 500)}
              disabled={loadingPriceId !== null}
              variant="outline"
              className="mt-6 w-full flex items-center justify-center gap-2"
            >
              {loadingPriceId === PRICE_TOPUP_500 ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Buy Pack <ArrowRight className="h-3 w-3" /></>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
