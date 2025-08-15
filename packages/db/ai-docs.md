# AI Docs: `db` Package Design & Usage

## Overview

The `db` package in this monorepo provides all database schema definitions and utilities for working with PostgreSQL using Drizzle ORM. It is the single source of truth for database structure, types, and schema exports, and is designed to be imported by API and service packages for type-safe database access.

## Structure

- **src/schema/**: All database schemas are defined here, one file per entity (e.g., `User.drizzle.ts`, `Billing.drizzle.ts`).
- **src/gotrue-schema/**: Contains GoTrue user schema for type-safety (not managed by Drizzle migrations).
- **src/aliases.ts**: Pre-defined table aliases to avoid naming conflicts.
- **migrations/**: Auto-generated SQL migration files (never edit manually).
- **drizzle.config.ts**: Drizzle ORM configuration for migrations.

## Schema Philosophy

- All schemas use Drizzle ORM and are written in TypeScript for type-safety.
- Table names are plural, lowercase (e.g., `users`, `subscriptions`).
- Schema files end with `.drizzle.ts` and export descriptive names (e.g., `UsersDatabaseSchema`).
- Enums and Zod schemas are used for validation and type inference.
- GoTrue user schema is for query/type-safety only and is excluded from migrations.

## Usage

- Import the package in your API or service:

  ```ts
  import { schema, UsersDatabaseSchema } from "@starterp/db";
  ```

- Use the exported schemas with Drizzle ORM to get type-safe queries.
- For migrations, only use the files in `src/schema/` (not `gotrue-schema/`).
- To generate migrations after schema changes, run:

  ```sh
  task db:generate-migrations
  ```

- Never edit migration SQL files by hand.

## Environment

- Uses PostgreSQL as the database engine.
- Supports both local (node-postgres) and serverless (Neon/Cloudflare Workers) drivers.
- Configure connection via environment variables (see `database-setup.md`).

## Example: Getting a Drizzle Database Instance

```ts
import { schema } from "@starterp/db";
import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

const client = new Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const db = drizzle(client, { schema });
```

## Conventions

- Always add new columns/tables in a backwards-compatible way.
- Never remove or rename columns without explicit instruction.
- Use Zod schemas/types for runtime validation and type inference.

---

For more, see `ai-docs/internal-documentation/database-setup.md` and Drizzle ORM docs.
