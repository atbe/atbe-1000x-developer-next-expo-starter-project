import { z } from "zod";

/**
 * Cache entry with value and metadata
 */
export const cacheEntrySchema = z.object({
  value: z.unknown(),
  timestamp: z.number(),
  ttl: z.number().optional(),
});

export type CacheEntry = z.infer<typeof cacheEntrySchema>;

/**
 * Options for cache operations
 */
export const cacheOptionsSchema = z.object({
  ttl: z.number().optional(), // Time to live in seconds
  staleWhileRevalidate: z.number().optional(), // Serve stale while revalidating in seconds
});

export type CacheOptions = z.infer<typeof cacheOptionsSchema>;

/**
 * Cache service interface
 */
export interface CacheService {
  /**
   * Get a value from cache
   */
  get<T = unknown>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   */
  set<T = unknown>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete a value from cache
   */
  delete(key: string): Promise<boolean>;

  /**
   * Clear all cache entries (if supported)
   */
  clear?(): Promise<void>;

  /**
   * Check if a key exists
   */
  has(key: string): Promise<boolean>;

  /**
   * Get multiple values at once
   */
  getMany?<T = unknown>(keys: string[]): Promise<Map<string, T>>;

  /**
   * Set multiple values at once
   */
  setMany?<T = unknown>(entries: Map<string, T>, options?: CacheOptions): Promise<void>;
}