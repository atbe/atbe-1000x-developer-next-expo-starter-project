import type {
  BillingEventType,
  BillingStorageInterface,
  StripeCharge,
  StripeCheckoutSession,
  StripeCustomer,
  StripeInvoice,
  StripePaymentIntent,
  StripePaymentMethod,
  StripeSubscription,
  User,
} from "@starterp/models";
import type { Logger } from "@starterp/tooling";
import { inject, injectable } from "inversify";
import Stripe from "stripe";
import { TYPES } from "../../di/types";
import { SubscriptionService } from "../../services/subscription/subscription.service";
import type { UserStorageInterface } from "../../services/user/user.storage.interface";
import { getLogger } from "../../utils/getLogger";

export interface StripeEventHandler {
  eventType: string;
  handle: (event: Stripe.Event) => Promise<void>;
}

@injectable()
export class BillingService {
  private stripe: Stripe;
  private eventHandlers = new Map<string, StripeEventHandler["handle"]>();
  private logger: Logger;

  constructor(
    @inject(TYPES.BillingStorage)
    private billingStorage: BillingStorageInterface,
    @inject(TYPES.UserStorage) private userStorage: UserStorageInterface,
    @inject(TYPES.StripeSecretKey) private stripeSecretKey: string,
    @inject(TYPES.PremiumMonthlyStripeProductId)
    private premiumMonthlyStripeProductId: string,
    @inject(SubscriptionService)
    private subscriptionService: SubscriptionService
  ) {
    this.logger = getLogger("BillingService");

    this.stripe = new Stripe(this.stripeSecretKey, {
      apiVersion: "2025-06-30.basil",
    });

    // Register event handlers
    this.registerEventHandlers();
  }

  private registerEventHandlers() {
    // Customer events
    this.registerHandler(
      "customer.created",
      this.handleCustomerCreated.bind(this)
    );
    this.registerHandler(
      "customer.updated",
      this.handleCustomerUpdated.bind(this)
    );

    // Subscription events
    this.registerHandler(
      "customer.subscription.created",
      this.handleSubscriptionCreated.bind(this)
    );
    this.registerHandler(
      "customer.subscription.updated",
      this.handleSubscriptionUpdated.bind(this)
    );
    this.registerHandler(
      "customer.subscription.deleted",
      this.handleSubscriptionDeleted.bind(this)
    );
    this.registerHandler(
      "customer.subscription.trial_will_end",
      this.handleSubscriptionTrialWillEnd.bind(this)
    );

    // Checkout events
    this.registerHandler(
      "checkout.session.completed",
      this.handleCheckoutCompleted.bind(this)
    );

    // Invoice events
    this.registerHandler("invoice.paid", this.handleInvoicePaid.bind(this));
    this.registerHandler(
      "invoice.payment.paid",
      this.handleInvoicePaid.bind(this)
    );
    this.registerHandler(
      "invoice_payment.paid",
      this.handleInvoicePaid.bind(this)
    );
    this.registerHandler(
      "invoice.payment_succeeded",
      this.handleInvoicePaid.bind(this)
    );
    this.registerHandler(
      "invoice.payment_failed",
      this.handleInvoicePaymentFailed.bind(this)
    );
    this.registerHandler(
      "invoice.payment_action_required",
      this.handleInvoicePaymentActionRequired.bind(this)
    );
    this.registerHandler(
      "invoice.created",
      this.handleInvoiceCreated.bind(this)
    );
    this.registerHandler(
      "invoice.finalized",
      this.handleInvoiceFinalized.bind(this)
    );
    this.registerHandler(
      "invoice.updated",
      this.handleInvoiceUpdated.bind(this)
    );

    // Payment intent events
    this.registerHandler(
      "payment_intent.succeeded",
      this.handlePaymentIntentSucceeded.bind(this)
    );
    this.registerHandler(
      "payment_intent.created",
      this.handlePaymentIntentCreated.bind(this)
    );
    this.registerHandler(
      "payment_intent.payment_failed",
      this.handlePaymentIntentFailed.bind(this)
    );

    // Charge events
    this.registerHandler(
      "charge.succeeded",
      this.handleChargeSucceeded.bind(this)
    );

    // Payment method events
    this.registerHandler(
      "payment_method.attached",
      this.handlePaymentMethodAttached.bind(this)
    );
  }

