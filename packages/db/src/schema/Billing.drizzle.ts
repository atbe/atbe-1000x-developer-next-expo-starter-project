import { jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { appSchema } from "./AppSchema.drizzle";
import { UsersDatabaseSchema } from "./User.drizzle";

// Enum for billing event types - includes all common Stripe webhook event types
export const billingEventTypeEnum = appSchema.enum("billing_event_type", [
  // Account events
  "account.updated",
  "account.application.authorized",
  "account.application.deauthorized",
  "account.external_account.created",
  "account.external_account.deleted",
  "account.external_account.updated",

  // Balance events
  "balance.available",

  // Billing portal events
  "billing_portal.configuration.created",
  "billing_portal.configuration.updated",
  "billing_portal.session.created",

  // Charge events
  "charge.captured",
  "charge.expired",
  "charge.failed",
  "charge.pending",
  "charge.refunded",
  "charge.succeeded",
  "charge.updated",
  "charge.dispute.closed",
  "charge.dispute.created",
  "charge.dispute.funds_reinstated",
  "charge.dispute.funds_withdrawn",
  "charge.dispute.updated",
  "charge.refund.updated",

  // Checkout events
  "checkout.session.async_payment_failed",
  "checkout.session.async_payment_succeeded",
  "checkout.session.completed",
  "checkout.session.expired",

  // Customer events
  "customer.created",
  "customer.deleted",
  "customer.updated",
  "customer.discount.created",
  "customer.discount.deleted",
  "customer.discount.updated",
  "customer.source.created",
  "customer.source.deleted",
  "customer.source.expiring",
  "customer.source.updated",
  "customer.subscription.created",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.pending_update_applied",
  "customer.subscription.pending_update_expired",
  "customer.subscription.resumed",
  "customer.subscription.trial_will_end",
  "customer.subscription.updated",
  "customer.tax_id.created",
  "customer.tax_id.deleted",
  "customer.tax_id.updated",

  // Invoice events
  "invoice.created",
  "invoice.deleted",
  "invoice.finalization_failed",
  "invoice.finalized",
  "invoice.marked_uncollectible",
  "invoice.paid",
  "invoice.payment_action_required",
  "invoice.payment_failed",
  "invoice.payment_succeeded",
  "invoice.sent",
  "invoice.upcoming",
  "invoice.updated",
  "invoice.voided",
  "invoiceitem.created",
  "invoiceitem.deleted",
  "invoice_payment.paid",

  // Payment intent events
  "payment_intent.amount_capturable_updated",
  "payment_intent.canceled",
  "payment_intent.created",
  "payment_intent.partially_funded",
  "payment_intent.payment_failed",
  "payment_intent.processing",
  "payment_intent.requires_action",
  "payment_intent.succeeded",

  // Payment method events
  "payment_method.attached",
  "payment_method.automatically_updated",
  "payment_method.detached",
  "payment_method.updated",

  // Payout events
  "payout.canceled",
  "payout.created",
  "payout.failed",
  "payout.paid",
  "payout.reconciliation_completed",
  "payout.updated",

  // Plan events
  "plan.created",
  "plan.deleted",
  "plan.updated",

  // Price events
  "price.created",
  "price.deleted",
  "price.updated",

  // Product events
  "product.created",
  "product.deleted",
  "product.updated",

  // Setup intent events
  "setup_intent.canceled",
  "setup_intent.created",
  "setup_intent.requires_action",
  "setup_intent.setup_failed",
  "setup_intent.succeeded",

  // Subscription schedule events
  "subscription_schedule.aborted",
  "subscription_schedule.canceled",
  "subscription_schedule.completed",
  "subscription_schedule.created",
  "subscription_schedule.expiring",
  "subscription_schedule.released",
  "subscription_schedule.updated",

  // Tax rate events
  "tax_rate.created",
  "tax_rate.updated",

  // Transfer events
  "transfer.created",
  "transfer.reversed",
  "transfer.updated",
]);

// Enum for billing event status
export const billingEventStatusEnum = appSchema.enum("billing_event_status", [
  "pending",
  "processed",
  "failed",
  "ignored",
]);

export const BillingEventsDatabaseSchema = appSchema.table("billing_events", {
  id: uuid("id").primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  userId: uuid("user_id").references(() => UsersDatabaseSchema.id, {
    onDelete: "set null",
  }),
  stripeCustomerId: text("stripe_customer_id"),
  eventType: billingEventTypeEnum("event_type").notNull(),
  status: billingEventStatusEnum("status").notNull().default("pending"),
  eventData: jsonb("event_data").notNull(),
  stripeEventCreatedAt: timestamp("stripe_event_created_at", {
    withTimezone: true,
  }).notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
