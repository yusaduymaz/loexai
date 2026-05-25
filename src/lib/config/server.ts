import "server-only";

import { z } from "zod";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().min(1).optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  CLERK_SECRET_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  AI_PROVIDER: z.enum(["openrouter_free", "anthropic"]).default("openrouter_free"),
  ANTHROPIC_API_KEY: optionalString,
  ANTHROPIC_REASONING_MODEL: z.string().min(1).default("claude-sonnet-4-5"),
  ANTHROPIC_CHEAP_MODEL: z.string().min(1).default("claude-haiku-4-5"),
  OPENROUTER_API_KEY: optionalString,
  OPENROUTER_FREE_MODEL: z.string().min(1).default("openai/gpt-oss-120b"),
  DISCOVERY_PROVIDER: z.enum(["google_places", "rapidapi"]).default("google_places"),
  GOOGLE_PLACES_API_KEY: optionalString,
  RAPIDAPI_KEY: optionalString,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  UPSTASH_QSTASH_TOKEN: optionalString,
  QSTASH_TOKEN: optionalString,
  UPSTASH_WORKFLOW_URL: optionalUrl,
  QSTASH_CURRENT_SIGNING_KEY: optionalString,
  QSTASH_NEXT_SIGNING_KEY: optionalString,
  STRIPE_SECRET_KEY: optionalString,
  STRIPE_WEBHOOK_SECRET: optionalString,
  SENTRY_DSN: optionalUrl,
  SENTRY_ORG: optionalString,
  SENTRY_PROJECT: optionalString,
  SENTRY_AUTH_TOKEN: optionalString,
  POSTHOG_KEY: optionalString,
  POSTHOG_HOST: optionalUrl,
  RESEND_API_KEY: optionalString,
  PIPELINE_CONCURRENCY: z.coerce.number().int().positive().default(4),
  PIPELINE_MAX_RETRIES: z.coerce.number().int().nonnegative().default(2),
  AI_DEFAULT_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  GOOGLE_PLACES_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
});

export type ServerEnv = z.infer<typeof serverEnvSchema> & {
  QSTASH_TOKEN_NORMALIZED?: string;
};

type EnvGroup =
  | "supabaseAdmin"
  | "redis"
  | "workflow"
  | "ai"
  | "discovery"
  | "stripe"
  | "observability";

type EnvGroupMap = {
  supabaseAdmin: {
    SUPABASE_SERVICE_ROLE_KEY: string;
  };
  redis: {
    UPSTASH_REDIS_REST_URL: string;
    UPSTASH_REDIS_REST_TOKEN: string;
  };
  workflow: {
    QSTASH_TOKEN: string;
    UPSTASH_WORKFLOW_URL: string;
    QSTASH_CURRENT_SIGNING_KEY: string;
    QSTASH_NEXT_SIGNING_KEY: string;
  };
  ai: {
    [key: string]: string;
  };
  discovery: {
    [key: string]: string;
  };
  stripe: {
    STRIPE_SECRET_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
  };
  observability: {
    SENTRY_DSN: string;
  };
};

let serverEnvCache: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (serverEnvCache) return serverEnvCache;

  const parsed = serverEnvSchema.parse(process.env);
  serverEnvCache = {
    ...parsed,
    QSTASH_TOKEN_NORMALIZED: parsed.UPSTASH_QSTASH_TOKEN ?? parsed.QSTASH_TOKEN,
  };
  return serverEnvCache;
}

