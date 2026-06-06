import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getCurrentUser } from "@/lib/auth/get-user";
import { stripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { priceId, mode, plan, creditsToAdd } = body;

    if (!priceId || !mode) {
      return NextResponse.json({ error: "Missing priceId or mode" }, { status: 400 });
    }

    // Lookup existing stripe customer id
    const admin = createAdminClient();
    const { data: dbUser } = await admin
      .from("users")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .maybeSingle();

    const stripeCustomerId = dbUser?.stripe_customer_id || undefined;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      metadata: {
        clerk_user_id: user.clerkUserId,
        user_id: user.id,
        plan: plan || "",
        credits_to_add: creditsToAdd ? String(creditsToAdd) : "",
      },
      success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard`,
    };

    if (stripeCustomerId) {
      sessionParams.customer = stripeCustomerId;
    } else {
      sessionParams.customer_email = user.email;
    }

    // If it's a subscription, we want to attach subscription metadata too so it copies over
    if (mode === "subscription") {
      sessionParams.subscription_data = {
        metadata: {
          clerk_user_id: user.clerkUserId,
          user_id: user.id,
          plan: plan || "",
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Something went wrong" },
      { status: 500 }
    );
  }
}
