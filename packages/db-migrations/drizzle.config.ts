import type { Config } from "drizzle-kit";

const databaseUser = process.env.DATABASE_USER || "postgres";
const databasePassword = process.env.DATABASE_PASSWORD || "postgres";
const databaseHost = process.env.DATABASE_HOST || "localhost";
const databasePort = process.env.DATABASE_PORT || 5432;
const databaseName = process.env.DATABASE_NAME || "postgres";
const databaseUrl =
  process.env.DATABASE_URL ||
  `postgresql://${databaseUser}:${databasePassword}@${databaseHost}:${databasePort}/${databaseName}`;

console.log("databaseUrl", databaseUrl);

export default {
  schema: "../db/src/schema/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
} satisfies Config;
