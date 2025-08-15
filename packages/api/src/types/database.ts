import type { schema } from "@starterp/db";
import type { NeonHttpDatabase } from "drizzle-orm/neon-http";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

// Import all schema types we might need
type SchemaType = typeof schema;

export type DatabaseType =
  | NodePgDatabase<SchemaType>
  | NeonHttpDatabase<SchemaType>;
