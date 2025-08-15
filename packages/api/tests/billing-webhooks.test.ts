import type { User } from "@starterp/models";
import { beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { Container } from "inversify";
import type Stripe from "stripe";
import { v4 as uuidv4 } from "uuid";
import { TYPES } from "../src/di/types";
import { BillingService } from "../src/services/billing/billing.service";
import { BillingStorageInMemory } from "../src/services/billing/billing.storage.in-memory";
import { SubscriptionService } from "../src/services/subscription/subscription.service";
import { SubscriptionStorageInMemory } from "../src/services/subscription/subscription.storage.in-memory";
import { UserStorageInMemory } from "../src/services/user/user.storage.in-memory";

// Test helper to create a mock Stripe event
function createMockStripeEvent(
  type: string,
  data: any,
  previousAttributes?: any
): Stripe.Event {
  return {
    id: `evt_${uuidv4()}`,
    object: "event",
    api_version: "2025-05-28.basil" as any,
    created: Math.floor(Date.now() / 1000),
    data: {
      object: data,
      previous_attributes: previousAttributes,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null,
    },
    type,
  } as Stripe.Event;
}

// Test helper to create a test user
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: uuidv4(),
    email: `test-${uuidv4()}@example.com`,
    stripeCustomerId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("BillingService Webhook Handlers", () => {
  let container: Container;
  let billingService: BillingService;
  let billingStorage: BillingStorageInMemory;
  let userStorage: UserStorageInMemory;
  let subscriptionStorage: SubscriptionStorageInMemory;
  let subscriptionService: SubscriptionService;
  let mockAppConfig: any;

  const TEST_STRIPE_SECRET_KEY = "sk_test_123";
  const TEST_PREMIUM_PRODUCT_ID = "prod_premium_test";

  beforeEach(() => {
    // Create a fresh container for each test
    container = new Container();

    // Create in-memory storage instances
    billingStorage = new BillingStorageInMemory();
    userStorage = new UserStorageInMemory();
    subscriptionStorage = new SubscriptionStorageInMemory();

    // Mock app config
    mockAppConfig = {
      getAppConfig: mock(() => ({
        stripeSecretKey: TEST_STRIPE_SECRET_KEY,
        premiumMonthlyStripeProductId: TEST_PREMIUM_PRODUCT_ID,
      })),
    };

    // Bind all dependencies
    container.bind(TYPES.BillingStorage).toConstantValue(billingStorage);
    container.bind(TYPES.UserStorage).toConstantValue(userStorage);
    container
      .bind(TYPES.SubscriptionStorage)
      .toConstantValue(subscriptionStorage);
    container.bind(TYPES.AppConfigService).toConstantValue(mockAppConfig);
    container
      .bind(TYPES.StripeSecretKey)
      .toConstantValue(TEST_STRIPE_SECRET_KEY);
    container
      .bind(TYPES.PremiumMonthlyStripeProductId)
      .toConstantValue(TEST_PREMIUM_PRODUCT_ID);
    container.bind(TYPES.SubscriptionService).to(SubscriptionService);
    container.bind(TYPES.BillingService).to(BillingService);

    // Get instances
    subscriptionService = container.get(TYPES.SubscriptionService);
    billingService = container.get(TYPES.BillingService);

    // Clear all storage
    billingStorage.clear();
    subscriptionStorage.clear();
  });

  describe("Customer Events", () => {
    test("should handle customer.created event and update user with Stripe customer ID", async () => {
      // Create a user without Stripe customer ID
      const user = createTestUser();
      await userStorage.createUser(user);

      // Create customer.created event
      const event = createMockStripeEvent("customer.created", {
        id: "cus_test123",
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });

      // Process the event
      await billingService.processWebhookEvent(event);

      // Verify user was updated with Stripe customer ID
      const updatedUser = await userStorage.getUserById(user.id);
      expect(updatedUser?.stripeCustomerId).toBe("cus_test123");

      // Verify billing event was stored
      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
      expect(billingEvents[0]?.eventType).toBe("customer.created");
      expect(billingEvents[0]?.status).toBe("processed");
    });

    test("should handle customer.updated event", async () => {
      const event = createMockStripeEvent("customer.updated", {
        id: "cus_test123",
        email: "updated@example.com",
      });

      await billingService.processWebhookEvent(event);

      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
      expect(billingEvents[0]?.eventType).toBe("customer.updated");
      expect(billingEvents[0]?.status).toBe("processed");
    });
  });

  describe("Subscription Lifecycle Events", () => {
    test("should upgrade user to premium when subscription.created with active status", async () => {
      // Create a user with Stripe customer ID
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);

      // Create subscription.created event for premium product
      const event = createMockStripeEvent("customer.subscription.created", {
        id: "sub_test123",
        customer: user.stripeCustomerId,
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: TEST_PREMIUM_PRODUCT_ID,
              },
            },
          ],
        },
      });

      // Process the event
      await billingService.processWebhookEvent(event);

      // Verify user was upgraded to premium
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("premium");

      // Verify system event was created
      const systemEvents = subscriptionStorage.getAllSystemEvents();
      expect(systemEvents).toHaveLength(1);
      expect(systemEvents[0]?.eventType).toBe("subscription_created");
      expect(systemEvents[0]?.properties.tier).toBe("premium");
    });

    test("should NOT upgrade user when subscription.created with non-premium product", async () => {
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);

      const event = createMockStripeEvent("customer.subscription.created", {
        id: "sub_test123",
        customer: user.stripeCustomerId,
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: "prod_different", // Different product ID
              },
            },
          ],
        },
      });

      await billingService.processWebhookEvent(event);

      // User should remain on free tier
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("free");
    });

    test("should downgrade user to free when subscription.deleted", async () => {
      // Create a premium user
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Create subscription.deleted event
      const event = createMockStripeEvent("customer.subscription.deleted", {
        id: "sub_test123",
        customer: user.stripeCustomerId,
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: TEST_PREMIUM_PRODUCT_ID,
              },
            },
          ],
        },
      });

      await billingService.processWebhookEvent(event);

      // Verify user was downgraded to free
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("free");

      // Verify system event was created
      const systemEvents = subscriptionStorage.getAllSystemEvents();
      const downgradeEvent = systemEvents.find(
        (e) =>
          e.eventType === "subscription_cancelled" &&
          e.properties.newTier === "free"
      );
      expect(downgradeEvent).toBeDefined();
    });

    test("should handle subscription status changes via subscription.updated", async () => {
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Test downgrade when subscription becomes unpaid
      const unpaidEvent = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "unpaid",
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { status: "active" }
      );

      await billingService.processWebhookEvent(unpaidEvent);

      // Verify user was downgraded
      let userTier = await subscriptionService.getUserSubscriptionTier(user.id);
      expect(userTier).toBe("free");

      // Test upgrade when subscription becomes active again
      const activeEvent = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "active",
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { status: "unpaid" }
      );

      await billingService.processWebhookEvent(activeEvent);

      // Verify user was upgraded
      userTier = await subscriptionService.getUserSubscriptionTier(user.id);
      expect(userTier).toBe("premium");
    });
  });

  describe("Invoice Events", () => {
    test("should ensure premium access when invoice.paid for subscription", async () => {
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);

      // Mock Stripe subscriptions.retrieve
      const mockRetrieve = jest.fn().mockResolvedValue({
        id: "sub_test123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: TEST_PREMIUM_PRODUCT_ID,
              },
            },
          ],
        },
      });

      // Replace the retrieve method
      (billingService as any).stripe.subscriptions.retrieve = mockRetrieve;

      const event = createMockStripeEvent("invoice.paid", {
        id: "in_test123",
        customer: user.stripeCustomerId,
        amount_paid: 1000,
        currency: "usd",
        lines: {
          data: [
            {
              subscription: "sub_test123",
            },
          ],
        },
      });

      await billingService.processWebhookEvent(event);

      // Verify user has premium tier
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("premium");

      // Verify Stripe API was called
      expect(mockRetrieve).toHaveBeenCalledWith("sub_test123");
    });

    test("should handle invoice.payment_failed and downgrade on final attempt", async () => {
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Mock Stripe subscriptions.retrieve
      const mockRetrieve = jest.fn().mockResolvedValue({
        id: "sub_test123",
        status: "past_due",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: TEST_PREMIUM_PRODUCT_ID,
              },
            },
          ],
        },
      });

      (billingService as any).stripe.subscriptions.retrieve = mockRetrieve;

      // Final payment attempt (no next_payment_attempt)
      const event = createMockStripeEvent("invoice.payment_failed", {
        id: "in_test123",
        customer: user.stripeCustomerId,
        attempt_count: 3,
        next_payment_attempt: null, // No more attempts
        lines: {
          data: [
            {
              subscription: "sub_test123",
            },
          ],
        },
      });

      await billingService.processWebhookEvent(event);

      // Verify user was downgraded
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("free");
    });

    test("should handle invoice lifecycle events", async () => {
      const customer = "cus_test123";

      // Test invoice.created
      const createdEvent = createMockStripeEvent("invoice.created", {
        id: "in_test123",
        customer,
        total: 1000,
        currency: "usd",
        status: "draft",
      });

      await billingService.processWebhookEvent(createdEvent);

      // Test invoice.finalized
      const finalizedEvent = createMockStripeEvent("invoice.finalized", {
        id: "in_test123",
        customer,
        total: 1000,
        currency: "usd",
        status: "open",
      });

      await billingService.processWebhookEvent(finalizedEvent);

      // Test invoice.updated
      const updatedEvent = createMockStripeEvent("invoice.updated", {
        id: "in_test123",
        customer,
        total: 1000,
        currency: "usd",
        status: "paid",
      });

      await billingService.processWebhookEvent(updatedEvent);

      // Verify all events were processed
      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(3);
      expect(billingEvents.map((e) => e.eventType)).toEqual([
        "invoice.created",
        "invoice.finalized",
        "invoice.updated",
      ]);
      expect(billingEvents.every((e) => e.status === "processed")).toBe(true);
    });
  });

  describe("Payment Events", () => {
    test("should handle charge.succeeded event", async () => {
      const event = createMockStripeEvent("charge.succeeded", {
        id: "ch_test123",
        customer: "cus_test123",
        amount: 1000,
        currency: "usd",
        payment_intent: "pi_test123",
      });

      await billingService.processWebhookEvent(event);

      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
      expect(billingEvents[0]?.eventType).toBe("charge.succeeded");
      expect(billingEvents[0]?.status).toBe("processed");
    });

    test("should handle payment_method.attached event", async () => {
      const event = createMockStripeEvent("payment_method.attached", {
        id: "pm_test123",
        customer: "cus_test123",
        type: "card",
        card: {
          brand: "visa",
          last4: "4242",
          exp_month: 12,
          exp_year: 2025,
        },
      });

      await billingService.processWebhookEvent(event);

      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
      expect(billingEvents[0]?.eventType).toBe("payment_method.attached");
      expect(billingEvents[0]?.status).toBe("processed");
    });

    test("should handle payment_intent.created event", async () => {
      const event = createMockStripeEvent("payment_intent.created", {
        id: "pi_test123",
        customer: "cus_test123",
        amount: 1000,
        currency: "usd",
        status: "requires_payment_method",
      });

      await billingService.processWebhookEvent(event);

      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
      expect(billingEvents[0]?.eventType).toBe("payment_intent.created");
      expect(billingEvents[0]?.status).toBe("processed");
    });
  });

  describe("Idempotency and Error Handling", () => {
    test("should not process the same event twice", async () => {
      const event = createMockStripeEvent("customer.created", {
        id: "cus_test123",
        email: "test@example.com",
        metadata: {},
      });

      // Process the event twice
      await billingService.processWebhookEvent(event);
      await billingService.processWebhookEvent(event);

      // Should only have one billing event
      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
    });

    test("should mark event as failed when handler throws error", async () => {
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);

      // Create a new billing service with mocked subscription service
      const mockSubscriptionService = {
        getUserSubscriptionTier: jest.fn().mockResolvedValue("free"),
        setUserSubscriptionTier: jest
          .fn()
          .mockRejectedValue(new Error("Database error")),
        getUserSubscription: jest.fn().mockResolvedValue({
          userId: user.id,
          tier: "free",
          createdAt: null,
          updatedAt: null,
        }),
      };

      // Create a new billing service instance with mocked dependencies
      const testBillingService = new BillingService(
        billingStorage,
        userStorage,
        mockAppConfig,
        TEST_STRIPE_SECRET_KEY,
        TEST_PREMIUM_PRODUCT_ID,
        mockSubscriptionService as any
      );

      const event = createMockStripeEvent("customer.subscription.created", {
        id: "sub_test123",
        customer: user.stripeCustomerId,
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: TEST_PREMIUM_PRODUCT_ID,
              },
            },
          ],
        },
      });

      // Process should throw
      await expect(
        testBillingService.processWebhookEvent(event)
      ).rejects.toThrow("Database error");

      // Verify event was marked as failed
      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
      expect(billingEvents[0]?.status).toBe("failed");
      expect(billingEvents[0]?.error).toBe("Database error");
    });

    test("should handle events with no handler gracefully", async () => {
      const event = createMockStripeEvent("unknown.event", {
        id: "test123",
      });

      // Should not throw
      await billingService.processWebhookEvent(event);

      // Event should be stored but not processed
      const billingEvents = billingStorage.getAllEvents();
      expect(billingEvents).toHaveLength(1);
      expect(billingEvents[0]?.status).toBe("pending");
    });
  });

  describe("Complex Scenarios", () => {
    test("should handle complete subscription lifecycle", async () => {
      // 1. Create user
      const user = createTestUser();
      await userStorage.createUser(user);

      // 2. Customer created
      const customerEvent = createMockStripeEvent("customer.created", {
        id: "cus_test123",
        email: user.email,
        metadata: { userId: user.id },
      });
      await billingService.processWebhookEvent(customerEvent);

      // 3. Checkout completed
      const checkoutEvent = createMockStripeEvent(
        "checkout.session.completed",
        {
          id: "cs_test123",
          customer: "cus_test123",
          metadata: { userId: user.id },
          mode: "subscription",
          payment_status: "paid",
        }
      );
      await billingService.processWebhookEvent(checkoutEvent);

      // 4. Subscription created
      const subCreatedEvent = createMockStripeEvent(
        "customer.subscription.created",
        {
          id: "sub_test123",
          customer: "cus_test123",
          status: "active",
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        }
      );
      await billingService.processWebhookEvent(subCreatedEvent);

      // Verify premium tier
      let userTier = await subscriptionService.getUserSubscriptionTier(user.id);
      expect(userTier).toBe("premium");

      // 5. Payment fails, subscription becomes past_due
      const subPastDueEvent = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: "cus_test123",
          status: "past_due",
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { status: "active" }
      );
      await billingService.processWebhookEvent(subPastDueEvent);

      // User should still have premium (past_due doesn't downgrade)
      userTier = await subscriptionService.getUserSubscriptionTier(user.id);
      expect(userTier).toBe("premium");

      // 6. Subscription canceled
      const subCanceledEvent = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: "cus_test123",
          status: "canceled",
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { status: "past_due" }
      );
      await billingService.processWebhookEvent(subCanceledEvent);

      // User should be downgraded
      userTier = await subscriptionService.getUserSubscriptionTier(user.id);
      expect(userTier).toBe("free");

      // Verify all events were processed
      const billingEvents = billingStorage.getAllEvents();
      expect(
        billingEvents.filter((e) => e.status === "processed")
      ).toHaveLength(5);

      // Verify system events
      const systemEvents = subscriptionStorage.getAllSystemEvents();
      expect(systemEvents.map((e) => e.eventType)).toContain(
        "subscription_created"
      );
      expect(systemEvents.map((e) => e.eventType)).toContain(
        "subscription_cancelled"
      );
    });
  });

  describe("Failed Payment Downgrade Scenarios", () => {
    test("should downgrade user to free when payment fails on active subscription with no more attempts", async () => {
      // Create a premium user
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Mock Stripe subscriptions.retrieve to return active subscription
      const mockRetrieve = jest.fn().mockResolvedValue({
        id: "sub_test123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: TEST_PREMIUM_PRODUCT_ID,
              },
            },
          ],
        },
      });

      (billingService as any).stripe.subscriptions.retrieve = mockRetrieve;

      // Create invoice.payment_failed event with no more attempts
      const event = createMockStripeEvent("invoice.payment_failed", {
        id: "in_test123",
        customer: user.stripeCustomerId,
        attempt_count: 4,
        next_payment_attempt: null, // No more attempts - this triggers downgrade
        lines: {
          data: [
            {
              subscription: "sub_test123",
            },
          ],
        },
      });

      await billingService.processWebhookEvent(event);

      // Verify user was downgraded to free
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("free");

      // Verify system event was created
      const systemEvents = subscriptionStorage.getAllSystemEvents();
      const downgradeEvent = systemEvents.find(
        (e) =>
          e.eventType === "subscription_cancelled" &&
          e.properties.newTier === "free"
      );
      expect(downgradeEvent).toBeDefined();
    });

    test("should NOT downgrade user when payment fails but more attempts remain", async () => {
      // Create a premium user
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Mock Stripe subscriptions.retrieve
      const mockRetrieve = jest.fn().mockResolvedValue({
        id: "sub_test123",
        status: "active",
        items: {
          data: [
            {
              price: {
                id: "price_test123",
                product: TEST_PREMIUM_PRODUCT_ID,
              },
            },
          ],
        },
      });

      (billingService as any).stripe.subscriptions.retrieve = mockRetrieve;

      // Create invoice.payment_failed event with more attempts remaining
      const event = createMockStripeEvent("invoice.payment_failed", {
        id: "in_test123",
        customer: user.stripeCustomerId,
        attempt_count: 2,
        next_payment_attempt: Math.floor(Date.now() / 1000) + 86400, // Next attempt in 24 hours
        lines: {
          data: [
            {
              subscription: "sub_test123",
            },
          ],
        },
      });

      await billingService.processWebhookEvent(event);

      // Verify user still has premium tier
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("premium");
    });
  });

  describe("Subscription Cancellation with Grace Period", () => {
    test("should keep premium access when subscription is set to cancel at period end", async () => {
      // Create a premium user
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // User cancels but subscription remains active until period end
      const event = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "active", // Still active
          cancel_at_period_end: true, // But will cancel at period end
          current_period_end: Math.floor(Date.now() / 1000) + 2592000, // 30 days from now
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { cancel_at_period_end: false } // Previously not set to cancel
      );

      await billingService.processWebhookEvent(event);

      // Verify user still has premium tier (grace period)
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("premium");

      // Verify billing event was processed
      const billingEvents = billingStorage.getAllEvents();
      const updateEvent = billingEvents.find(
        (e) => e.eventType === "customer.subscription.updated"
      );
      expect(updateEvent).toBeDefined();
      expect(updateEvent?.status).toBe("processed");
    });

    test("should downgrade user when subscription transitions from active to canceled at period end", async () => {
      // Create a premium user
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Subscription transitions to canceled when period ends
      const event = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "canceled", // Now canceled
          cancel_at_period_end: false, // No longer relevant
          canceled_at: Math.floor(Date.now() / 1000),
          ended_at: Math.floor(Date.now() / 1000),
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        {
          status: "active", // Was previously active
          cancel_at_period_end: true, // Was set to cancel
        }
      );

      await billingService.processWebhookEvent(event);

      // Verify user was downgraded to free
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("free");

      // Verify system event was created
      const systemEvents = subscriptionStorage.getAllSystemEvents();
      const downgradeEvent = systemEvents.find(
        (e) =>
          e.eventType === "subscription_cancelled" &&
          e.properties.newTier === "free"
      );
      expect(downgradeEvent).toBeDefined();
    });

    test("should handle immediate cancellation (no grace period)", async () => {
      // Create a premium user
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Subscription immediately canceled (e.g., due to payment failure or immediate cancellation)
      const event = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "canceled", // Immediately canceled
          cancel_at_period_end: false,
          canceled_at: Math.floor(Date.now() / 1000),
          ended_at: Math.floor(Date.now() / 1000),
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { status: "active" } // Was previously active
      );

      await billingService.processWebhookEvent(event);

      // Verify user was immediately downgraded to free
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("free");
    });

    test("should handle reactivation of subscription set to cancel", async () => {
      // Create a premium user
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // User reactivates subscription that was set to cancel
      const event = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "active",
          cancel_at_period_end: false, // No longer set to cancel
          current_period_end: Math.floor(Date.now() / 1000) + 2592000,
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { cancel_at_period_end: true } // Was previously set to cancel
      );

      await billingService.processWebhookEvent(event);

      // Verify user still has premium tier
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("premium");
    });
  });

  describe("Subscription Status Transition Scenarios", () => {
    test("should maintain premium during past_due status", async () => {
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Subscription becomes past_due (payment failed but retrying)
      const event = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "past_due",
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { status: "active" }
      );

      await billingService.processWebhookEvent(event);

      // User should still have premium (grace period during payment retry)
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("premium");
    });

    test("should downgrade when subscription becomes unpaid", async () => {
      const user = createTestUser({ stripeCustomerId: "cus_test123" });
      await userStorage.createUser(user);
      await subscriptionService.setUserSubscriptionTier(
        user.id,
        "premium",
        "test"
      );

      // Subscription becomes unpaid (all payment attempts exhausted)
      const event = createMockStripeEvent(
        "customer.subscription.updated",
        {
          id: "sub_test123",
          customer: user.stripeCustomerId,
          status: "unpaid",
          items: {
            data: [
              {
                price: {
                  id: "price_test123",
                  product: TEST_PREMIUM_PRODUCT_ID,
                },
              },
            ],
          },
        },
        { status: "past_due" }
      );

      await billingService.processWebhookEvent(event);

      // User should be downgraded
      const userTier = await subscriptionService.getUserSubscriptionTier(
        user.id
      );
      expect(userTier).toBe("free");
    });
  });
});
