import { TRPCError } from "@trpc/server";
import { middleware } from "../base";
import type { AuthenticatedContext } from "../context";

// Authentication middleware that transforms Context to AuthenticatedContext
export const isAuthenticated = middleware(async ({ ctx, next }) => {
  const authHeader = ctx.c.req.header("authorization");

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Missing or invalid authorization header",
    });
  }

  const token = authHeader.substring(7);

  try {
    const user = await ctx.jwtService.verifyToken(token);

    if (!user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid token" });
    }

    // Add user to context - this transforms Context to AuthenticatedContext
    return next({
      ctx: {
        ...ctx,
        user,
      } as AuthenticatedContext,
    });
  } catch (_error) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Invalid or expired token",
    });
  }
});