  private registerHandler(
    eventType: string,
    handler: StripeEventHandler["handle"]
  ) {
    this.eventHandlers.set(eventType, handler);
  }

  /**
   * Process a Stripe webhook event
   */
  async processWebhookEvent(event: Stripe.Event): Promise<void> {
    // Get the handler for this event type
    const handler = this.eventHandlers.get(event.type);

    // Check if we've already processed this event
    const existingEvent =
      await this.billingStorage.getBillingEventByStripeEventId(event.id);
    if (existingEvent && existingEvent.status === "processed") {
      this.logger.info(`Event ${event.id} already processed, skipping`);
      return;
    }

    // Store the event
    this.logger.info("Creating billing event", {
      stripeEventId: event.id,
      eventType: event.type,
      stripeCustomerId: this.extractCustomerId(event),
    });

    const billingEvent = await this.billingStorage.createBillingEvent({
      stripeEventId: event.id,
      eventType: event.type as BillingEventType,
      eventData: event,
      stripeEventCreatedAt: new Date(event.created * 1000),
      stripeCustomerId: this.extractCustomerId(event) ?? null,
      userId: (await this.getUserIdFromEvent(event)) ?? null,
    });

    this.logger.info("Billing event created", {
      id: billingEvent.id,
      stripeEventId: billingEvent.stripeEventId,
      eventType: billingEvent.eventType,
      status: billingEvent.status,
    });

    // Only process and store events we have handlers for
    if (!handler) {
      this.logger.info(`No handler for event type ${event.type}, ignoring`);
      return;
    }

    try {
      await handler(event);

      // Mark as processed
      await this.billingStorage.updateBillingEvent(billingEvent.id, {
        status: "processed",
        processedAt: new Date(),
      });
    } catch (error) {
      // Mark as failed
      await this.billingStorage.updateBillingEvent(billingEvent.id, {
        status: "failed",
        processedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      });

      throw error; // Re-throw to let webhook handler deal with retry
    }
  }

