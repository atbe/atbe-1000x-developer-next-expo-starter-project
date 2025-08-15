import { initTRPC } from "@trpc/server";
import type { Context } from "./context";
import type { CacheMeta } from "../types/cache.types";

// Create the base tRPC instance with cache metadata support
export const t = initTRPC
  .context<Context>()
  .meta<CacheMeta>()
  .create({
    isDev: process.env.NODE_ENV === "development",
  });

// Export base building blocks
export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;

// Export types
export type Router = typeof router;
export type PublicProcedure = typeof publicProcedure;
