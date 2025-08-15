# AI Documentation: tRPC Procedures in `/procedures/`

This document provides an overview of the core tRPC procedure builders defined in this folder. These procedures are used to standardize API endpoint behaviors, especially around authentication and caching. Use this as a reference for extending or consuming these procedures in the future.

---

## 1. `publicProcedure`

- **Source:** Imported from `../base` (not defined here)
- **Purpose:** Base procedure for endpoints that do not require authentication.
- **Usage:** Used as the foundation for most other procedures.

---

## 2. `protectedProcedure`

- **Source:** `protected.procedures.ts`
- **Purpose:** Ensures the endpoint is only accessible to authenticated users.
- **How:** Wraps `publicProcedure` with the `isAuthenticated` middleware.
- **Usage:**

  ```ts
  export const protectedProcedure = publicProcedure.use(isAuthenticated);
  ```

- **When to use:** Any endpoint that should only be accessible to logged-in users.

---

## 3. Cached Procedures

These procedures add caching behavior to endpoints. They all use the `cacheMiddleware` and set different cache-control metadata for CDN and browser caching.

### a. `cachedProcedure`

- **Purpose:** Adds moderate caching (1 minute CDN, no browser cache, 24h stale-while-revalidate).
- **Usage:**

  ```ts
  export const cachedProcedure = publicProcedure.use(cacheMiddleware).meta({
    cache: {
      maxAgeInSeconds: 60,
      browserMaxAgeInSeconds: 0,
      staleWhileRevalidateInSeconds: 86400,
      staleIfErrorInSeconds: 86400,
    },
  });
  ```

- **When to use:** For endpoints where data can be cached briefly but should remain relatively fresh.

### b. `staticCachedProcedure`

- **Purpose:** Aggressive caching for static/rarely changing data (24h CDN, 1h browser, 7d stale-while-revalidate).
- **Usage:**

  ```ts
  export const staticCachedProcedure = publicProcedure.use(cacheMiddleware).meta({
    cache: {
      maxAgeInSeconds: 86400,
      browserMaxAgeInSeconds: 3600,
      staleWhileRevalidateInSeconds: 604800,
      staleIfErrorInSeconds: 2592000,
    },
  });
  ```

- **When to use:** For endpoints serving static or rarely updated data.

### c. `shortCachedProcedure`

- **Purpose:** Short-lived cache for frequently changing data (10s CDN, no browser cache).
- **Usage:**

  ```ts
  export const shortCachedProcedure = publicProcedure.use(cacheMiddleware).meta({
    cache: {
      maxAgeInSeconds: 10,
      browserMaxAgeInSeconds: 0,
      staleWhileRevalidateInSeconds: 30,
      staleIfErrorInSeconds: 300,
    },
  });
  ```

- **When to use:** For endpoints where data changes rapidly and should not be cached for long.

---

## 4. Protected Cached Procedures

These are the protected equivalents of the cached procedures above. They require authentication **and** apply the same caching strategies.

### a. `protectedCachedProcedure`

- **Purpose:** Authenticated endpoints with moderate caching.
- **Usage:**

  ```ts
  export const protectedCachedProcedure = protectedProcedure.use(cacheMiddleware).meta({ ... });
  ```

### b. `protectedStaticCachedProcedure`

- **Purpose:** Authenticated endpoints with aggressive/static caching.
- **Usage:**

  ```ts
  export const protectedStaticCachedProcedure = protectedProcedure.use(cacheMiddleware).meta({ ... });
  ```

### c. `protectedShortCachedProcedure`

- **Purpose:** Authenticated endpoints with short-lived caching.
- **Usage:**

  ```ts
  export const protectedShortCachedProcedure = protectedProcedure.use(cacheMiddleware).meta({ ... });
  ```

---

## 5. Types

- `CachedProcedure`, `StaticCachedProcedure`, `ShortCachedProcedure`: Types for the respective procedures, useful for type safety and inference.

---

## Summary Table

| Procedure                        | Auth Required | CDN Cache | Browser Cache | Stale-While-Revalidate | Stale-If-Error | Use Case                       |
|----------------------------------|:-------------:|:---------:|:-------------:|:----------------------:|:--------------:|-------------------------------|
| `publicProcedure`                |      No       |     -     |      -        |           -            |       -        | Public endpoints               |
| `protectedProcedure`             |     Yes       |     -     |      -        |           -            |       -        | Auth-only endpoints            |
| `cachedProcedure`                |      No       |   1 min   |     None      |        24h             |      24h       | Moderately cacheable public    |
| `staticCachedProcedure`          |      No       |   24h     |     1h        |        7d              |      30d       | Static/rarely changing public  |
| `shortCachedProcedure`           |      No       |   10s     |     None      |        30s             |      5m        | Rapidly changing public        |
| `protectedCachedProcedure`       |     Yes       |   1 min   |     None      |        24h             |      24h       | Moderately cacheable, private  |
| `protectedStaticCachedProcedure` |     Yes       |   24h     |     1h        |        7d              |      30d       | Static/rarely changing, private|
| `protectedShortCachedProcedure`  |     Yes       |   10s     |     None      |        30s             |      5m        | Rapidly changing, private      |

---

## Notes

- All caching is handled via the `cacheMiddleware`.
- Use the most restrictive procedure that fits your use case (prefer protected + cache if possible).
- Adjust cache settings as needed for your endpoint's requirements.
