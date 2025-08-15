import { injectable } from "inversify";
import type {
  Subscription,
  SystemEvent,
  SubscriptionStorageInterface,
} from "@starterp/models";

@injectable()
export class SubscriptionStorageInMemory
  implements SubscriptionStorageInterface
{
  private subscriptions: Map<string, Subscription> = new Map();
  private subscriptionsByUserId: Map<string, string> = new Map(); // userId -> subscriptionId
  private systemEvents: SystemEvent[] = [];

  async getSubscriptionByUserId(userId: string): Promise<Subscription | null> {
    const subscriptionId = this.subscriptionsByUserId.get(userId);
    if (!subscriptionId) return null;

    const subscription = this.subscriptions.get(subscriptionId);
    return subscription ? { ...subscription } : null;
  }

  async createSubscription(
    subscription: Omit<Subscription, "createdAt" | "updatedAt">
  ): Promise<Subscription> {
    const now = new Date();
    const newSubscription: Subscription = {
      ...subscription,
      createdAt: now,
      updatedAt: now,
    };

    // Remove any existing subscription for this user
    const existingId = this.subscriptionsByUserId.get(subscription.userId);
    if (existingId) {
      this.subscriptions.delete(existingId);
    }

    this.subscriptions.set(subscription.id, newSubscription);
    this.subscriptionsByUserId.set(subscription.userId, subscription.id);

    return { ...newSubscription };
  }

  async updateSubscription(userId: string, tier: string): Promise<void> {
    const subscriptionId = this.subscriptionsByUserId.get(userId);
    if (!subscriptionId) {
      throw new Error(`Subscription not found for user ${userId}`);
    }

    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) {
      throw new Error(`Subscription not found for user ${userId}`);
    }

    const updatedSubscription: Subscription = {
      ...subscription,
      tier: tier as "free" | "premium",
      updatedAt: new Date(),
    };

    this.subscriptions.set(subscriptionId, updatedSubscription);
  }

  async deleteSubscriptionByUserId(userId: string): Promise<void> {
    const subscriptionId = this.subscriptionsByUserId.get(userId);
    if (subscriptionId) {
      this.subscriptions.delete(subscriptionId);
      this.subscriptionsByUserId.delete(userId);
    }
  }

  async createSystemEvent(
    event: Omit<SystemEvent, "createdAt">
  ): Promise<void> {
    const systemEvent: SystemEvent = {
      ...event,
      createdAt: new Date(),
    };
    this.systemEvents.push(systemEvent);
  }

  // Test helper methods
  clear(): void {
    this.subscriptions.clear();
    this.subscriptionsByUserId.clear();
    this.systemEvents = [];
  }

  getAllSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  getAllSystemEvents(): SystemEvent[] {
    return [...this.systemEvents];
  }
}
