## Middleware Documentation

### `auth.middleware.ts`

The `auth.middleware.ts` file provides authentication middleware for tRPC routes. It exports `isAuthenticated`, a middleware that:

- Checks for a valid `Authorization` header in the incoming request (expects a Bearer token).
- Verifies the JWT token using the `jwtService`.
- If the token is valid, attaches the authenticated user to the context, transforming it into an `AuthenticatedContext`.
- If the token is missing, invalid, or expired, throws a `TRPCError` with code `UNAUTHORIZED`.

**Usage:**

- Use this middleware to protect tRPC procedures that require authentication.
- Ensures only requests with valid JWT tokens can access protected endpoints.

### `cache.middleware.ts`

The `cache.middleware.ts` file provides caching middleware for tRPC routes. It exports `cacheMiddleware`, a middleware that:

- Reads cache-related metadata from the tRPC route (`meta.cache`).
- On successful responses, sets appropriate HTTP cache headers (`Cache-Control`, `Vary`, `CDN-Cache-Control`, `Surrogate-Control`, and optionally `Cache-Tag`).
- Supports configuration for browser and CDN cache durations, stale-while-revalidate, stale-if-error, must-revalidate, and custom vary headers.
- Can vary cache by authentication (`Authorization` header) and other custom headers.

**Usage:**

- Use this middleware to enable fine-grained HTTP caching for tRPC endpoints.
- Configure cache behavior via the `meta.cache` property on each route.
- Helps optimize performance and reduce backend load by leveraging browser and CDN caching.
