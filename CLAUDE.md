# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This project is a a demonstration of principles for building AI-friendly codebases.

## Package Manager & Commands

This project uses **Bun** for all package management and code execution.

### Essential Commands

**Development:**
- `task start` - Start core services (API, OpenAPI server, Drizzle Studio, Next.js app)
- `task docker:reset` - Destroy and recreate Docker containers, apply migrations, and seed data
- `task docker:start` - Start Docker containers (Postgres, SwaggerUI)
- `task db-migrations:apply-migrations` - Apply database migrations
- `task seed` - Seed database with initial data

**Code Quality:**
- `task lint:fix:type-check` - **ALWAYS RUN THIS** after making changes. Lints, fixes, and type-checks all packages
- `task lint` - Lint all packages
- `task test` - Run tests in all packages

**Dependencies:**
- `bun install` - Install all dependencies (default)
- `bun run install:ci` - Install dependencies excluding electron-app (for CI/Vercel)
- `bun run install:electron` - Install only electron-app dependencies

## Architecture

### Monorepo Structure

**Core Packages:**

- `packages/api` - Business logic for the API
- `packages/db` - Drizzle ORM schemas for Postgres
- `packages/db-migrations` - Database migrations
- `packages/models` - Shared TypeScript models and interfaces
- `packages/tooling` - Shared tooling and utilities

**Applications:**

- `apps/http-server` - tRPC API server with Hono, uses Inversify for DI
- `apps/expo-app` - React Native mobile app.
- `apps/next-app` - Next.js web application.
- `apps/go-true-server-railway` - GoTrue authentication server deployment for Railway.

### Key Architecture Principles

1. **tRPC for API Communication** - All frontend-backend communication uses tRPC routers
2. **Dependency Injection** - API services use Inversify container pattern
3. **Hybrid Auth Architecture** - GoTrue for authentication + local profile table for business data
4. **Postgres Database** - Using Drizzle ORM with migrations

## Authentication & Authorization

- **Provider:** GoTrue (Supabase's auth server) running standalone
- **Client Libraries:** `gotrue-js` for client-side auth
- **Architecture:** Hybrid approach with GoTrue for auth + local `public.users` table for business data
- **Authorization:** Role-based using `app_metadata.roles` array in GoTrue
- **Service Key:** Generate with `task gotrue:service-key`

### Key Auth Files (Next.js)

- `apps/next-app/src/lib/gotrue.ts` - GoTrue client setup
- `apps/next-app/src/stores/auth-store.ts` - Zustand auth state management
- `apps/next-app/src/components/auth/protected-route.tsx` - Auth route protection

## Database

- **Database:** Postgres
- **ORM:** Drizzle with full TypeScript support
- **Schema Location:** `packages/db/src/schema/`
- **Migration Generation:** `task db:generate-migrations` (ALWAYS run after schema changes)
- **Studio:** Available at https://local.drizzle.studio/?port=8082

**Critical Rules:**

- NEVER manually edit generated migration files
- DO NOT remove columns or make breaking changes without explicit instruction
- ALWAYS generate migrations after schema changes

When writing code, always look for `ai-docs.md` files in the directory tree you are working in.

There will most likely be a file somewhere in that tree that will help you write the code more correctly.

## Development URLs

- API Server: http://localhost:3042
- tRPC Endpoints: http://localhost:3042/trpc
- Next.js App: http://localhost:3000
- Drizzle Studio: https://local.drizzle.studio/?port=8082
- SwaggerUI: http://localhost:8083
- OpenAPI Server: http://localhost:3043

## Code Standards

- **No obvious comments** - Code should be self-documenting
- **Avoid `any` type** - Use proper TypeScript typing
- **Package-scoped dependencies** - Install dependencies in specific package directories
- **Always run linter** - Use `task lint:fix:type-check` after any changes
- **Assume server is running** - Don't start services in code

## Testing

- API tests: `packages/api/tests/`
- Run all tests: `task test`
- Individual package tests: `cd packages/[name] && bun run test`