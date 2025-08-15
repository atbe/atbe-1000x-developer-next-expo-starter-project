export interface WorkerEnv {
  // Database
  DATABASE_URL: string;

  // Stripe
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
  PREMIUM_MONTHLY_STRIPE_PRODUCT_ID: string;

  // GoTrue
  GOTRUE_URL: string;
  GOTRUE_SERVICE_ROLE_KEY: string;

  // JWT
  JWT_SECRET: string;

  // Logging
  LOG_LEVEL: "debug" | "info" | "warn" | "error";

  // Feature flags
  SHOULD_HOST_OPENAPI_SERVER: string;
  USE_IN_MEMORY_STORAGE: string;
  USE_WORKERS_DB: string;
}

// Re-export Cloudflare's ExecutionContext type
export type WorkerContext = ExecutionContext;
