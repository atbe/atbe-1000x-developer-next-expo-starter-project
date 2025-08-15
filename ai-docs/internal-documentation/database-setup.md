# Database Setup

## Overview

The monorepo uses Drizzle ORM for database management with PostgreSQL as the database engine. The database package (`packages/db`) contains all schema definitions, migrations, and database-related utilities.

## Technology Stack

- **ORM**: Drizzle ORM
- **Database**: PostgreSQL
- **Migration Tool**: drizzle-kit
- **Package Manager**: bun

## Package Structure

```
packages/db/
├── src/
│   └── schema/           # Database schema definitions
│       └── User.drizzle.ts
├── migrations/           # Generated SQL migrations
│   ├── 0000_*.sql
│   └── meta/            # Migration metadata
├── drizzle.config.ts    # Drizzle configuration
├── package.json
└── tsconfig.json
```

## Configuration

### Drizzle Config (`packages/db/drizzle.config.ts`)

The configuration uses environment variables with sensible defaults:

```typescript
const databaseUser = process.env.DATABASE_USER || "postgres";
const databasePassword = process.env.DATABASE_PASSWORD || "postgres";
const databaseHost = process.env.DATABASE_HOST || "localhost";
const databasePort = process.env.DATABASE_PORT || 5432;
const databaseName = process.env.DATABASE_NAME || "postgres";
```

Key settings:
- **Schema Location**: `./src/schema` - All `.drizzle.ts` files in this directory
- **Migrations Output**: `./migrations` - Generated SQL migration files
- **Dialect**: PostgreSQL

### Environment Variables

Configure your database connection using these environment variables:

- `DATABASE_USER` - PostgreSQL username (default: `postgres`)
- `DATABASE_PASSWORD` - PostgreSQL password (default: `postgres`)
- `DATABASE_HOST` - Database host (default: `localhost`)
- `DATABASE_PORT` - Database port (default: `5432`)
- `DATABASE_NAME` - Database name (default: `postgres`)

## Schema Definition

### Naming Convention

- Schema files should end with `.drizzle.ts`
- Export names should be descriptive (e.g., `UsersDatabaseSchema`)
- Table names should be plural lowercase (e.g., `users`)
- Column names should use snake_case (e.g., `created_at`)

### Example Schema

```typescript
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const UsersDatabaseSchema = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
```

## Migration Workflow

### Generating Migrations

After making schema changes, generate migrations:

```bash
# From project root
task db:generate-migrations

# Or directly in db package
cd packages/db
bun run drizzle-kit generate
```

### Migration Files

- Migrations are generated in `packages/db/migrations/`
- Each migration has a unique timestamp and descriptive name
- Migration metadata is stored in `migrations/meta/`
- **NEVER** manually edit generated migration files unless explicitly instructed

### Important Rules

1. **No Breaking Changes**: Never remove columns or change column types without explicit approval
2. **Always Generate**: After any schema change, always generate migrations
3. **Review Migrations**: Always review generated SQL before applying to production

## Development Workflow

### 1. Create/Modify Schema

Add or modify schema files in `packages/db/src/schema/`:

```typescript
// packages/db/src/schema/Post.drizzle.ts
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const PostsDatabaseSchema = pgTable("posts", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content"),
  authorId: text("author_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

### 2. Generate Migrations

```bash
task db:generate-migrations
```

### 3. Run Linter

Always check for TypeScript errors after changes:

```bash
task lint
```

## Docker Integration

The project includes Docker Compose for local PostgreSQL development:

```bash
# Start PostgreSQL container
task start-docker

# Stop PostgreSQL container
task stop-docker

# Destroy PostgreSQL container and volumes
task destroy-docker
```

## Best Practices

1. **Schema Organization**: Group related tables in the same file or create separate files for complex schemas
2. **Type Safety**: Always use Drizzle's type-safe schema builders
3. **Timestamps**: Include `createdAt` and `updatedAt` on all tables
4. **Primary Keys**: Use text-based IDs for flexibility (UUIDs, nanoids, etc.)
5. **Naming**: Use consistent naming conventions across all schemas
6. **Migrations**: Review all generated migrations before applying
7. **Version Control**: Commit both schema files and generated migrations

## Troubleshooting

### Common Issues

1. **Module not found errors**: Run `bun install` in the db package
2. **Migration generation fails**: Check database connection and credentials
3. **Type errors**: Run the linter to identify issues

### Dependencies

The db package requires:
- `drizzle-orm` - Core ORM functionality
- `drizzle-kit` (dev) - Migration generation tool

Install missing dependencies:
```bash
cd packages/db
bun install drizzle-orm
bun install -D drizzle-kit
``` 