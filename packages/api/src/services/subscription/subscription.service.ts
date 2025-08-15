import type { SubscriptionStorageInterface } from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import { v4 as uuidv4 } from "uuid";
import { TYPES } from "../../di/types";
import { getLogger } from "../../utils/getLogger";

import type { SubscriptionTier } from "@starterp/models";

export type { SubscriptionTier };

@injectable()
export class SubscriptionService {
  private readonly logger: Logger;

  constructor(
    @inject(TYPES.SubscriptionStorage)
    private readonly subscriptionStorage: SubscriptionStorageInterface
  ) {
    this.logger = getLogger("SubscriptionService");
  }

  /**
   * Get the subscription tier for a user.
   * Returns "free" if no subscription record exists (default tier).
   */
  async getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
    this.logger.info("Getting user subscription tier", { userId });
    const subscription = await this.subscriptionStorage.getSubscriptionByUserId(
      userId
    );

    // If no subscription record exists, user is on free tier
    if (!subscription) {
      return "free";
    }

    return subscription.tier as SubscriptionTier;
  }

  /**
   * Set the subscription tier for a user.
   * Creates or updates the subscription record.
   */
  async setUserSubscriptionTier(
    userId: string,
    tier: SubscriptionTier,
    actorId?: string
  ): Promise<void> {
    this.logger.info("Setting user subscription tier", {
      userId,
      tier,
      actorId,
      function: "setUserSubscriptionTier",
    });
    const existingSubscription =
      await this.subscriptionStorage.getSubscriptionByUserId(userId);

    if (tier === "free") {
      // If setting to free tier, delete the subscription record
      if (existingSubscription) {
        this.logger.info("Deleting subscription", {
          userId,
          subscriptionId: existingSubscription.id,
          function: "setUserSubscriptionTier",
        });
        await this.subscriptionStorage.deleteSubscriptionByUserId(userId);
        this.logger.info("Subscription deleted", {
          userId,
          subscriptionId: existingSubscription.id,
          function: "setUserSubscriptionTier",
        });

        // Log the event
        await this.logSubscriptionEvent(
          "subscription_cancelled",
          userId,
          existingSubscription.id,
          { previousTier: existingSubscription.tier, newTier: tier },
          actorId
        );
      }
      return;
    }

    // For premium tier, create or update the subscription record
    if (existingSubscription) {
      // Update existing subscription
      this.logger.info("Updating subscription", {
        userId,
        subscriptionId: existingSubscription.id,
        tier,
      });
      await this.subscriptionStorage.updateSubscription(userId, tier);

      // Log the event
      await this.logSubscriptionEvent(
        "subscription_updated",
        userId,
        existingSubscription.id,
        { previousTier: existingSubscription.tier, newTier: tier },
        actorId
      );
    } else {
      // Create new subscription
      const subscriptionId = uuidv4();
      this.logger.info("Creating new subscription", {
        userId,
        subscriptionId,
        tier,
      });
      await this.subscriptionStorage.createSubscription({
        id: subscriptionId,
        userId,
        tier,
      });
      this.logger.info("New subscription created", {
        userId,
        subscriptionId,
        tier,
      });

      // Log the event
      await this.logSubscriptionEvent(
        "subscription_created",
        userId,
        subscriptionId,
        { tier },
        actorId
      );
    }
  }

  /**
   * Get subscription details for a user
   */
  async getUserSubscription(userId: string) {
    this.logger.info("Getting user subscription", { userId });
    const subscription = await this.subscriptionStorage.getSubscriptionByUserId(
      userId
    );

    if (!subscription) {
      return {
        userId,
        tier: "free" as SubscriptionTier,
        createdAt: null,
        updatedAt: null,
      };
    }

    return {
      userId,
      tier: subscription.tier as SubscriptionTier,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  /**
   * Log a subscription-related event
   */
  private async logSubscriptionEvent(
    eventType:
      | "subscription_created"
      | "subscription_updated"
      | "subscription_cancelled",
    userId: string,
    subscriptionId: string,
    properties: Record<string, any>,
    actorId?: string
  ): Promise<void> {
    this.logger.info("Logging subscription event", {
      eventType,
      userId,
      subscriptionId,
      properties,
      actorId,
    });
    await this.subscriptionStorage.createSystemEvent({
      id: uuidv4(),
      eventType,
      userId,
      actorId: actorId || userId, // If no actor specified, assume user did it themselves
      entityId: subscriptionId,
      entityType: "subscription",
      properties,
      description: this.generateEventDescription(eventType, properties),
    });
  }

  /**
   * Generate a human-readable description for an event
   */
  private generateEventDescription(
    eventType: string,
    properties: Record<string, any>
  ): string {
    this.logger.info("Generating event description", {
      eventType,
      properties,
    });
    switch (eventType) {
      case "subscription_created":
        return `Subscription created with ${properties.tier} tier`;
      case "subscription_updated":
        return `Subscription updated from ${properties.previousTier} to ${properties.newTier} tier`;
      case "subscription_cancelled":
        return `Subscription cancelled (moved from ${properties.previousTier} to free tier)`;
      default:
        return `Subscription event: ${eventType}`;
    }
  }
}
