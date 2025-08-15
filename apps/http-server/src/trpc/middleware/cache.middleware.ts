import { middleware } from "../base";

// Caching middleware that sets headers based on metadata
export const cacheMiddleware = middleware(async ({ meta, ctx, next }) => {
  const result = await next();

  // Only apply caching to successful responses
  if (result.ok && meta?.cache && ctx.c) {
    const cacheConfig = meta.cache;

    // Build cache control directives
    const directives: string[] = [];

    // Browser cache (max-age)
    if (cacheConfig.browserMaxAgeInSeconds !== undefined) {
      directives.push(`max-age=${cacheConfig.browserMaxAgeInSeconds}`);
    }

    // CDN/Edge cache (s-maxage)
    if (cacheConfig.maxAgeInSeconds !== undefined) {
      directives.push(`s-maxage=${cacheConfig.maxAgeInSeconds}`);
    }

    // Stale-while-revalidate
    if (cacheConfig.staleWhileRevalidateInSeconds !== undefined) {
      directives.push(
        `stale-while-revalidate=${cacheConfig.staleWhileRevalidateInSeconds}`
      );
    }

    // Stale-if-error (useful for resilience)
    if (cacheConfig.staleIfErrorInSeconds !== undefined) {
      directives.push(`stale-if-error=${cacheConfig.staleIfErrorInSeconds}`);
    }

    // Must-revalidate if specified
    if (cacheConfig.mustRevalidate) {
      directives.push("must-revalidate");
    }

    // Public by default for cached responses (required for CDN caching)
    directives.push("public");

    const cacheControl = directives.join(", ");

    // Build vary headers - always include trpc-accept for tRPC compatibility and Origin for different deployments
    const varyHeaders = ["trpc-accept", "Origin"];

    if (cacheConfig.varyByAuth) {
      varyHeaders.push("Authorization");
    }

    if (cacheConfig.varyBy) {
      varyHeaders.push(...cacheConfig.varyBy);
    }

    // Remove duplicates
    const uniqueVaryHeaders = [...new Set(varyHeaders)];

    // Set headers on Hono context
    ctx.c.header("Cache-Control", cacheControl);
    ctx.c.header("Vary", uniqueVaryHeaders.join(", "));

    // Set Cloudflare cache tag if provided
    if (cacheConfig.cfCacheTag) {
      ctx.c.header("Cache-Tag", cacheConfig.cfCacheTag);
    }

    // Add CDN-Cache-Control for Cloudflare (same as Cache-Control but only for CDN)
    ctx.c.header("CDN-Cache-Control", cacheControl);

    // Add Surrogate-Control for other CDNs (Fastly, etc.)
    ctx.c.header("Surrogate-Control", cacheControl);
  }

  return result;
});
