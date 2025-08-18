import { TRPCError } from "@trpc/server";
import { middleware } from "../base";
import type { AuthenticatedContext } from "../context";

// Authentication middleware that transforms Context to AuthenticatedContext
export const isAuthenticated = middleware(async ({ ctx, next }) => {
  // First, try to authenticate using better-auth cookies
  try {
    const session = await ctx.betterAuthService.auth.api.getSession({
      headers: ctx.c.req.raw.headers,
    });

    if (session?.user) {
      // Transform better-auth user to JWT payload format for compatibility
      // Better-auth user with custom fields
      type BetterAuthUser = typeof session.user & { roles?: string[] };
      const betterAuthUser = session.user as BetterAuthUser;
      
      const user = {
        id: betterAuthUser.id,
        email: betterAuthUser.email,
        roles: betterAuthUser.roles || ["user"],
      };

      return next({
        ctx: {
          ...ctx,
          user,
        } as AuthenticatedContext,
      });
    }
  } catch (_cookieError) {
    // Cookie auth failed, try Bearer token
  }

  // Fallback to Bearer token authentication (for backward compatibility)
  const authHeader = ctx.c.req.header("authorization");

  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No valid authentication found",
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
