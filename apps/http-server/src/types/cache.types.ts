import type { OpenApiMeta } from "trpc-to-openapi";

// Cache configuration type
export interface CacheConfig {
  /**
   * Cache duration in seconds for CDN/edge caching (s-maxage)
   * @default 60 (1 minute)
   */
  maxAgeInSeconds?: number;
  /**
   * Browser cache duration in seconds (max-age)
   * @default 0 (no browser cache)
   */
  browserMaxAgeInSeconds?: number;
  /**
   * Stale-while-revalidate duration in seconds
   * @default 86400 (24 hours)
   */
  staleWhileRevalidateInSeconds?: number;
  /**
   * Stale-if-error duration in seconds (useful for Cloudflare)
   * @default 86400 (24 hours)
   */
  staleIfErrorInSeconds?: number;
  /**
   * Whether the response must be revalidated with origin (no-cache)
   * @default false
   */
  mustRevalidate?: boolean;
  /**
   * Whether to vary cache by Authorization header
   * @default false
   */
  varyByAuth?: boolean;
  /**
   * Additional headers to vary by
   * @default []
   */
  varyBy?: string[];
  /**
   * Cloudflare-specific cache tag for targeted purging
   */
  cfCacheTag?: string;
}

// Extended metadata type that includes cache configuration
export interface CacheMeta extends OpenApiMeta {
  cache?: CacheConfig;
}