export function requireEnvGroup<T extends EnvGroup>(group: T): EnvGroupMap[T] {
  const env = getServerEnv();

  const groups: Record<EnvGroup, Array<[string, string | undefined]>> = {
    supabaseAdmin: [["SUPABASE_SERVICE_ROLE_KEY", env.SUPABASE_SERVICE_ROLE_KEY]],
    redis: [
      ["UPSTASH_REDIS_REST_URL", env.UPSTASH_REDIS_REST_URL],
      ["UPSTASH_REDIS_REST_TOKEN", env.UPSTASH_REDIS_REST_TOKEN],
    ],
    workflow: [
      ["QSTASH_TOKEN", env.QSTASH_TOKEN_NORMALIZED],
      ["UPSTASH_WORKFLOW_URL", env.UPSTASH_WORKFLOW_URL],
      ["QSTASH_CURRENT_SIGNING_KEY", env.QSTASH_CURRENT_SIGNING_KEY],
      ["QSTASH_NEXT_SIGNING_KEY", env.QSTASH_NEXT_SIGNING_KEY],
    ],
    ai: env.AI_PROVIDER === "anthropic"
      ? [["ANTHROPIC_API_KEY", env.ANTHROPIC_API_KEY]]
      : [
          ["OPENROUTER_API_KEY", env.OPENROUTER_API_KEY],
          ["OPENROUTER_FREE_MODEL", env.OPENROUTER_FREE_MODEL],
        ],
    discovery: env.DISCOVERY_PROVIDER === "google_places"
      ? [["GOOGLE_PLACES_API_KEY", env.GOOGLE_PLACES_API_KEY]]
      : [["RAPIDAPI_KEY", env.RAPIDAPI_KEY]],
    stripe: [
      ["STRIPE_SECRET_KEY", env.STRIPE_SECRET_KEY],
      ["STRIPE_WEBHOOK_SECRET", env.STRIPE_WEBHOOK_SECRET],
    ],
    observability: [["SENTRY_DSN", env.SENTRY_DSN]],
  };

  const missing = groups[group].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required env for ${group}: ${missing.join(", ")}`);
  }

  return Object.fromEntries(
    groups[group].map(([key, value]) => [key, value ?? ""]),
  ) as EnvGroupMap[T];
}

export function getEnvDiagnostics() {
  const env = getServerEnv();

  const checks = {
    foundation: {
      required: true,
      ok: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
      missing: env.SUPABASE_SERVICE_ROLE_KEY ? [] : ["SUPABASE_SERVICE_ROLE_KEY"],
    },
    redis: {
      required: false,
      ok: Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN),
      missing: [
        ...(env.UPSTASH_REDIS_REST_URL ? [] : ["UPSTASH_REDIS_REST_URL"]),
        ...(env.UPSTASH_REDIS_REST_TOKEN ? [] : ["UPSTASH_REDIS_REST_TOKEN"]),
      ],
    },
    workflow: {
      required: false,
      ok: Boolean(
        env.QSTASH_TOKEN_NORMALIZED &&
          env.UPSTASH_WORKFLOW_URL &&
          env.QSTASH_CURRENT_SIGNING_KEY &&
          env.QSTASH_NEXT_SIGNING_KEY,
      ),
      missing: [
        ...(env.QSTASH_TOKEN_NORMALIZED ? [] : ["UPSTASH_QSTASH_TOKEN|QSTASH_TOKEN"]),
        ...(env.UPSTASH_WORKFLOW_URL ? [] : ["UPSTASH_WORKFLOW_URL"]),
        ...(env.QSTASH_CURRENT_SIGNING_KEY ? [] : ["QSTASH_CURRENT_SIGNING_KEY"]),
        ...(env.QSTASH_NEXT_SIGNING_KEY ? [] : ["QSTASH_NEXT_SIGNING_KEY"]),
      ],
    },
    ai: {
      required: false,
      ok:
        env.AI_PROVIDER === "anthropic"
          ? Boolean(env.ANTHROPIC_API_KEY)
          : Boolean(env.OPENROUTER_API_KEY && env.OPENROUTER_FREE_MODEL),
      missing:
        env.AI_PROVIDER === "anthropic"
          ? env.ANTHROPIC_API_KEY
            ? []
            : ["ANTHROPIC_API_KEY"]
          : [
              ...(env.OPENROUTER_API_KEY ? [] : ["OPENROUTER_API_KEY"]),
              ...(env.OPENROUTER_FREE_MODEL ? [] : ["OPENROUTER_FREE_MODEL"]),
            ],
    },
    discovery: {
      required: false,
      ok:
        env.DISCOVERY_PROVIDER === "google_places"
          ? Boolean(env.GOOGLE_PLACES_API_KEY)
          : Boolean(env.RAPIDAPI_KEY),
      missing:
        env.DISCOVERY_PROVIDER === "google_places"
          ? env.GOOGLE_PLACES_API_KEY
            ? []
            : ["GOOGLE_PLACES_API_KEY"]
          : env.RAPIDAPI_KEY
            ? []
            : ["RAPIDAPI_KEY"],
    },
    stripe: {
      required: false,
      ok: Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET),
      missing: [
        ...(env.STRIPE_SECRET_KEY ? [] : ["STRIPE_SECRET_KEY"]),
        ...(env.STRIPE_WEBHOOK_SECRET ? [] : ["STRIPE_WEBHOOK_SECRET"]),
      ],
    },
    observability: {
      required: false,
      ok: Boolean(env.SENTRY_DSN),
      missing: env.SENTRY_DSN ? [] : ["SENTRY_DSN"],
    },
  };

  return {
    checks,
    nodeEnv: env.NODE_ENV,
    providers: {
      ai: env.AI_PROVIDER,
      discovery: env.DISCOVERY_PROVIDER,
    },
  };
}
