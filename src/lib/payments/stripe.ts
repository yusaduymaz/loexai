import "server-only";
import Stripe from "stripe";
import { requireEnvGroup } from "@/lib/config/server";

let stripeInstance: Stripe | null = null;

function getStripeInstance(): Stripe {
  if (!stripeInstance) {
    const { STRIPE_SECRET_KEY } = requireEnvGroup("stripe");
    stripeInstance = new Stripe(STRIPE_SECRET_KEY, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      apiVersion: "2024-06-20" as any,
      typescript: true,
    });
  }
  return stripeInstance;
}

export const stripe = new Proxy({} as Stripe, {
  get(target, prop, receiver) {
    const instance = getStripeInstance();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === "function") {
      return value.bind(instance);
    }
    return value;
  },
});
