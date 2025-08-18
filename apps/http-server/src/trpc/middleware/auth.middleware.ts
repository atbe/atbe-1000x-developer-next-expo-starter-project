import { TRPCError } from "@trpc/server";
import { middleware } from "../base";
import type { AuthenticatedContext } from "../context";

// Authentication middleware that transforms Context to AuthenticatedContext
export const isAuthenticated = middleware(async ({ ctx, next }) => {
  // cookie and bearer auth will be attempted
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
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "No valid authentication found",
    });
  }

  throw new TRPCError({
    code: "UNAUTHORIZED",
    message: "Invalid or expired token",
  });
});
