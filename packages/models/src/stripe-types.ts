import { z } from "zod";

// Common metadata schemas
export const stripeMetadataSchema = z
  .object({
    userId: z.string().optional(),
    subscriptionId: z.string().optional(),
  })
  .passthrough(); // Allow additional properties

// Customer object schema
export const stripeCustomerSchema = z
  .object({
    id: z.string(),
    email: z.string().nullable(),
    metadata: stripeMetadataSchema,
  })
  .passthrough();

// Price object schema
export const stripePriceSchema = z
  .object({
    id: z.string(),
    product: z.string(),
    unit_amount: z.number().nullable(),
    currency: z.string(),
  })
  .passthrough();

// Subscription item schema
export const stripeSubscriptionItemSchema = z
  .object({
    id: z.string(),
    price: stripePriceSchema,
    quantity: z.number().optional(),
  })
  .passthrough();

// Subscription object schema
export const stripeSubscriptionSchema = z
  .object({
    id: z.string(),
    customer: z.union([z.string(), stripeCustomerSchema]),
    status: z.enum([
      "active",
      "canceled",
      "incomplete",
      "incomplete_expired",
      "past_due",
      "paused",
      "trialing",
      "unpaid",
    ]),
    items: z.object({
      data: z.array(stripeSubscriptionItemSchema),
    }),
    trial_end: z.number().nullable(),
    metadata: stripeMetadataSchema,
  })
  .passthrough();

// Invoice line item schema
export const stripeInvoiceLineItemSchema = z
  .object({
    id: z.string(),
    subscription: z.union([z.string(), stripeSubscriptionSchema]).optional(),
    price: stripePriceSchema.optional(),
  })
  .passthrough();

// Invoice object schema
export const stripeInvoiceSchema = z
  .object({
    id: z.string(),
    customer: z.union([z.string(), stripeCustomerSchema]),
    subscription: z.union([z.string(), stripeSubscriptionSchema]).nullable(),
    lines: z
      .object({
        data: z.array(stripeInvoiceLineItemSchema),
      })
      .optional(),
    amount_paid: z.number(),
    amount_due: z.number(),
    total: z.number(),
    currency: z.string(),
    status: z.string().nullable(),
    attempt_count: z.number(),
    next_payment_attempt: z.number().nullable(),
    metadata: stripeMetadataSchema,
  })
  .passthrough();

// Checkout session schema
export const stripeCheckoutSessionSchema = z
  .object({
    id: z.string(),
    customer: z.union([z.string(), stripeCustomerSchema]).nullable(),
    mode: z.enum(["payment", "setup", "subscription"]),
    payment_status: z.string(),
    metadata: stripeMetadataSchema,
  })
  .passthrough();

// Payment intent schema
export const stripePaymentIntentSchema = z
  .object({
    id: z.string(),
    customer: z.union([z.string(), stripeCustomerSchema]).nullable(),
    amount: z.number(),
    currency: z.string(),
    status: z.string(),
    metadata: stripeMetadataSchema,
  })
  .passthrough();

// Charge schema
export const stripeChargeSchema = z
  .object({
    id: z.string(),
    customer: z.union([z.string(), stripeCustomerSchema]).nullable(),
    amount: z.number(),
    currency: z.string(),
    payment_intent: z.string().nullable(),
    metadata: stripeMetadataSchema,
  })
  .passthrough();

// Payment method card schema
export const stripePaymentMethodCardSchema = z
  .object({
    brand: z.string(),
    last4: z.string(),
    exp_month: z.number(),
    exp_year: z.number(),
  })
  .passthrough();

// Payment method schema
export const stripePaymentMethodSchema = z
  .object({
    id: z.string(),
    customer: z.union([z.string(), stripeCustomerSchema]).nullable(),
    type: z.string(),
    card: stripePaymentMethodCardSchema.optional(),
    metadata: stripeMetadataSchema,
  })
  .passthrough();

// Event data object schema - union of all possible event objects
export const stripeEventDataObjectSchema = z.union([
  stripeCustomerSchema,
  stripeSubscriptionSchema,
  stripeInvoiceSchema,
  stripeCheckoutSessionSchema,
  stripePaymentIntentSchema,
  stripeChargeSchema,
  stripePaymentMethodSchema,
]);

// Event previous attributes schema
export const stripePreviousAttributesSchema = z
  .object({
    status: z.string().optional(),
  })
  .passthrough();

// Stripe Event schema
export const stripeEventSchema = z.object({
  id: z.string(),
  type: z.string(),
  created: z.number(),
  data: z.object({
    object: stripeEventDataObjectSchema,
    previous_attributes: stripePreviousAttributesSchema.optional(),
  }),
});

export type StripeMetadata = z.infer<typeof stripeMetadataSchema>;
export type StripeCustomer = z.infer<typeof stripeCustomerSchema>;
export type StripeSubscription = z.infer<typeof stripeSubscriptionSchema>;
export type StripeInvoice = z.infer<typeof stripeInvoiceSchema>;
export type StripeCheckoutSession = z.infer<typeof stripeCheckoutSessionSchema>;
export type StripePaymentIntent = z.infer<typeof stripePaymentIntentSchema>;
export type StripeCharge = z.infer<typeof stripeChargeSchema>;
export type StripePaymentMethod = z.infer<typeof stripePaymentMethodSchema>;
export type StripeEvent = z.infer<typeof stripeEventSchema>;
