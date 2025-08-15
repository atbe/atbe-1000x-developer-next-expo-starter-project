import { injectable } from "inversify";
import { v4 as uuidv4 } from "uuid";
import type { BillingStorageInterface, BillingEvent } from "@starterp/models";

@injectable()
export class BillingStorageInMemory implements BillingStorageInterface {
  private events: Map<string, BillingEvent> = new Map();
  private eventsByStripeId: Map<string, string> = new Map(); // stripeEventId -> eventId

  async createBillingEvent(
    event: Omit<
      BillingEvent,
      "id" | "createdAt" | "updatedAt" | "status" | "processedAt" | "error"
    >
  ): Promise<BillingEvent> {
    const id = uuidv4();
    const now = new Date();

    const billingEvent: BillingEvent = {
      id,
      stripeEventId: event.stripeEventId,
      userId: event.userId || null,
      stripeCustomerId: event.stripeCustomerId || null,
      eventType: event.eventType,
      status: "pending",
      eventData: event.eventData,
      stripeEventCreatedAt: event.stripeEventCreatedAt,
      processedAt: null,
      error: null,
      createdAt: now,
      updatedAt: now,
    };

    this.events.set(id, billingEvent);
    this.eventsByStripeId.set(event.stripeEventId, id);

    return { ...billingEvent };
  }

  async getBillingEventById(id: string): Promise<BillingEvent | null> {
    const event = this.events.get(id);
    return event ? { ...event } : null;
  }

  async getBillingEventByStripeEventId(
    stripeEventId: string
  ): Promise<BillingEvent | null> {
    const eventId = this.eventsByStripeId.get(stripeEventId);
    if (!eventId) return null;
    return this.getBillingEventById(eventId);
  }

  async updateBillingEvent(
    id: string,
    updates: Partial<Omit<BillingEvent, "id" | "createdAt">>
  ): Promise<BillingEvent> {
    const event = this.events.get(id);
    if (!event) {
      throw new Error(`Billing event with id ${id} not found`);
    }

    const updatedEvent: BillingEvent = {
      ...event,
      ...updates,
      updatedAt: new Date(),
    };

    this.events.set(id, updatedEvent);
    return { ...updatedEvent };
  }

  async getBillingEventsByUserId(
    userId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BillingEvent[]> {
    const userEvents = Array.from(this.events.values())
      .filter((event) => event.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return userEvents.map((event) => ({ ...event }));
  }

  async getBillingEventsByCustomerId(
    customerId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<BillingEvent[]> {
    const customerEvents = Array.from(this.events.values())
      .filter((event) => event.stripeCustomerId === customerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return customerEvents.map((event) => ({ ...event }));
  }

  // Test helper methods
  clear(): void {
    this.events.clear();
    this.eventsByStripeId.clear();
  }

  getAllEvents(): BillingEvent[] {
    return Array.from(this.events.values());
  }
}
