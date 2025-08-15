# AI Docs: `utils/seed-data` Package

## Purpose

The `utils/seed-data` package provides a utility for seeding the database with initial data, primarily user accounts and roles, for local development and testing. It is designed to be idempotent, safe to run multiple times, and leverages the main API service layer for all operations.

## Design Overview

- **Entrypoint:**  
  The main script is `src/index.ts`, which is executed via the `seed` script in `package.json`.
- **Dependency Injection:**  
  Uses a container pattern (`createContainer`) to wire up services and storage implementations, supporting both local (in-memory) and production (Postgres) backends.
- **Database Connection:**  
  The database connection is established via `getDatabase`, which auto-detects the environment (local or Cloudflare Workers) and selects the appropriate driver.
- **Services Used:**  
  - `UserService` for user creation and password verification.
  - `UserRoleService` for assigning roles.
- **Idempotency:**  
  The script checks for the existence of users before creating them, ensuring safe repeated runs.
- **Logging:**  
  All actions and errors are logged using the project’s logger.

## Usage

- **Automatic:**  
  The seeding script is run automatically as part of the `task docker:reset` workflow.
- **Manual:**  
  You can run it directly with:

  ```bash
  cd utils/seed-data && bun run seed
  ```

## What Gets Seeded

- **Admin User:**  
  - Email: `admin@starterp.com`
  - Password: `password`
  - Role: `admin`
- **Regular User:**  
  - Email: `user@starterp.com`
  - Password: `password`
  - Role: `user`

## Extending

To add more seed data, extend the logic in `src/index.ts` after the existing user creation blocks. Use the service layer for all data mutations to ensure consistency and proper side effects (e.g., password hashing).
