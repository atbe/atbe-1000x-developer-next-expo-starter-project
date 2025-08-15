# Authentication and Authorization

## Authentication

We use GoTrue for authentication.

We run the server locally using the `docker-compose.yaml` file.

We deploy it to Railway using the `Dockerfile.gotrue` file in the `apps/go-true-server-railway` directory.

---

### `UserService` and `AuthService`


The `UserService` is the main application-level service responsible for managing user accounts, including creating users, verifying credentials, and issuing JWT tokens. It acts as the bridge between the application's user data (stored in our own database) and the authentication provider.

TODO: the user service should not be responsible for issuing JWT tokens anymore. GoTrue handles JWT tokens, and so we can purge that code related to JWT tokens at some point.

The `AuthService` interface defines the contract for interacting with the authentication provider (identity provider, or idP). It abstracts operations such as ensuring a user exists in the auth provider, updating user metadata, and setting user roles. This allows the application to remain agnostic to the underlying authentication implementation.

`UserService` depends on an implementation of `AuthService` to synchronize user creation and metadata between the application's database and the authentication provider. For example, when a new user is created, `UserService` first ensures the user exists in the auth provider (via `AuthService.ensureUser`), then creates the corresponding record in the application's database.

---

#### GoTrue Integration via `SupabaseAuthService`

We use [GoTrue](https://github.com/supabase/gotrue) as our authentication provider, running it as a standalone service (not as part of the full Supabase stack). The `SupabaseAuthService` implements the `AuthService` interface and communicates directly with the GoTrue API using the service-role key for admin operations.

Key details:

- All admin operations (user creation, metadata updates, etc.) are performed via HTTP requests to the GoTrue `/admin` endpoints.
- The service-role JWT is required for these operations and is provided via environment variables.
- When creating a user, `SupabaseAuthService` ensures idempotency: it checks if the user exists (by ID or email), creates the user if not, and always returns the GoTrue user ID.
- User metadata (such as roles) is stored in GoTrue's `app_metadata` and can be updated via the service.
- The GoTrue server is run locally via `docker-compose.yaml` and deployed to Railway using a dedicated Dockerfile.

This architecture allows us to decouple our application's user management from the authentication provider, making it easy to swap out GoTrue for another provider in the future if needed, by simply providing a new `AuthService` implementation.

---

## Authorization

We use the `roles` field in the `app_metadata` of the GoTrue user to manage authorization.

The `roles` field is an array of strings, and each string is a role.

We don't have any other complex authorization logic at the moment.

## Client side authentication

We use the `gotrue-js` library to handle client-side authentication.

For the nextjs app, the important files are:

- **`apps/next-app/src/pages/login.tsx`**: The main login page. Handles user authentication via email/password and Google OAuth using GoTrue, updates the auth store on success, and redirects users appropriately.
- **`apps/next-app/src/stores/auth-store.ts`**: Zustand store for managing authentication state, including user info, JWT token, and hydration status. Persists state in localStorage and exposes actions for login, logout, and updating user/token.
- **`apps/next-app/src/lib/gotrue.ts`**: Sets up the GoTrue client and provides helper functions for sign up, sign in, OAuth, sign out, session management, and user info retrieval.
- **`apps/next-app/src/pages/_app.tsx`**: The custom Next.js App component. Wraps the app with global providers, including `AuthProvider` for auth state hydration.
- **`apps/next-app/src/providers/auth-provider.tsx`**: React provider that ensures the auth store is hydrated from persisted storage before rendering children, and manages hydration state.
- **`apps/next-app/src/hooks/use-auth.ts`**: Custom hook for accessing authentication state and helpers, such as checking token expiration, getting auth headers, and handling logout with redirect.
- **`apps/next-app/src/hooks/use-token-refresh.ts`**: Custom hook that refreshes the JWT token automatically on app load if the user is authenticated, using tRPC to get a new token and update the auth store.
- **`apps/next-app/src/components/auth/protected-route.tsx`**: Component that restricts access to authenticated users. Redirects unauthenticated users to the login page and shows a loading spinner during auth checks.
- **`apps/next-app/src/components/auth/protected-admin-route.tsx`**: Component that restricts access to users with the admin role. Checks user roles and verifies admin status via API, redirecting non-admins and showing a loading spinner during checks.

## Hybrid User Data Architecture

We use a **hybrid approach** for user data management that combines GoTrue for authentication with a slim local profile table for application-specific data.

### Architecture Overview

- **GoTrue (`auth.users`)**: Handles authentication, stores email, password hashes, and basic auth metadata
- **Local Profile (`public.users`)**: Stores typed, queryable business data as a foreign key extension to GoTrue users

### Benefits

1. **Strongly Typed**: Local profile data is fully typed (vs GoTrue's untyped JSON metadata)
2. **Performance**: Direct database queries and JOINs (vs HTTP API calls)
3. **Transactional**: Can maintain consistency across business operations
4. **Billing Integration**: Critical for Stripe customer ID storage and billing workflows

### Schema Design

```sql
-- Slim profile table - acts as FK extension to auth.users
CREATE TABLE public.users (
  id TEXT PRIMARY KEY,              -- FK to auth.users.id
  stripe_customer_id TEXT UNIQUE,   -- Business-critical billing data
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);
```

### Data Access Patterns

For queries needing both auth and business data:

```sql
-- Example: Get user with email and billing info
SELECT u.*, au.email, au.created_at as auth_created_at
FROM public.users u
JOIN auth.users au ON u.id = au.id
WHERE u.stripe_customer_id = $1;
```

### Best Practices

- **Read-only** access to `auth.users` (never write directly)
- Use GoTrue API for all authentication operations
- Store only business-critical, frequently-queried data in local profile
- Avoid duplicating data that exists in GoTrue

---

## Managing GoTrue

### the `GOTRUE_SERVICE_ROLE_KEY`

The `GOTRUE_SERVICE_ROLE_KEY` is a JWT token that represents the service role (think of it as an admin token).

You can generate a new service role key using the `gotrue:service-key` task in the `Taskfile.yaml` file.

It will generate a JWT token that is valid for 10 years (315360000/60/60/24/365).
