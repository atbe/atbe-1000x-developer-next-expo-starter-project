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

  // App config
  APP_CONFIG_TRPC_SERVER_URL: string;
  APP_CONFIG_GOTRUE_URL: string;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Server configuration
      PORT?: string;
      NODE_ENV?: "development" | "production" | "test";

      // Database
      DATABASE_URL: string;
      USE_WORKERS_DB?: "true" | "false";

      // BetterAuth
      BETTER_AUTH_BASE_URL: string;
      BETTER_AUTH_SECRET: string;
      BETTER_AUTH_TRUSTED_ORIGINS?: string;

      // Stripe
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET?: string;
      PREMIUM_MONTHLY_STRIPE_PRODUCT_ID: string;

      // GoTrue
      GOTRUE_URL?: string;
      GOTRUE_SERVICE_ROLE_KEY?: string;

      // JWT
      JWT_SECRET?: string;

      // Logging
      LOG_LEVEL?: "debug" | "info" | "warn" | "error";

      // Feature flags
      SHOULD_HOST_OPENAPI_SERVER?: string;
      USE_IN_MEMORY_STORAGE?: string;
      USE_LOCAL_STORAGE?: "true" | "false";

      // App config
      APP_CONFIG_TRPC_SERVER_URL?: string;
      APP_CONFIG_GOTRUE_URL?: string;

      // OpenAPI server
      OPENAPI_SERVER_PORT?: string;
    }
  }
}

// Re-export Cloudflare's ExecutionContext type
export type WorkerContext = ExecutionContext;
