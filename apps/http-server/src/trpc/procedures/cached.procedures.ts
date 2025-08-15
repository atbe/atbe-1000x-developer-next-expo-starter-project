import { publicProcedure } from "../base";
import { cacheMiddleware } from "../middleware/cache.middleware";

// Cached procedure builder
export const cachedProcedure = publicProcedure.use(cacheMiddleware).meta({
  cache: {
    maxAgeInSeconds: 60, // Default 1 minute CDN cache
    browserMaxAgeInSeconds: 0, // Default no browser cache
    staleWhileRevalidateInSeconds: 86400, // Default 24 hours
    staleIfErrorInSeconds: 86400, // Default 24 hours
  },
});

// Aggressively cached procedure for static/rarely changing data
export const staticCachedProcedure = publicProcedure.use(cacheMiddleware).meta({
  cache: {
    maxAgeInSeconds: 86400, // 24 hours CDN cache
    browserMaxAgeInSeconds: 3600, // 1 hour browser cache
    staleWhileRevalidateInSeconds: 604800, // 7 days
    staleIfErrorInSeconds: 2592000, // 30 days
  },
});

// Short-lived cache for frequently changing data
export const shortCachedProcedure = publicProcedure.use(cacheMiddleware).meta({
  cache: {
    maxAgeInSeconds: 10, // 10 seconds CDN cache
    browserMaxAgeInSeconds: 0, // No browser cache
    staleWhileRevalidateInSeconds: 30, // 30 seconds
    staleIfErrorInSeconds: 300, // 5 minutes
  },
});

// Export types
export type CachedProcedure = typeof cachedProcedure;
export type StaticCachedProcedure = typeof staticCachedProcedure;
export type ShortCachedProcedure = typeof shortCachedProcedure;
