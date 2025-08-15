import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router } from "../base";
import { protectedCachedProcedure } from "../procedures/protected-cached.procedures";
import { protectedProcedure } from "../procedures/protected.procedures";

export const subscriptionRouter = router({
  /**
   * Get the current user's subscription status
   */
  getMySubscription: protectedCachedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/subscription/me",
        summary: "Get current user's subscription",
        protect: true,
      },
      cache: {
        maxAgeInSeconds: 60,
        browserMaxAgeInSeconds: 0,
        staleWhileRevalidateInSeconds: 86400,
        staleIfErrorInSeconds: 86400,
        cfCacheTag: "subscription-me",
      },
    })
    .input(z.void())
    .output(
      z.object({
        userId: z.string(),
        tier: z.enum(["free", "premium"]),
        createdAt: z.date().nullable(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx }) => {
      const subscription = await ctx.subscriptionService.getUserSubscription(
        ctx.user.id
      );
      return subscription;
    }),

  /**
   * Get subscription status for a specific user (admin only)
   */
  getUserSubscription: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .output(
      z.object({
        userId: z.string(),
        tier: z.enum(["free", "premium"]),
        createdAt: z.date().nullable(),
        updatedAt: z.date().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Check if the user is an admin
      const isAdmin = await ctx.userRoleService.isAdmin(ctx.user.id);

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can view other users' subscriptions",
        });
      }

      const subscription = await ctx.subscriptionService.getUserSubscription(
        input.userId
      );
      return subscription;
    }),

  /**
   * Update a user's subscription tier (admin only)
   */
  updateUserSubscription: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        tier: z.enum(["free", "premium"]),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      // Check if the user is an admin
      const isAdmin = await ctx.userRoleService.isAdmin(ctx.user.id);

      if (!isAdmin) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can update subscriptions",
        });
      }

      await ctx.subscriptionService.setUserSubscriptionTier(
        input.userId,
        input.tier,
        ctx.user.id // actorId
      );

      return { success: true };
    }),
});
