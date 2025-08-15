# tRPC Organization

This directory contains all tRPC-related code organized into logical modules.

## Directory Structure

```
trpc/
├── base.ts                 # Base tRPC setup and exports
├── context.ts             # Context creation and types
├── index.ts               # Main exports
├── trpc.ts                # Deprecated - kept for backwards compatibility
│
├── middleware/            # All middleware implementations
│   ├── auth.middleware.ts # Authentication middleware
│   └── cache.middleware.ts # Caching middleware
│
├── procedures/            # Pre-configured procedures
│   ├── cached.procedures.ts          # Public cached procedures
│   ├── protected.procedures.ts       # Protected (authenticated) procedures
│   └── protected-cached.procedures.ts # Protected + cached procedures
│
├── routers/              # tRPC routers
│   ├── admin.router.ts   # Admin endpoints
│   ├── app.router.ts     # Main app router
│   ├── subscription.router.ts # Subscription endpoints
│   └── user.router.ts    # User endpoints
│
├── types/                # TypeScript types
│   └── cache.types.ts    # Cache configuration types
```

## Usage

### Basic Procedures

```typescript
import { publicProcedure, protectedProcedure } from '@/trpc';

// Public endpoint
export const hello = publicProcedure
  .input(z.string())
  .query(({ input }) => `Hello ${input}`);

// Protected endpoint (requires authentication)
export const getProfile = protectedProcedure
  .query(({ ctx }) => ctx.user);
```

### Cached Procedures

```typescript
import { 
  cachedProcedure, 
  shortCachedProcedure,
  staticCachedProcedure,
  protectedCachedProcedure 
} from '@/trpc';

// Standard cache (1 minute CDN, no browser cache)
export const getData = cachedProcedure
  .query(() => fetchData());

// Short cache (10 seconds CDN)
export const getRealtimeData = shortCachedProcedure
  .query(() => fetchRealtimeData());

// Long cache (24 hours CDN, 1 hour browser)
export const getStaticData = staticCachedProcedure
  .query(() => fetchStaticData());

// Protected + cached
export const getUserData = protectedCachedProcedure
  .query(({ ctx }) => fetchUserData(ctx.user.id));
```

### Custom Cache Configuration

The cache field is fully typed with TypeScript IntelliSense support:

```typescript
import { cachedProcedure } from '@/trpc';

export const customCached = cachedProcedure
  .meta({
    cache: {
      maxAgeInSeconds: 300,              // 5 minutes CDN cache
      browserMaxAgeInSeconds: 60,        // 1 minute browser cache
      staleWhileRevalidateInSeconds: 3600, // 1 hour stale-while-revalidate
      staleIfErrorInSeconds: 86400,      // 24 hours stale-if-error
      varyByAuth: true,                  // Cache per user
      cfCacheTag: "my-data",             // Cloudflare cache tag
      mustRevalidate: false,             // Optional revalidation
      varyBy: ["X-Custom-Header"],       // Additional vary headers
    }
  })
  .query(() => fetchData());
```
