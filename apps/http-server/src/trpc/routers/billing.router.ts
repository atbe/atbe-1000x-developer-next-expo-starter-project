import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../base";
import { protectedProcedure } from "../procedures/protected.procedures";
import { protectedCachedProcedure } from "../procedures/protected-cached.procedures";

// Input schemas
const createCheckoutSessionSchema = z.object({
  priceId: z.string(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const createPortalSessionSchema = z.object({
  returnUrl: z.string().url(),
});

export const billingRouter = router({
  // Create a Stripe checkout session for subscription upgrade
  createCheckoutSession: protectedProcedure
    .input(createCheckoutSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { priceId, successUrl, cancelUrl } = input;

      try {
        const session = await ctx.billingService.createCheckoutSession(
          user.id,
          priceId,
          successUrl,
          cancelUrl
        );

        return {
          checkoutUrl: session.url || "",
          sessionId: session.id,
        };
      } catch (_error) {
        ctx.logger.error("Failed to create checkout session", {
          error: _error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create checkout session",
        });
      }
    }),

  // Create a Stripe customer portal session for subscription management
  createPortalSession: protectedProcedure
    .input(createPortalSessionSchema)
    .mutation(async ({ ctx, input }) => {
      const { user } = ctx;
      const { returnUrl } = input;

      try {
        const session = await ctx.billingService.createCustomerPortalSession(
          user.id,
          returnUrl
        );

        return {
          portalUrl: session.url,
        };
      } catch (_error) {
        ctx.logger.error("Failed to create customer portal session", {
          error: _error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create customer portal session",
        });
      }
    }),

  // Get billing history for the current user
  getBillingHistory: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(100).default(10) }))
    .query(async ({ ctx, input }) => {
      try {
        return await ctx.billingService.getUserBillingHistory(
          ctx.user.id,
          input.limit
        );
      } catch (_error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch billing history",
        });
      }
    }),

  // Get current subscription details
  getCurrentSubscription: protectedCachedProcedure
    .meta({
      cache: {
        maxAgeInSeconds: 10,
        browserMaxAgeInSeconds: 10,
        staleWhileRevalidateInSeconds: 60,
        staleIfErrorInSeconds: 60,
      },
    })
    .query(async ({ ctx }) => {
      const { user } = ctx;

      try {
        const subscription = await ctx.billingService.getUserSubscription(
          user.id
        );

        if (!subscription) {
          return null;
        }

        return {
          id: subscription.id,
          status: subscription.status,
          currentPeriodEnd: subscription.items.data[0]?.current_period_end,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          cancelAt: subscription.cancel_at,
          items: subscription.items.data.map((item) => ({
            id: item.id,
            priceId: item.price.id,
            productId:
              typeof item.price.product === "string"
                ? item.price.product
                : item.price.product.id,
            nickname: item.price.nickname,
            unitAmount: item.price.unit_amount,
            currency: item.price.currency,
            interval: item.price.recurring?.interval,
          })),
        };
      } catch (_error) {
        ctx.logger.error("Failed to fetch subscription details", {
          error: _error,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to fetch subscription details",
        });
      }
    }),

  // Force sync subscription from Stripe
  syncMySubscription: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { user } = ctx;
      
      try {
        ctx.logger.info("Force syncing subscription for user", { userId: user.id });
        
        // Call the billing service to sync the subscription
        const result = await ctx.billingService.syncUserSubscription(user.id);
        
        ctx.logger.info("Subscription sync result", { userId: user.id, result });
        
        return {
          success: true,
          tier: result.tier,
          message: result.message,
        };
      } catch (_error) {
        ctx.logger.error("Failed to sync subscription", {
          error: _error,
          userId: user.id,
        });
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync subscription",
        });
      }
    }),

  // Debug endpoint to check billing events
  getAllBillingEvents: publicProcedure.query(async ({ ctx }) => {
    // This is a debug endpoint - in production, this should be protected
    const storage = ctx.billingService["billingStorage"];

    // Check if it's in-memory storage
    if ("getAllEvents" in storage) {
      return {
        storageType: "in-memory",
        events: (storage as any).getAllEvents(),
      };
    }

    // Otherwise try to get from database
    try {
      const events = await storage.getBillingEventsByUserId("dummy", 100, 0);
      return {
        storageType: "postgres",
        events,
      };
    } catch (error) {
      ctx.logger.error("Failed to fetch billing events", {
        error,
      });
      return {
        storageType: "unknown",
        error: error instanceof Error ? error.message : "Unknown error",
        events: [],
      };
    }
  }),
});
