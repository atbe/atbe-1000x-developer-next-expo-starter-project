import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Client } from "pg";
import { schema } from "@starterp/db";
import { Logger } from "@starterp/tooling";

const logger = new Logger("db-migrations");

logger.info("schema", { schema });

// Database connection for migrations
const databaseUser = process.env.DB_USER || "postgres";
const databasePassword = process.env.DB_PASSWORD || "postgres";
const databaseHost = process.env.DB_HOST || "localhost";
const databasePort = process.env.DATABASE_PORT || "5432";
const databaseName = process.env.DATABASE_NAME || "postgres";

const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${databaseUser}:${databasePassword}@${databaseHost}:${databasePort}/${databaseName}`;

export async function runMigrations() {
  logger.info("Connecting to database...", { databaseUrl });
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();

  const db = drizzle(client, { schema, logger: true });

  logger.info("Running migrations...");
  await migrate(db, { migrationsFolder: "./migrations" });
  logger.info("Migrations completed!");

  await client.end();
}

// Export the database client for local development
export async function getLocalDb() {
  const client = new Client({
    connectionString: databaseUrl,
  });

  await client.connect();
  return drizzle(client, { schema });
}
