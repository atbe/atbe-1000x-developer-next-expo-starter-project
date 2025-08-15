import { BillingEventsDatabaseSchema } from "@starterp/db";
import { desc, eq } from "drizzle-orm";
import { inject, injectable } from "inversify";
import { v4 as uuidv4 } from "uuid";
import { TYPES } from "../../di/types";
import type { DatabaseType } from "../../types/database";
import { getLogger } from "../../utils/getLogger";
import type { BillingEvent, BillingStorageInterface } from "@starterp/models";

@injectable()
export class BillingStoragePostgres implements BillingStorageInterface {
  private logger = getLogger("BillingStoragePostgres");

  constructor(@inject(TYPES.Database) private db: DatabaseType) {}

  async createBillingEvent(
    event: Omit<
      BillingEvent,
      "id" | "createdAt" | "updatedAt" | "status" | "processedAt" | "error"
    >
  ): Promise<BillingEvent> {
    const id = uuidv4();
    const now = new Date();

    this.logger.info("Creating billing event in database", {
      id,
      stripeEventId: event.stripeEventId,
      eventType: event.eventType,
      userId: event.userId,
      stripeCustomerId: event.stripeCustomerId,
    });

    let createdEvent;
    try {
      const result = await this.db
        .insert(BillingEventsDatabaseSchema)
        .values({
          id,
          stripeEventId: event.stripeEventId,
          userId: event.userId || null,
          stripeCustomerId: event.stripeCustomerId || null,
          eventType: event.eventType as any, // Cast needed for enum
          status: "pending",
          eventData: event.eventData,
          stripeEventCreatedAt: event.stripeEventCreatedAt,
          processedAt: null,
          error: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      createdEvent = result[0];

      this.logger.info("Billing event created in database", {
        id: createdEvent?.id,
        stripeEventId: createdEvent?.stripeEventId,
      });
    } catch (error) {
      this.logger.error("Failed to create billing event in database", {
        error,
        id,
        stripeEventId: event.stripeEventId,
        eventType: event.eventType,
      });
      throw error;
    }

    if (!createdEvent) {
      throw new Error("Failed to create billing event");
    }

    return {
      id: createdEvent.id,
      stripeEventId: createdEvent.stripeEventId,
      userId: createdEvent.userId,
      stripeCustomerId: createdEvent.stripeCustomerId,
      eventType: createdEvent.eventType as any,
      status: createdEvent.status as any,
      eventData: createdEvent.eventData as Record<string, unknown>,
      stripeEventCreatedAt: createdEvent.stripeEventCreatedAt,
      processedAt: createdEvent.processedAt,
      error: createdEvent.error,
      createdAt: createdEvent.createdAt,
      updatedAt: createdEvent.updatedAt,
    };
  }

  async getBillingEventById(id: string): Promise<BillingEvent | null> {
    const [event] = await this.db
      .select()
      .from(BillingEventsDatabaseSchema)
      .where(eq(BillingEventsDatabaseSchema.id, id));

    if (!event) return null;

    return {
      id: event.id,
      stripeEventId: event.stripeEventId,
      userId: event.userId,
      stripeCustomerId: event.stripeCustomerId,
      eventType: event.eventType as any,
      status: event.status as any,
      eventData: event.eventData as Record<string, unknown>,
      stripeEventCreatedAt: event.stripeEventCreatedAt,
      processedAt: event.processedAt,
      error: event.error,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  async getBillingEventByStripeEventId(
    stripeEventId: string
  ): Promise<BillingEvent | null> {
    const [event] = await this.db
      .select()
      .from(BillingEventsDatabaseSchema)
      .where(eq(BillingEventsDatabaseSchema.stripeEventId, stripeEventId));

    if (!event) return null;

    return {
      id: event.id,
      stripeEventId: event.stripeEventId,
      userId: event.userId,
      stripeCustomerId: event.stripeCustomerId,
      eventType: event.eventType as any,
      status: event.status as any,
      eventData: event.eventData as Record<string, unknown>,
      stripeEventCreatedAt: event.stripeEventCreatedAt,
      processedAt: event.processedAt,
      error: event.error,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  async updateBillingEvent(
    id: string,
    updates: Partial<Omit<BillingEvent, "id" | "createdAt">>
  ): Promise<BillingEvent> {
    const [updatedEvent] = await this.db
      .update(BillingEventsDatabaseSchema)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(BillingEventsDatabaseSchema.id, id))
      .returning();

    if (!updatedEvent) {
      throw new Error(
        `Failed to update billing event, id: ${id}, updates: ${JSON.stringify(
          updates
        )}`
      );
    }

    return {
      id: updatedEvent.id,
      stripeEventId: updatedEvent.stripeEventId,
      userId: updatedEvent.userId,
      stripeCustomerId: updatedEvent.stripeCustomerId,
      eventType: updatedEvent.eventType as any,
      status: updatedEvent.status as any,
      eventData: updatedEvent.eventData as Record<string, unknown>,
      stripeEventCreatedAt: updatedEvent.stripeEventCreatedAt,
      processedAt: updatedEvent.processedAt,
      error: updatedEvent.error,
      createdAt: updatedEvent.createdAt,
      updatedAt: updatedEvent.updatedAt,
    };
  }

  async getBillingEventsByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BillingEvent[]> {
    const events = await this.db
      .select()
      .from(BillingEventsDatabaseSchema)
      .where(eq(BillingEventsDatabaseSchema.userId, userId))
      .orderBy(desc(BillingEventsDatabaseSchema.createdAt))
      .limit(limit)
      .offset(offset);

    return events.map((event) => ({
      id: event.id,
      stripeEventId: event.stripeEventId,
      userId: event.userId,
      stripeCustomerId: event.stripeCustomerId,
      eventType: event.eventType as any,
      status: event.status as any,
      eventData: event.eventData as Record<string, unknown>,
      stripeEventCreatedAt: event.stripeEventCreatedAt,
      processedAt: event.processedAt,
      error: event.error,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));
  }

  async getBillingEventsByCustomerId(
    customerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BillingEvent[]> {
    const events = await this.db
      .select()
      .from(BillingEventsDatabaseSchema)
      .where(eq(BillingEventsDatabaseSchema.stripeCustomerId, customerId))
      .orderBy(desc(BillingEventsDatabaseSchema.createdAt))
      .limit(limit)
      .offset(offset);

    return events.map((event) => ({
      id: event.id,
      stripeEventId: event.stripeEventId,
      userId: event.userId,
      stripeCustomerId: event.stripeCustomerId,
      eventType: event.eventType as any,
      status: event.status as any,
      eventData: event.eventData as Record<string, unknown>,
      stripeEventCreatedAt: event.stripeEventCreatedAt,
      processedAt: event.processedAt,
      error: event.error,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    }));
  }
}
