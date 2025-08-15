import {
  SubscriptionsDatabaseSchema,
  SystemEventsDatabaseSchema,
} from "@starterp/db";
import type { Logger } from "@starterp/tooling";
import { eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { TYPES } from "../../di/types";
import type { DatabaseType } from "../../types/database";
import { getLogger } from "../../utils/getLogger";
import type {
  Subscription,
  SubscriptionStorageInterface,
  SystemEvent,
} from "@starterp/models";

@injectable()
export class SubscriptionStoragePostgres
  implements SubscriptionStorageInterface
{
  private readonly logger: Logger;

  constructor(@inject(TYPES.Database) private readonly db: DatabaseType) {
    this.logger = getLogger("SubscriptionStoragePostgres");
  }

  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    this.logger.debug("Getting subscription by userId", { userId });

    const result = await this.db
      .select()
      .from(SubscriptionsDatabaseSchema)
      .where(eq(SubscriptionsDatabaseSchema.userId, userId))
      .limit(1);

    if (result.length === 0) {
      this.logger.debug("Subscription not found", { userId });
      return null;
    }

    const subscription = result[0];
    if (!subscription) {
      this.logger.debug("Subscription not found", { userId });
      return null;
    }

    this.logger.debug("Subscription found", { subscription });

    return {
      id: subscription.id,
      userId: subscription.userId,
      tier: subscription.tier,
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }

  async createSubscription(
    subscription: Omit<Subscription, "createdAt" | "updatedAt">
  ): Promise<Subscription> {
    this.logger.debug("Creating subscription", { subscription });

    const result = await this.db
      .insert(SubscriptionsDatabaseSchema)
      .values({
        id: subscription.id,
        userId: subscription.userId,
        tier: subscription.tier as any, // Type assertion needed for enum
      })
      .returning();

    if (result.length === 0) {
      this.logger.error("Subscription not created", { subscription });
      throw new Error("Subscription not created");
    }

    const insertedSubscription = result[0];
    if (!insertedSubscription) {
      this.logger.error("Subscription not created", { subscription });
      throw new Error("Subscription not created");
    }

    this.logger.debug("Subscription created", { result });

    return {
      id: insertedSubscription.id,
      userId: insertedSubscription.userId,
      tier: insertedSubscription.tier,
      createdAt: insertedSubscription.createdAt,
      updatedAt: insertedSubscription.updatedAt,
    };
  }

  async updateSubscription(userId: string, tier: string): Promise<void> {
    this.logger.debug("Updating subscription", { userId, tier });

    await this.db
      .update(SubscriptionsDatabaseSchema)
      .set({
        tier: tier as any, // Type assertion needed for enum
        updatedAt: new Date(),
      })
      .where(eq(SubscriptionsDatabaseSchema.userId, userId));

    this.logger.debug("Subscription updated", { userId, tier });
  }

  async deleteSubscriptionByUserId(userId: string): Promise<void> {
    this.logger.debug("Deleting subscription", { userId });

    await this.db
      .delete(SubscriptionsDatabaseSchema)
      .where(eq(SubscriptionsDatabaseSchema.userId, userId));

    this.logger.debug("Subscription deleted", { userId });
  }

  async createSystemEvent(
    event: Omit<SystemEvent, "createdAt">
  ): Promise<void> {
    this.logger.debug("Creating system event", { event });

    await this.db.insert(SystemEventsDatabaseSchema).values({
      id: event.id,
      eventType: event.eventType as any, // Type assertion needed for enum
      userId: event.userId,
      actorId: event.actorId,
      entityId: event.entityId,
      entityType: event.entityType,
      properties: event.properties as any,
      description: event.description,
    });

    this.logger.debug("System event created", { event });
  }
}
