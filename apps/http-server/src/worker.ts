import "reflect-metadata";
import { createContainer } from "./di/container";
import { createServer } from "./server";
import type { WorkerContext, WorkerEnv } from "./types/env";
import { getDatabase } from "./utils/database";

// Defer app creation to avoid global scope operations
let server: ReturnType<typeof createServer> | null = null;

// Export default handler for Cloudflare Workers
export default {
  fetch: async (request: Request, env: WorkerEnv, ctx: WorkerContext) => {
    // Initialize app and server on first request
    if (!server) {
      const db = await getDatabase({
        databaseUrl: env.DATABASE_URL,
      });

      if (!env.STRIPE_SECRET_KEY) {
        throw new Error("STRIPE_SECRET_KEY environment variable is required");
      }

      if (!env.PREMIUM_MONTHLY_STRIPE_PRODUCT_ID) {
        throw new Error(
          "PREMIUM_MONTHLY_STRIPE_PRODUCT_ID environment variable is required"
        );
      }

      const container = createContainer({
        db,
        useLocal: process.env.USE_LOCAL_STORAGE === "true",
        stripeSecretKey: env.STRIPE_SECRET_KEY as string,
        premiumMonthlyStripeProductId:
          env.PREMIUM_MONTHLY_STRIPE_PRODUCT_ID as string,
        jwtConfig: {
          secret: env.JWT_SECRET as string,
          expiresIn: "7d",
          issuer: "starterp",
          audience: "starterp-api",
        },
        gotrueServiceRoleKey: env.GOTRUE_SERVICE_ROLE_KEY as string,

        defaultAppConfig: {
          trpcServerUrl: env.APP_CONFIG_TRPC_SERVER_URL,
          gotrueUrl: env.APP_CONFIG_GOTRUE_URL,
          features: {
            autoUpdate: true,
            analytics: false,
          },
        },
      });
      server = createServer(container);
    }

    return server.fetch(request, env, ctx);
  },
};
