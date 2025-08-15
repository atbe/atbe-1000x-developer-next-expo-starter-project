import { getLogger } from "@starterp/api";
import "reflect-metadata";
import { createContainer } from "./di/container";
import { createServer } from "./server";
import { getDatabase } from "./utils/database";

export { createServer } from "./server";
export type { AppRouter } from "./trpc/routers/app.router";

const port = process.env.PORT || 3042;
const logger = getLogger("main");
logger.info("Starting server, connecting to database");
if (!process.env.DATABASE_URL) {
  logger.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const db = await getDatabase({
  databaseUrl: process.env.DATABASE_URL,
});
logger.info("Database connected");

if (!process.env.STRIPE_SECRET_KEY) {
  logger.error("STRIPE_SECRET_KEY environment variable is required");
  process.exit(1);
}

if (!process.env.PREMIUM_MONTHLY_STRIPE_PRODUCT_ID) {
  logger.error(
    "PREMIUM_MONTHLY_STRIPE_PRODUCT_ID environment variable is required"
  );
  process.exit(1);
}

const container = createContainer({
  db,
  useLocal: process.env.USE_LOCAL_STORAGE === "true",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY as string,
  premiumMonthlyStripeProductId: process.env
    .PREMIUM_MONTHLY_STRIPE_PRODUCT_ID as string,
});
logger.info("Container created");
logger.info("App initialized");

const server = createServer(container);

logger.info(`Starting server at port ${port}`);
Bun.serve({
  port,
  fetch: server.fetch,
});

logger.info(`Server is running at http://localhost:${port}`);
logger.info(`tRPC endpoint: http://localhost:${port}/trpc`);
logger.info(`Health check: http://localhost:${port}/health`);
