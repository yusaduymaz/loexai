import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { stripe } from "@/lib/payments/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireEnvGroup } from "@/lib/config/server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get("stripe-signature") || "";

  let event;
  try {
    const { STRIPE_WEBHOOK_SECRET } = requireEnvGroup("stripe");
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`Webhook signature verification failed: ${errMsg}`);
    return new Response(`Webhook Error: ${errMsg}`, { status: 400 });
  }

  const admin = createAdminClient();

  // 1. Attempt to log the event ID for idempotency (Unique Constraint)
  const { error: insertError } = await admin
    .from("stripe_webhook_events")
    .insert({
      id: event.id,
      type: event.type,
      processed: false,
    });

  if (insertError) {
    // 23505 is PostgreSQL unique constraint violation error code
    if (insertError.code === "23505") {
      console.log(`Duplicate Stripe event received: ${event.id}. Skipping.`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    console.error(`Error saving webhook event ${event.id}:`, insertError);
    return NextResponse.json({ error: "Failed to log event" }, { status: 500 });
  }

  // 2. Process the event in the database using the atomic RPC function
  const { data: rpcResult, error: rpcError } = await admin.rpc("handle_stripe_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_data: event.data.object as unknown as Record<string, unknown>,
  });

  if (rpcError) {
    console.error(`Error processing Stripe event ${event.id}:`, rpcError);
    
    // Clean up the logged event so Stripe CLI or Stripe daemon retries can attempt it again
    await admin.from("stripe_webhook_events").delete().eq("id", event.id);
    
    return NextResponse.json({ error: rpcError.message }, { status: 500 });
  }

  console.log(`Stripe event ${event.id} (${event.type}) processed successfully:`, rpcResult);

  return NextResponse.json({ received: true, result: rpcResult }, { status: 200 });
}
