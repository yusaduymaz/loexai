import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SENTRY_DSN: optionalUrl,
  NEXT_PUBLIC_POSTHOG_KEY: optionalString,
  NEXT_PUBLIC_POSTHOG_HOST: optionalUrl,
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;

let publicEnvCache: PublicEnv | null = null;

export function getPublicEnv(): PublicEnv {
  if (publicEnvCache) return publicEnvCache;
  publicEnvCache = publicEnvSchema.parse(process.env);
  return publicEnvCache;
}

export function getPublicAppUrl(): URL {
  return new URL(getPublicEnv().NEXT_PUBLIC_APP_URL);
}
