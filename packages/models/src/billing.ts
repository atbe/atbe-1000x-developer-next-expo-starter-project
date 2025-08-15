import { z } from "zod";

// Billing event type schema - includes all common Stripe webhook event types
export const billingEventTypeSchema = z.enum([
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

export type BillingEventType = z.infer<typeof billingEventTypeSchema>;

// Billing event status schema
export const billingEventStatusSchema = z.enum([
  "pending",
  "processed",
  "failed",
  "ignored",
]);

export type BillingEventStatus = z.infer<typeof billingEventStatusSchema>;

// Billing event schema
export const billingEventSchema = z.object({
  id: z.string(),
  stripeEventId: z.string(),
  userId: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  eventType: billingEventTypeSchema,
  status: billingEventStatusSchema,
  eventData: z.any(), // Stripe event object
  stripeEventCreatedAt: z.date(),
  processedAt: z.date().nullable(),
  error: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type BillingEvent = z.infer<typeof billingEventSchema>;

// Create billing event input schema
export const createBillingEventInputSchema = z.object({
  stripeEventId: z.string(),
  userId: z.string().optional(),
  stripeCustomerId: z.string().optional(),
  eventType: billingEventTypeSchema,
  eventData: z.any(), // Stripe event object
  stripeEventCreatedAt: z.date(),
});

export type CreateBillingEventInput = z.infer<
  typeof createBillingEventInputSchema
>;

// Update billing event input schema
export const updateBillingEventInputSchema = z.object({
  status: billingEventStatusSchema.optional(),
  processedAt: z.date().optional(),
  error: z.string().optional(),
  userId: z.string().optional(),
});

export type UpdateBillingEventInput = z.infer<
  typeof updateBillingEventInputSchema
>;
