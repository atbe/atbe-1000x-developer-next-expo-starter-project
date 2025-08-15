# db-migrations Package — AI Docs

## Purpose

The `db-migrations` package manages all database schema migrations for the monorepo using Drizzle ORM and Postgres. It provides scripts and configuration to generate, apply, and manage migrations in a consistent, automated way.

## Structure

- **`src/index.ts`**: Main entry point for running migrations programmatically. Connects to the database using environment variables, runs migrations from the `migrations/` folder, and exports helpers for local development.
- **`drizzle.config.ts`**: Drizzle migration tool configuration. Points to the schema in `@starterp/db`, sets output folder, and configures the database connection.
- **`migrations/`**: Stores generated SQL migration files and metadata.
- **`Taskfile.yaml`**: Defines tasks for generating and applying migrations using `drizzle-kit` and Bun.
- **`package.json`**: Scripts for running Drizzle migration commands and managing dependencies.

## Usage

### Generating Migrations

1. Update your schema in `@starterp/db`.
2. Run the following task to generate new migration files:

   ```bash
   task db:generate-migrations
   ```

   This uses Drizzle Kit to compare the schema and generate SQL files in `migrations/`.

### Applying Migrations

- To apply migrations locally:

  ```bash
  task apply-migrations
  ```

- For production, use:

  ```bash
  task apply-migrations-prod
  ```

  (Loads production secrets from `.secrets.prod`.)

### Programmatic Usage

You can run migrations or get a database client programmatically via:

```ts
import { runMigrations, getLocalDb } from "@starterp/db-migrations";
```

## Environment Variables

- `DATABASE_URL` (or individual `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DATABASE_PORT`, `DATABASE_NAME`)
- For production, secrets are loaded from `.secrets.prod`.

## Notes

- **Never edit generated migration files manually.**
- Always generate migrations after schema changes.
- All migrations are designed to be backward compatible (additive changes only).
