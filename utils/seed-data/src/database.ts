import { getLogger, type DatabaseType } from "@starterp/api";
import { schema } from "@starterp/db";

// Type for Cloudflare Workers global scope
interface WorkersGlobalScope {
  WebSocketPair?: unknown;
  __STATIC_CONTENT?: unknown;
}

let dbInstance: DatabaseType | null = null;

const logger = getLogger("Database");

/**
 * Get the appropriate database instance based on the runtime environment
 */
export async function getDatabase({
  databaseUrl,
}: {
  databaseUrl?: string;
}): Promise<DatabaseType> {
  if (dbInstance) {
    logger.info("Database instance already exists, returning it");
    return dbInstance;
  }

  // Check if we're in a Cloudflare Workers environment
  const workersGlobal = globalThis as unknown as WorkersGlobalScope;
  logger.info("Checking if we're in a Cloudflare Workers environment");
  const isWorkers =
    typeof globalThis !== "undefined" &&
    (workersGlobal.WebSocketPair !== undefined ||
      workersGlobal.__STATIC_CONTENT !== undefined ||
      process.env.USE_WORKERS_DB === "true");

  if (isWorkers) {
    logger.info(
      "We're in a Cloudflare Workers environment, using Neon HTTP driver"
    );
    // Use Neon HTTP driver for Workers
    const { drizzle } = await import("drizzle-orm/neon-http");
    const { neon } = await import("@neondatabase/serverless");

    if (!databaseUrl) {
      logger.error(
        "DATABASE_URL is not set. Please set it in the environment variables."
      );
      throw new Error(
        `DATABASE_URL is not set. Please set it in the environment variables.`
      );
    }

    logger.info("Connecting to database");
    const sql = neon(databaseUrl);
    dbInstance = drizzle(sql, { schema }) as unknown as DatabaseType;
  } else {
    // Use standard PostgreSQL driver for local development
    logger.info(
      "We're in a local development environment, using standard PostgreSQL driver",
      {
        databaseUrl,
      }
    );

    const { Client } = await import("pg");
    const { drizzle } = await import("drizzle-orm/node-postgres");

    const client = new Client({
      connectionString: databaseUrl,
    });

    await client.connect();
    dbInstance = drizzle(client, { schema }) as unknown as DatabaseType;
  }

  return dbInstance;
}

export function resetDatabase(): void {
  dbInstance = null;
}
