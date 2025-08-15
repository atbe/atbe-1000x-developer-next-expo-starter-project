import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router } from "../base";
import {
  protectedCachedProcedure,
  protectedShortCachedProcedure,
} from "../procedures/protected-cached.procedures";
import { protectedProcedure } from "../procedures/protected.procedures";

export const adminRouter = router({
  /**
   * Get all users with pagination, search, and filtering
   * Uses short cache since admin data changes frequently
   */
  getUsers: protectedShortCachedProcedure
    .meta({
      cache: {
        maxAgeInSeconds: 30,
        browserMaxAgeInSeconds: 30,
        staleWhileRevalidateInSeconds: 60,
        staleIfErrorInSeconds: 300,
        varyByAuth: true,
        cfCacheTag: "admin-users-list",
      },
    })
    .input(
      z.object({
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
        search: z.string().optional(),
        tier: z.enum(["all", "free", "premium"]).default("all"),
        role: z.enum(["all", "user", "admin"]).default("all"),
      })
    )
    .output(
      z.object({
        users: z.array(
          z.object({
            id: z.string(),
            email: z.string(),
            createdAt: z.date(),
            updatedAt: z.date(),
            role: z.enum(["user", "admin"]),
            subscriptionTier: z.enum(["free", "premium"]),
          })
        ),
        pagination: z.object({
          page: z.number(),
          pageSize: z.number(),
          totalPages: z.number(),
          totalUsers: z.number(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      // TODO: make this middleware and read jwt
      await ctx.adminService.requireAdmin(ctx.user.id);

      try {
        return await ctx.adminService.getUsers(
          input.page,
          input.pageSize,
          input.search,
          input.tier,
          input.role
        );
      } catch (error) {
        ctx.logger.error("Error fetching users", { error });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "An error occurred while fetching users",
        });
      }
    }),

  /**
   * Update a user's role
   * No caching for mutations
   */
  updateUserRole: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["user", "admin"]),
      })
    )
    .output(z.object({ success: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.adminService.requireAdmin(ctx.user.id);
      await ctx.userRoleService.setUserRole(
        input.userId,
        input.role,
        ctx.user.id
      );
      return { success: true };
    }),

  /**
   * Get user details including subscription and role
   * Uses standard caching since details don't change often
   */
  getUserDetails: protectedCachedProcedure
    .meta({
      cache: {
        maxAgeInSeconds: 300, // 5 minutes CDN cache
        browserMaxAgeInSeconds: 60, // 1 minute browser cache
        staleWhileRevalidateInSeconds: 600, // 10 minutes
        staleIfErrorInSeconds: 3600, // 1 hour
        varyByAuth: true, // Cache per admin
        cfCacheTag: "admin-user-details",
      },
    })
    .input(z.object({ userId: z.string() }))
    .output(
      z.object({
        id: z.string(),
        email: z.string(),
        createdAt: z.date(),
        updatedAt: z.date(),
        role: z.enum(["user", "admin"]),
        subscription: z.object({
          tier: z.enum(["free", "premium"]),
          createdAt: z.date().nullable(),
          updatedAt: z.date().nullable(),
        }),
      })
    )
    .query(async ({ ctx, input }) => {
      await ctx.adminService.requireAdmin(ctx.user.id);
      return await ctx.adminService.getUserDetails(input.userId);
    }),

  /**
   * Get system statistics for the dashboard
   * Uses short cache for real-time dashboard data
   */
  getSystemStats: protectedShortCachedProcedure
    .meta({
      cache: {
        // Can still override specific settings
        varyByAuth: true,
        cfCacheTag: "admin-system-stats",
        maxAgeInSeconds: 30,
        browserMaxAgeInSeconds: 30,
        staleWhileRevalidateInSeconds: 60,
        staleIfErrorInSeconds: 300,
      },
    })
    .input(z.void())
    .output(
      z.object({
        totalUsers: z.number(),
        premiumUsers: z.number(),
        freeUsers: z.number(),
        adminUsers: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      await ctx.adminService.requireAdmin(ctx.user.id);
      return await ctx.adminService.getSystemStats();
    }),
});