  /**
   * Create a Stripe checkout session for subscription upgrade
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<Stripe.Checkout.Session> {
    const user = await this.userStorage.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id,
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      await this.userStorage.updateUser({
        ...user,
        stripeCustomerId: customerId,
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: user.id,
      },
    });

    return session;
  }

  /**
   * Create a Stripe customer portal session for subscription management
   */
  async createCustomerPortalSession(
    userId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    const user = await this.userStorage.getUserById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new Error("User not found or no Stripe customer");
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl,
    });

    return session;
  }

  /**
   * Get billing history for a user from Stripe
   */
  async getUserBillingHistory(
    userId: string,
    limit: number = 10
  ): Promise<Stripe.Invoice[]> {
    const user = await this.userStorage.getUserById(userId);
    if (!user || !user.stripeCustomerId) {
      return [];
    }

    const invoices = await this.stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit,
    });

    return invoices.data;
  }

  /**
   * Get the current subscription for a user
   */
  async getUserSubscription(
    userId: string
  ): Promise<Stripe.Subscription | null> {
    const user = await this.userStorage.getUserById(userId);
    if (!user || !user.stripeCustomerId) {
      return null;
    }

    const subscriptions = await this.stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 1,
    });

    return subscriptions.data[0] || null;
  }

  /**
   * Force sync a user's subscription status from Stripe
   * This is useful when webhooks may have been missed
   */
  async syncUserSubscription(
    userId: string
  ): Promise<{ tier: "free" | "premium"; message: string }> {
    this.logger.info("Force syncing subscription for user", { userId });

    const user = await this.userStorage.getUserById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get current local subscription status
    const currentLocalTier =
      await this.subscriptionService.getUserSubscriptionTier(userId);

    // If no Stripe customer ID, user is on free tier
    if (!user.stripeCustomerId) {
      this.logger.info("User has no Stripe customer ID, ensuring free tier", {
        userId,
      });

      if (currentLocalTier !== "free") {
        await this.subscriptionService.setUserSubscriptionTier(
          userId,
          "free",
          "sync"
        );
        return {
          tier: "free",
          message: "Synced to free tier (no Stripe customer)",
        };
      }

      return {
        tier: "free",
        message: "Already on free tier (no Stripe customer)",
      };
    }

    // Fetch active subscriptions from Stripe
    const subscriptions = await this.stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status: "active",
      limit: 10, // Get more to check all active subscriptions
    });

    // Check if any subscription contains the premium product
    let hasPremiumSubscription = false;
    let activeSubscription: Stripe.Subscription | null = null;

    for (const subscription of subscriptions.data) {
      const isPremium = subscription.items.data.some((item) => {
        const productId =
          typeof item.price.product === "string"
            ? item.price.product
            : item.price.product.id;
        return productId === this.premiumMonthlyStripeProductId;
      });

      if (isPremium) {
        hasPremiumSubscription = true;
        activeSubscription = subscription;
        break;
      }
    }

    this.logger.info("Subscription sync result", {
      userId,
      stripeCustomerId: user.stripeCustomerId,
      hasPremiumSubscription,
      activeSubscriptionId: activeSubscription?.id,
      currentLocalTier,
      subscriptionCount: subscriptions.data.length,
    });

    // Update local subscription tier based on Stripe status
    if (hasPremiumSubscription && activeSubscription) {
      if (currentLocalTier !== "premium") {
        this.logger.info("Upgrading user to premium tier (sync)", {
          userId,
          subscriptionId: activeSubscription.id,
        });

        await this.subscriptionService.setUserSubscriptionTier(
          userId,
          "premium",
          "sync"
        );

        return {
          tier: "premium",
          message: `Synced to premium tier! ✅`,
        };
      }

      return {
        tier: "premium",
        message: "Already on premium tier and in sync with Stripe",
      };
    } else {
      if (currentLocalTier !== "free") {
        this.logger.info("Downgrading user to free tier (sync)", {
          userId,
          reason: "No active premium subscription found",
        });

        await this.subscriptionService.setUserSubscriptionTier(
          userId,
          "free",
          "sync"
        );

        return {
          tier: "free",
          message: "Synced to free tier (no active premium subscription)",
        };
      }

      return {
        tier: "free",
        message: "Already on free tier and in sync with Stripe",
      };
    }
  }

  // Event handlers
  private async handleCustomerCreated(event: Stripe.Event) {
    const customer = event.data.object as unknown as StripeCustomer;

    if (customer.metadata.userId) {
      const user = await this.userStorage.getUserById(customer.metadata.userId);
      if (user && !user.stripeCustomerId) {
        await this.userStorage.updateUser({
          ...user,
          stripeCustomerId: customer.id,
        });
      }
    }
  }

  private async handleCustomerUpdated(event: Stripe.Event) {
    // Handle customer updates if needed
    const customer = event.data.object as unknown as StripeCustomer;
    this.logger.info(`Customer ${customer.id} updated`);
  }

  private async handleSubscriptionCreated(event: Stripe.Event) {
    const subscription = event.data.object as unknown as StripeSubscription;

    this.logger.info("Processing subscription created event", {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      items: subscription.items.data.map((item) => ({
        priceId: item.price.id,
        productId: item.price.product,
      })),
    });

    // Get the user by Stripe customer ID
    const user = await this.getUserByStripeCustomerId(
      subscription.customer as string
    );

    if (!user) {
      this.logger.error("User not found for subscription created event", {
        customerId: subscription.customer,
        subscriptionId: subscription.id,
      });
      return;
    }

    // Check if this is a premium subscription
    const isPremiumSubscription = subscription.items.data.some(
      (item) => item.price.product === this.premiumMonthlyStripeProductId
    );

    // Add debug logging
    this.logger.info("Checking if subscription is premium", {
      isPremiumSubscription,
      configuredProductId: this.premiumMonthlyStripeProductId,
      actualProductIds: subscription.items.data.map(
        (item) => item.price.product
      ),
      subscriptionId: subscription.id,
    });

    if (isPremiumSubscription && subscription.status === "active") {
      this.logger.info("Upgrading user to premium tier", {
        userId: user.id,
        subscriptionId: subscription.id,
      });

      try {
        await this.subscriptionService.setUserSubscriptionTier(
          user.id,
          "premium",
          "stripe" // actorId to indicate this was done by Stripe
        );

        this.logger.info("Successfully upgraded user to premium", {
          userId: user.id,
          subscriptionId: subscription.id,
        });
      } catch (error) {
        this.logger.error("Failed to upgrade user to premium", {
          userId: user.id,
          subscriptionId: subscription.id,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }

  private async handleSubscriptionUpdated(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;

    this.logger.info("Processing subscription updated event", {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      previousStatus: (event.data.previous_attributes as { status?: string })
        ?.status,
    });

    // Get the user by Stripe customer ID
    const user = await this.getUserByStripeCustomerId(
      subscription.customer as string
    );

    if (!user) {
      this.logger.error("User not found for subscription updated event", {
        customerId: subscription.customer,
        subscriptionId: subscription.id,
      });
      return;
    }

    // Check if this is a premium subscription
    const isPremiumSubscription = subscription.items.data.some(
      (item) => item.price.product === this.premiumMonthlyStripeProductId
    );

    // Add debug logging
    this.logger.info("Checking if subscription is premium", {
      isPremiumSubscription,
      configuredProductId: this.premiumMonthlyStripeProductId,
      actualProductIds: subscription.items.data.map(
        (item) => item.price.product
      ),
      subscriptionId: subscription.id,
    });

    if (isPremiumSubscription) {
      // Handle different subscription statuses
      switch (subscription.status) {
        case "active":
          // Check if subscription is set to cancel at period end
          if (subscription.cancel_at_period_end) {
            this.logger.info(
              "Subscription set to cancel at period end, maintaining premium access",
              {
                userId: user.id,
                subscriptionId: subscription.id,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                currentPeriodEnd:
                  subscription.items.data[0]?.current_period_end,
              }
            );
            // User keeps premium until period end
          } else {
            this.logger.info("Ensuring user has premium tier", {
              userId: user.id,
              subscriptionId: subscription.id,
            });

            await this.subscriptionService.setUserSubscriptionTier(
              user.id,
              "premium",
              "stripe"
            );
          }
          break;

        case "past_due":
          this.logger.warn("Subscription is past due", {
            userId: user.id,
            subscriptionId: subscription.id,
          });
          // Keep premium access during payment retry period
          break;

        case "canceled": {
          // Only downgrade if the subscription is truly canceled (not just scheduled to cancel)
          const previousStatus = (
            event.data.previous_attributes as { status?: string }
          )?.status;
          const wasCancelAtPeriodEnd = (
            event.data.previous_attributes as { cancel_at_period_end?: boolean }
          )?.cancel_at_period_end;

          this.logger.info("Subscription canceled", {
            userId: user.id,
            subscriptionId: subscription.id,
            previousStatus,
            wasCancelAtPeriodEnd,
            canceledAt: subscription.canceled_at,
            endedAt: subscription.ended_at,
          });

          // Downgrade to free tier when subscription is actually canceled
          this.logger.warn(
            "Downgrading user to free tier due to subscription cancellation",
            {
              userId: user.id,
              subscriptionId: subscription.id,
              status: subscription.status,
            }
          );

          await this.subscriptionService.setUserSubscriptionTier(
            user.id,
            "free",
            "stripe"
          );
          break;
        }

        case "unpaid":
          this.logger.warn(
            "Downgrading user to free tier due to unpaid subscription",
            {
              userId: user.id,
              subscriptionId: subscription.id,
              status: subscription.status,
            }
          );

          await this.subscriptionService.setUserSubscriptionTier(
            user.id,
            "free",
            "stripe"
          );
          break;

        default:
          this.logger.info("Subscription status changed", {
            userId: user.id,
            subscriptionId: subscription.id,
            status: subscription.status,
          });
      }
    }
  }

  private async handleSubscriptionDeleted(event: Stripe.Event) {
    const subscription = event.data.object as unknown as StripeSubscription;

    this.logger.info("Processing subscription deleted event", {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
    });

    // Get the user by Stripe customer ID
    const user = await this.getUserByStripeCustomerId(
      subscription.customer as string
    );

    if (!user) {
      this.logger.error("User not found for subscription deleted event", {
        customerId: subscription.customer,
        subscriptionId: subscription.id,
      });
      return;
    }

    // Check if this was a premium subscription
    const wasPremiumSubscription = subscription.items.data.some(
      (item) => item.price.product === this.premiumMonthlyStripeProductId
    );

    if (wasPremiumSubscription) {
      this.logger.info(
        "Downgrading user to free tier due to subscription deletion",
        {
          userId: user.id,
          subscriptionId: subscription.id,
        }
      );

      await this.subscriptionService.setUserSubscriptionTier(
        user.id,
        "free",
        "stripe"
      );
    }
  }

  private async handleSubscriptionTrialWillEnd(event: Stripe.Event) {
    const subscription = event.data.object as unknown as StripeSubscription;

    this.logger.info("Processing subscription trial will end event", {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      trialEnd: subscription.trial_end,
    });

    // Get the user by Stripe customer ID
    const user = await this.getUserByStripeCustomerId(
      subscription.customer as string
    );

    if (!user) {
      this.logger.error(
        "User not found for subscription trial will end event",
        {
          customerId: subscription.customer,
          subscriptionId: subscription.id,
        }
      );
      return;
    }

    // This is a good place to send a notification to the user
    // that their trial is ending soon
    this.logger.info("User trial ending soon", {
      userId: user.id,
      subscriptionId: subscription.id,
      trialEnd: subscription.trial_end,
    });

    // You could implement email notification here
  }

  private async handleCheckoutCompleted(event: Stripe.Event) {
    const session = event.data.object as unknown as StripeCheckoutSession;

    this.logger.info("Processing checkout completed event", {
      sessionId: session.id,
      customerId: session.customer,
      userId: session.metadata?.userId,
      mode: session.mode,
      paymentStatus: session.payment_status,
    });

    if (session.metadata?.userId && session.mode === "subscription") {
      // The subscription.created event will handle the actual upgrade
      this.logger.info("Checkout completed for subscription", {
        userId: session.metadata.userId,
        sessionId: session.id,
      });
    }
  }

  private async handleInvoicePaid(event: Stripe.Event) {
    const invoice = event.data.object as unknown as StripeInvoice;

    // Extract subscription ID from invoice lines
    let subscriptionId: string | undefined;

    // Check if invoice has lines with subscription information
    if (invoice.lines && invoice.lines.data.length > 0) {
      // Look for subscription in line items
      for (const line of invoice.lines.data) {
        if ("subscription" in line && line.subscription) {
          // Handle case where subscription might be string or expanded object
          subscriptionId =
            typeof line.subscription === "string"
              ? line.subscription
              : line.subscription.id;
          break;
        }
      }
    }

    this.logger.info("Processing invoice paid event", {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      function: "handleInvoicePaid",
    });

    // If this is for a subscription, ensure the user has premium access
    if (subscriptionId) {
      const user = await this.getUserByStripeCustomerId(
        invoice.customer as string
      );

      if (user) {
        const subscription =
          await this.stripe.subscriptions.retrieve(subscriptionId);

        this.logger.info("Subscription retrieved", {
          subscriptionId: subscription.id,
          customerId: subscription.customer,
          status: subscription.status,
          function: "handleInvoicePaid",
        });

        const isPremiumSubscription = subscription.items.data.some(
          (item) => item.price.product === this.premiumMonthlyStripeProductId
        );

        // Add debug logging
        this.logger.info("Checking if invoice is for premium subscription", {
          isPremiumSubscription,
          configuredProductId: this.premiumMonthlyStripeProductId,
          actualProductIds: subscription.items.data.map(
            (item) => item.price.product
          ),
          subscriptionId: subscription.id,
          invoiceId: invoice.id,
          function: "handleInvoicePaid",
        });

        if (isPremiumSubscription && subscription.status === "active") {
          this.logger.info(
            "Ensuring user has premium tier after successful payment",
            {
              userId: user.id,
              invoiceId: invoice.id,
              function: "handleInvoicePaid",
            }
          );

          await this.subscriptionService.setUserSubscriptionTier(
            user.id,
            "premium",
            "stripe"
          );
          this.logger.info("Successfully upgraded user to premium", {
            userId: user.id,
            invoiceId: invoice.id,
            function: "handleInvoicePaid",
          });
        } else {
          this.logger.info("User does not have a premium subscription", {
            userId: user.id,
            invoiceId: invoice.id,
            function: "handleInvoicePaid",
          });
        }
      } else {
        this.logger.info("User not found for invoice paid event", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
          subscriptionId,
          function: "handleInvoicePaid",
        });
      }
    } else {
      this.logger.info("Invoice is not for a subscription", {
        invoiceId: invoice.id,
        customerId: invoice.customer,
        subscriptionId,
        function: "handleInvoicePaid",
      });
    }
  }

  private async handleInvoicePaymentFailed(event: Stripe.Event) {
    const invoice = event.data.object as unknown as StripeInvoice;

    // Extract subscription ID from invoice lines
    let subscriptionId: string | undefined;
    if (invoice.lines && invoice.lines.data.length > 0) {
      for (const line of invoice.lines.data) {
        if ("subscription" in line && line.subscription) {
          subscriptionId =
            typeof line.subscription === "string"
              ? line.subscription
              : line.subscription.id;
          break;
        }
      }
    }

    this.logger.error("Processing invoice payment failed event", {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId,
      attemptCount: invoice.attempt_count,
      nextPaymentAttempt: invoice.next_payment_attempt,
    });

    // If this is for a subscription and it's the final attempt, downgrade the user
    if (subscriptionId && !invoice.next_payment_attempt) {
      const user = await this.getUserByStripeCustomerId(
        invoice.customer as string
      );

      if (user) {
        const subscription =
          await this.stripe.subscriptions.retrieve(subscriptionId);

        const isPremiumSubscription = subscription.items.data.some(
          (item) => item.price.product === this.premiumMonthlyStripeProductId
        );

        if (isPremiumSubscription) {
          this.logger.warn(
            "Downgrading user to free tier due to payment failure",
            {
              userId: user.id,
              invoiceId: invoice.id,
              subscriptionId,
            }
          );

          await this.subscriptionService.setUserSubscriptionTier(
            user.id,
            "free",
            "stripe"
          );
        }
      }
    }
  }

  private async handleInvoicePaymentActionRequired(event: Stripe.Event) {
    const invoice = event.data.object as unknown as StripeInvoice;

    // Extract subscription ID from invoice lines
    let subscriptionId: string | undefined;
    if (invoice.lines && invoice.lines.data.length > 0) {
      for (const line of invoice.lines.data) {
        if ("subscription" in line && line.subscription) {
          subscriptionId =
            typeof line.subscription === "string"
              ? line.subscription
              : line.subscription.id;
          break;
        }
      }
    }

    this.logger.info("Processing invoice payment action required event", {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      subscriptionId,
    });

    // If this is for a subscription, ensure the user has premium access
    if (subscriptionId) {
      const user = await this.getUserByStripeCustomerId(
        invoice.customer as string
      );

      if (user) {
        const subscription =
          await this.stripe.subscriptions.retrieve(subscriptionId);

        const isPremiumSubscription = subscription.items.data.some(
          (item) => item.price.product === this.premiumMonthlyStripeProductId
        );

        if (isPremiumSubscription && subscription.status === "active") {
          this.logger.info(
            "Ensuring user has premium tier after payment action required",
            {
              userId: user.id,
              invoiceId: invoice.id,
            }
          );

          await this.subscriptionService.setUserSubscriptionTier(
            user.id,
            "premium",
            "stripe"
          );
        }
      }
    }
  }

  private async handlePaymentIntentSucceeded(event: Stripe.Event) {
    const intent = event.data.object as unknown as StripePaymentIntent;

    this.logger.info("Processing payment intent succeeded event", {
      intentId: intent.id,
      customerId: intent.customer,
      amount: intent.amount,
      currency: intent.currency,
    });

    // If this is for a subscription, ensure the user has premium access
    if (intent.metadata?.subscriptionId) {
      const user = await this.getUserByStripeCustomerId(
        intent.customer as string
      );

      if (user) {
        const subscription = await this.stripe.subscriptions.retrieve(
          intent.metadata.subscriptionId as string
        );

        const isPremiumSubscription = subscription.items.data.some(
          (item) => item.price.product === this.premiumMonthlyStripeProductId
        );

        if (isPremiumSubscription && subscription.status === "active") {
          this.logger.info(
            "Ensuring user has premium tier after successful payment",
            {
              userId: user.id,
              intentId: intent.id,
            }
          );

          await this.subscriptionService.setUserSubscriptionTier(
            user.id,
            "premium",
            "stripe"
          );
        }
      }
    }
  }

  private async handlePaymentIntentFailed(event: Stripe.Event) {
    const intent = event.data.object as unknown as StripePaymentIntent;

    this.logger.error("Processing payment intent failed event", {
      intentId: intent.id,
      customerId: intent.customer,
      amount: intent.amount,
      currency: intent.currency,
    });

    // If this is for a subscription, ensure the user has premium access
    if (intent.metadata?.subscriptionId) {
      const user = await this.getUserByStripeCustomerId(
        intent.customer as string
      );

      if (user) {
        const subscription = await this.stripe.subscriptions.retrieve(
          intent.metadata.subscriptionId as string
        );

        const isPremiumSubscription = subscription.items.data.some(
          (item) => item.price.product === this.premiumMonthlyStripeProductId
        );

        if (isPremiumSubscription && subscription.status === "active") {
          this.logger.warn(
            "Downgrading user to free tier due to payment intent failure",
            {
              userId: user.id,
              intentId: intent.id,
            }
          );

          await this.subscriptionService.setUserSubscriptionTier(
            user.id,
            "free",
            "stripe"
          );
        }
      }
    }
  }

  // Helper methods
  private extractCustomerId(event: Stripe.Event): string | undefined {
    const obj = event.data.object as unknown as Record<string, unknown>;
    return (obj.customer as string) || (obj.id as string);
  }

  private async getUserIdFromEvent(
    event: Stripe.Event
  ): Promise<string | undefined> {
    const obj = event.data.object as unknown as Record<string, unknown>;

    // Check metadata first
    if (
      obj.metadata &&
      typeof obj.metadata === "object" &&
      "userId" in obj.metadata
    ) {
      return obj.metadata.userId as string;
    }

    // Try to find by customer ID
    const customerId = this.extractCustomerId(event);
    if (customerId) {
      const user = await this.getUserByStripeCustomerId(customerId);
      return user?.id;
    }

    return undefined;
  }

  private async getUserByStripeCustomerId(
    customerId: string
  ): Promise<User | null> {
    this.logger.info(`Looking up user by Stripe customer ID: ${customerId}`);
    return await this.userStorage.getUserByStripeCustomerId(customerId);
  }

  // New handlers for additional events
  private async handleInvoiceCreated(event: Stripe.Event) {
    const invoice = event.data.object as unknown as StripeInvoice;

    this.logger.info("Processing invoice created event", {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      total: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    });

    // No action needed - just log for audit trail
  }

  private async handleInvoiceFinalized(event: Stripe.Event) {
    const invoice = event.data.object as unknown as StripeInvoice;

    this.logger.info("Processing invoice finalized event", {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      total: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    });

    // No action needed - just log for audit trail
  }

  private async handleInvoiceUpdated(event: Stripe.Event) {
    const invoice = event.data.object as unknown as StripeInvoice;

    this.logger.info("Processing invoice updated event", {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      total: invoice.total,
      currency: invoice.currency,
      status: invoice.status,
    });

    // No action needed - just log for audit trail
  }

  private async handlePaymentIntentCreated(event: Stripe.Event) {
    const intent = event.data.object as unknown as StripePaymentIntent;

    this.logger.info("Processing payment intent created event", {
      intentId: intent.id,
      customerId: intent.customer,
      amount: intent.amount,
      currency: intent.currency,
      status: intent.status,
    });

    // No action needed - just log for audit trail
  }

  private async handleChargeSucceeded(event: Stripe.Event) {
    const charge = event.data.object as unknown as StripeCharge;

    this.logger.info("Processing charge succeeded event", {
      chargeId: charge.id,
      customerId: charge.customer,
      amount: charge.amount,
      currency: charge.currency,
      paymentIntentId: charge.payment_intent,
    });

    // No action needed - the invoice.paid event handles subscription logic
  }

  private async handlePaymentMethodAttached(event: Stripe.Event) {
    const paymentMethod = event.data.object as unknown as StripePaymentMethod;

    this.logger.info("Processing payment method attached event", {
      paymentMethodId: paymentMethod.id,
      customerId: paymentMethod.customer,
      type: paymentMethod.type,
      card: paymentMethod.card
        ? {
            brand: paymentMethod.card.brand,
            last4: paymentMethod.card.last4,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          }
        : undefined,
    });

    // No action needed - just log for audit trail
  }
}
