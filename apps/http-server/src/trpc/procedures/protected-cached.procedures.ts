import { cacheMiddleware } from "../middleware/cache.middleware";
import { protectedProcedure } from "./protected.procedures";

// Create cached versions of protected procedures for convenience
export const protectedCachedProcedure = protectedProcedure
  .use(cacheMiddleware)
  .meta({
    cache: {
      maxAgeInSeconds: 60, // Default 1 minute CDN cache
      browserMaxAgeInSeconds: 0, // Default no browser cache
      staleWhileRevalidateInSeconds: 86400, // Default 24 hours
      staleIfErrorInSeconds: 86400, // Default 24 hours
    },
  });

export const protectedStaticCachedProcedure = protectedProcedure
  .use(cacheMiddleware)
  .meta({
    cache: {
      maxAgeInSeconds: 86400, // 24 hours CDN cache
      browserMaxAgeInSeconds: 3600, // 1 hour browser cache
      staleWhileRevalidateInSeconds: 604800, // 7 days
      staleIfErrorInSeconds: 2592000, // 30 days
    },
  });

export const protectedShortCachedProcedure = protectedProcedure
  .use(cacheMiddleware)
  .meta({
    cache: {
      maxAgeInSeconds: 10, // 10 seconds CDN cache
      browserMaxAgeInSeconds: 0, // No browser cache
      staleWhileRevalidateInSeconds: 30, // 30 seconds
      staleIfErrorInSeconds: 300, // 5 minutes
    },
  });
